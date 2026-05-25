import { createHmac } from "crypto";

const SECRET = process.env.SITE_SECRET!;
const PASSWORD = process.env.RESUME_PASSWORD!;

// 内存 IP 频率限制
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 分钟
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const entry = rateMap.get(ip);
  if (!entry) return true;
  if (Date.now() > entry.resetAt) {
    rateMap.delete(ip);
    return true;
  }
  return entry.count < MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const entry = rateMap.get(ip);
  if (!entry || Date.now() > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: Date.now() + LOCKOUT_MS });
  } else {
    entry.count += 1;
  }
}

function resetRate(ip: string): void {
  rateMap.delete(ip);
}

function generateToken(): string {
  const timestamp = Date.now().toString();
  const hmac = createHmac("sha256", SECRET).update(timestamp).digest("hex");
  return `${timestamp}:${hmac}`;
}

/** 生成动态密码：HMAC-SHA256(datetime, secret) 前 8 位，每小时轮换 */
function hourlyPassword(): string {
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13).replace("T", "-"); // YYYY-MM-DD-HH
  return createHmac("sha256", SECRET).update(hourKey).digest("hex").slice(0, 8);
}

function isValidPassword(input: string): boolean {
  return input === PASSWORD || input === hourlyPassword();
}

// FC 3.0 内置 runtime HTTP 触发器传递 event 的方式:
// event 是一个类 Buffer 对象（数字索引的 Uint8Array），其内容可能是:
// 1. 结构化 JSON (API Gateway 格式: {version, rawPath, headers, body, ...})
// 2. 原始 HTTP 请求 body (如 {"password":"xxx"})
// 3. 空数据 (GET 请求)
//
// 不能用 "body" in event 来检测，因为类 Buffer 对象的 in 操作符检查的是
// 数字索引属性而非 JSON 内容。必须先转为字符串再解析。
function parseRequestBody(event: any): any {
  if (typeof event !== "object" || event === null) return {};

  // 先尝试作为 Buffer 解析
  try {
    const buf = Buffer.from(event as Uint8Array);
    const str = buf.toString("utf-8");

    if (!str) return {}; // 空 body（GET 请求）

    const parsed = JSON.parse(str);

    // 如果解析结果是 API Gateway 格式（有 version/body 字段），提取真正的 body
    if (parsed.version && parsed.body !== undefined) {
      const innerBody = parsed.body;
      if (parsed.isBase64Encoded) {
        const decoded = Buffer.from(innerBody, "base64").toString("utf-8");
        return decoded ? JSON.parse(decoded) : {};
      }
      return typeof innerBody === "string" ? (innerBody ? JSON.parse(innerBody) : {}) : innerBody;
    }

    // 解析结果就是原始 body（如 {"password":"xxx"})
    return parsed;
  } catch {
    // 不是 Buffer，可能是普通对象
    if (event.body !== undefined) {
      const rawBody = event.body || "";
      const isBase64 = event.isBase64Encoded || false;
      if (isBase64) {
        const decoded = Buffer.from(rawBody, "base64").toString("utf-8");
        return decoded ? JSON.parse(decoded) : {};
      }
      return typeof rawBody === "string" ? (rawBody ? JSON.parse(rawBody) : {}) : rawBody;
    }
    return {};
  }
}

export async function handler(event: any, context: any): Promise<any> {
  if (!PASSWORD || !SECRET) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Not configured" }),
    };
  }

  const body = parseRequestBody(event);

  // 提取 clientIP（如果 event 是 API Gateway 格式）
  let ip = "127.0.0.1";
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

  if (!checkRate(ip)) {
    return {
      statusCode: 429,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "请求过于频繁，请15分钟后再试" }),
    };
  }

  const password: string = body?.password;

  if (!password || !isValidPassword(password)) {
    recordFailure(ip);
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "密码错误" }),
    };
  }

  resetRate(ip);
  const token = generateToken();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  };
}