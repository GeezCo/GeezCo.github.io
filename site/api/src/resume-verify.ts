import { createHmac } from "crypto";
import {
  getTempPassword,
  setTempPassword,
  generateTempPassword,
  isLocked,
  checkRate,
  recordFailure,
  resetRate,
  getLockouts,
  unlockDevice,
} from "./shared-state";

const SECRET = process.env.SITE_SECRET!;
const PASSWORD = process.env.RESUME_PASSWORD!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

const TEMP_PASSWORD_TTL = 10 * 60 * 1000; // 10 分钟

function generateToken(): string {
  const timestamp = Date.now().toString();
  const hmac = createHmac("sha256", SECRET).update(timestamp).digest("hex");
  return `${timestamp}:${hmac}`;
}

function isValidPassword(input: string): boolean {
  if (input === PASSWORD) return true;
  const temp = getTempPassword();
  if (temp && input === temp.password) return true;
  return false;
}

function verifyAdminToken(token: string): boolean {
  if (!ADMIN_TOKEN) return false;
  return token === ADMIN_TOKEN;
}

// FC 3.0 内置 runtime HTTP 触发器传递 event 的方式:
// event 是一个类 Buffer 对象（数字索引的 Uint8Array），其内容可能是:
// 1. 结构化 JSON (API Gateway 格式: {version, rawPath, headers, body, ...})
// 2. 原始 HTTP 请求 body (如 {"password":"xxx"})
// 3. 空数据 (GET 请求)
//
// 不能用 "body" in event 来检测，因为类 Buffer 对象的 in 操作符检查的是
// 数字索引属性而非 JSON 内容。必须先转为字符串再解析。
function parseRequestBody(event: any): { body: any; method: string; path: string } {
  if (typeof event !== "object" || event === null) {
    return { body: {}, method: "POST", path: "/" };
  }

  // 先尝试作为 Buffer 解析
  try {
    const buf = Buffer.from(event as Uint8Array);
    const str = buf.toString("utf-8");

    if (!str) return { body: {}, method: "GET", path: "/" }; // 空 body（GET 请求）

    const parsed = JSON.parse(str);

    // 提取 HTTP method
    let method = "POST";
    if (parsed.requestContext?.http?.method) {
      method = parsed.requestContext.http.method;
    } else if (parsed.httpMethod) {
      method = parsed.httpMethod;
    }

    // 提取路径
    let path = "/";
    if (parsed.rawPath) {
      path = parsed.rawPath;
    } else if (parsed.path) {
      path = parsed.path;
    }

    // 如果解析结果是 API Gateway 格式（有 version/body 字段），提取真正的 body
    if (parsed.version && parsed.body !== undefined) {
      const innerBody = parsed.body;
      if (parsed.isBase64Encoded) {
        const decoded = Buffer.from(innerBody, "base64").toString("utf-8");
        return { body: decoded ? JSON.parse(decoded) : {}, method, path };
      }
      return {
        body: typeof innerBody === "string" ? (innerBody ? JSON.parse(innerBody) : {}) : innerBody,
        method,
        path,
      };
    }

    // 解析结果就是原始 body（如 {"password":"xxx"})
    return { body: parsed, method, path };
  } catch {
    // 不是 Buffer，可能是普通对象
    if (event.body !== undefined) {
      const method = event.httpMethod || event.requestContext?.http?.method || "POST";
      const path = event.rawPath || event.path || "/";
      const rawBody = event.body || "";
      const isBase64 = event.isBase64Encoded || false;
      if (isBase64) {
        const decoded = Buffer.from(rawBody, "base64").toString("utf-8");
        return { body: decoded ? JSON.parse(decoded) : {}, method, path };
      }
      return {
        body: typeof rawBody === "string" ? (rawBody ? JSON.parse(rawBody) : {}) : rawBody,
        method,
        path,
      };
    }
    return { body: {}, method: "POST", path: "/" };
  }
}

