import { createHmac } from "node:crypto";

export const prerender = false;

const SECRET = import.meta.env.RESUME_SECRET;
const PASSWORD = import.meta.env.RESUME_PASSWORD;

// 内存 IP 频率限制
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 分钟
const rateMap = new Map<string, { count: number; resetAt: number }>();

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

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

export async function POST({ request }: { request: Request }) {
  if (!PASSWORD || !SECRET) {
    return new Response("Not configured", { status: 500 });
  }

  const ip = getClientIP(request);

  if (!checkRate(ip)) {
    return new Response(
      JSON.stringify({ error: "请求过于频繁，请15分钟后再试" }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let password: string;
  try {
    ({ password } = await request.json());
  } catch {
    recordFailure(ip);
    return new Response(JSON.stringify({ error: "密码错误" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isValidPassword(password)) {
    recordFailure(ip);
    return new Response(JSON.stringify({ error: "密码错误" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  resetRate(ip);
  const token = generateToken();
  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}