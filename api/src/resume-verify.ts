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

// FC 3.0 内置 runtime HTTP 触发器: event 是原始 HTTP 请求 body Buffer
// 如果是 Buffer 或数字索引对象，解析为 JSON body
// 如果是结构化对象（有 headers/body 字段），按 API Gateway 格式解析
function parseRequestBody(event: any): any {
  // Buffer 或类 Buffer（数字索引对象）
  if (Buffer.isBuffer(event) || (typeof event === "object" && event !== null && !("body" in event) && Object.keys(event).every(k => /^\d+$/.test(k)))) {
    const buf = Buffer.isBuffer(event) ? event : Buffer.from(Object.values(event) as number[]);
    const str = buf.toString("utf-8");
    return str ? JSON.parse(str) : {};
  }

  // 结构化 event（FC 2.0 或自定义 runtime）
  const rawBody = event.body || "";
  const isBase64 = event.isBase64Encoded || false;
  if (isBase64) {
    const decoded = Buffer.from(rawBody, "base64").toString("utf-8");
    return decoded ? JSON.parse(decoded) : {};
  }
  return typeof rawBody === "string" ? (rawBody ? JSON.parse(rawBody) : {}) : rawBody;
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
  const ip = "127.0.0.1"; // FC 内置 runtime 没有 request context，IP 不可获取

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