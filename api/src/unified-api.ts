import { createHmac } from "crypto";
import {
  setTempPassword,
  getTempPassword,
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

// ========== 通用工具函数 ==========

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

// ========== 请求解析 ==========

function parseRequestBody(event: any): { body: any; method: string; path: string } {
  if (typeof event !== "object" || event === null) {
    return { body: {}, method: "POST", path: "/" };
  }

  try {
    const buf = Buffer.from(event as Uint8Array);
    const str = buf.toString("utf-8");

    if (!str) return { body: {}, method: "GET", path: "/" };

    const parsed = JSON.parse(str);

    let method = "POST";
    if (parsed.requestContext?.http?.method) {
      method = parsed.requestContext.http.method;
    } else if (parsed.httpMethod) {
      method = parsed.httpMethod;
    }

    let path = "/";
    if (parsed.rawPath) {
      path = parsed.rawPath;
    } else if (parsed.path) {
      path = parsed.path;
    }

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

    return { body: parsed, method, path };
  } catch {
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

function extractClientIP(event: any): string {
  try {
    const buf = Buffer.from(event as Uint8Array);
    const str = buf.toString("utf-8");
    if (str) {
      const parsed = JSON.parse(str);
      if (parsed.requestContext?.clientIP) {
        return parsed.requestContext.clientIP;
      }
    }
  } catch {}
  return "127.0.0.1";
}

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ========== 路由处理器 ==========

async function handleVerify(event: any): Promise<any> {
  const { body, method } = parseRequestBody(event);

  if (method === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (!PASSWORD || !SECRET) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Not configured" }),
    };
  }

  const ip = extractClientIP(event);
  const password: string = body?.password;
  const fingerprint = body?.fingerprint || "";

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

async function handleAdmin(event: any): Promise<any> {
  const { body, method } = parseRequestBody(event);
  const queryParameters = parseQueryParams(event);

  if (method === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

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

// ========== 主路由 ==========

export async function handler(event: any, context: any): Promise<any> {
  const { path } = parseRequestBody(event);

  // 路由分发
  if (path === "/verify" || path === "/") {
    return handleVerify(event);
  }

  if (path === "/admin") {
    return handleAdmin(event);
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Not found" }),
  };
}
