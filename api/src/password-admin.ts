import { createHmac } from "crypto";
import {
  setTempPassword,
  getTempPassword,
  generateTempPassword,
  getLockouts,
  unlockDevice,
} from "./shared-state";

const SECRET = process.env.SITE_SECRET!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

const TEMP_PASSWORD_TTL = 10 * 60 * 1000; // 10 分钟

function verifyAdminToken(token: string): boolean {
  if (!ADMIN_TOKEN) return false;
  return token === ADMIN_TOKEN;
}

// FC 3.0 内置 runtime HTTP 触发器: event 是类 Buffer 对象
function parseEvent(event: any): {
  queryParameters: Record<string, string>;
  headers: Record<string, string>;
  body: any;
  method: string;
} {
  if (typeof event !== "object" || event === null) {
    return { queryParameters: {}, headers: {}, body: {}, method: "GET" };
  }

  try {
    const buf = Buffer.from(event as Uint8Array);
    const str = buf.toString("utf-8");

    if (!str) return { queryParameters: {}, headers: {}, body: {}, method: "GET" };

    const parsed = JSON.parse(str);

    // 提取 HTTP method
    let method = "GET";
    if (parsed.requestContext?.http?.method) {
      method = parsed.requestContext.http.method;
    } else if (parsed.httpMethod) {
      method = parsed.httpMethod;
    }

    // API Gateway 格式
    if (parsed.version && parsed.queryParameters !== undefined) {
      const headers: Record<string, string> = {};
      if (parsed.headers) {
        for (const [k, v] of Object.entries(parsed.headers)) {
          if (Array.isArray(v)) {
            headers[k] = v.join(", ");
          } else {
            headers[k] = String(v);
          }
        }
      }
      const qp: Record<string, string> = {};
      if (parsed.queryParameters) {
        for (const [k, v] of Object.entries(parsed.queryParameters)) {
          qp[k] = String(v);
        }
      }

      // 解析 body
      let body = {};
      if (parsed.body) {
        const rawBody = parsed.body;
        if (parsed.isBase64Encoded) {
          const decoded = Buffer.from(rawBody, "base64").toString("utf-8");
          body = decoded ? JSON.parse(decoded) : {};
        } else {
          body = typeof rawBody === "string" ? (rawBody ? JSON.parse(rawBody) : {}) : rawBody;
        }
      }

      return { queryParameters: qp, headers, body, method };
    }

    // 原始 JSON body
    return { queryParameters: {}, headers: {}, body: parsed, method };
  } catch {
    return { queryParameters: {}, headers: {}, body: {}, method: "GET" };
  }
}

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handler(event: any, context: any): Promise<any> {
  const { queryParameters, body, method } = parseEvent(event);

  // 处理 OPTIONS 预检请求
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  if (!SECRET || !ADMIN_TOKEN) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Not configured" }),
    };
  }

  // 验证管理员 token
  const token = queryParameters["token"] || body?.token || "";
  if (!verifyAdminToken(token)) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const action = queryParameters["action"] || body?.action || "";

  // GET 请求：查询当前密码或锁定列表
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

  // POST 请求：生成新密码或解锁设备
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