function parseQueryParams(event: any): Record<string, string> {
  try {
    const buf = Buffer.from(event as Uint8Array);
    const str = buf.toString("utf-8");
    if (!str) return {};

    const parsed = JSON.parse(str);
    if (parsed.queryParameters) {
      const qp: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.queryParameters)) {
        qp[k] = String(v);
      }
      return qp;
    }
  } catch {}
  return {};
}

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handler(event: any, context: any): Promise<any> {
  const { body, method, path } = parseRequestBody(event);
  const queryParameters = parseQueryParams(event);

  // 处理 OPTIONS 预检请求
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  // 路由：管理员 API
  if (path === "/admin" || queryParameters["action"]) {
    return handleAdmin(event, body, method, queryParameters);
  }

  // 路由：密码验证（默认）
  return handleVerify(event, body);
}

// ========== 密码验证处理器 ==========
async function handleVerify(event: any, body: any): Promise<any> {
  if (!PASSWORD || !SECRET) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Not configured" }),
    };
  }

  // 提取 clientIP 和设备指纹
  let ip = "127.0.0.1";
  let fingerprint = "";
  try {
    const buf = Buffer.from(event as Uint8Array);
    const str = buf.toString("utf-8");
    if (str) {
      const parsed = JSON.parse(str);
      if (parsed.requestContext) {
        ip = parsed.requestContext.clientIP || ip;
      }
    }
  } catch {}

  const password: string = body?.password;
  fingerprint = body?.fingerprint || "";

  // 检查长期锁定（1 天）
  const lockStatus = isLocked(ip, fingerprint);
  if (lockStatus.locked) {
    const remainingMs = lockStatus.unlockTime! - Date.now();
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    return {
      statusCode: 423,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `已锁定，请等待 ${hours} 小时 ${minutes} 分钟后解锁`,
        lockedUntil: lockStatus.unlockTime,
      }),
    };
  }

  // 检查短期频率限制（15 分钟）
  if (!checkRate(ip)) {
    return {
      statusCode: 429,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "请求过于频繁，请15分钟后再试" }),
    };
  }

  if (!password || !isValidPassword(password)) {
    recordFailure(ip, fingerprint);
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "密码错误" }),
    };
  }

  resetRate(ip);
  const token = generateToken();
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ token }),
  };
}

// ========== 管理员 API 处理器 ==========
async function handleAdmin(
  event: any,
  body: any,
  method: string,
  queryParameters: Record<string, string>
): Promise<any> {
  if (!SECRET || !ADMIN_TOKEN) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Not configured" }),
    };
  }

  const token = queryParameters["token"] || body?.token || "";
  if (!verifyAdminToken(token)) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const action = queryParameters["action"] || body?.action || "";

  if (method === "GET") {
    if (action === "get-password") {
      const temp = getTempPassword();
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          tempPassword: temp ? { password: temp.password, expiresAt: temp.expiresAt } : null,
        }),
      };
    }

    if (action === "list-locks") {
      const lockouts = getLockouts();
      const now = Date.now();

      const ips = Array.from(lockouts.ips.entries())
        .filter(([_, unlockTime]) => now < unlockTime)
        .map(([ip, unlockTime]) => ({ ip, unlockTime }));

      const fingerprints = Array.from(lockouts.fingerprints.entries())
        .filter(([_, unlockTime]) => now < unlockTime)
        .map(([fingerprint, unlockTime]) => ({ fingerprint, unlockTime }));

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ips, fingerprints }),
      };
    }

    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid action" }),
    };
  }

  if (method === "POST") {
    if (action === "generate-password") {
      const password = generateTempPassword();
      const expiresAt = Date.now() + TEMP_PASSWORD_TTL;
      setTempPassword(password, expiresAt);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ password, expiresAt }),
      };
    }

    if (action === "unlock") {
      const ip = body?.ip;
      const fingerprint = body?.fingerprint;

      if (!ip && !fingerprint) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "Missing ip or fingerprint" }),
        };
      }

      unlockDevice(ip, fingerprint);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid action" }),
    };
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
}