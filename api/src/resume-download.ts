import { createHash, createDecipheriv, createHmac } from "crypto";
import { readFileSync } from "fs";
import path from "path";

const SECRET = process.env.SITE_SECRET!;

// 从 SITE_SECRET 派生 AES-256 密钥
let aesKey: Buffer | null = null;
function getAesKey(): Buffer {
  if (!aesKey) {
    aesKey = createHash("sha256").update(SECRET).digest();
  }
  return aesKey;
}

function decrypt(encrypted: Uint8Array): Buffer {
  if (encrypted.length < 28) {
    throw new Error("Encrypted file too small");
  }

  // 格式: IV(12) + AuthTag(16) + Ciphertext
  const iv = encrypted.subarray(0, 12);
  const authTag = encrypted.subarray(12, 28);
  const ciphertext = encrypted.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", getAesKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

const TOKEN_TTL = 5 * 60 * 1000; // 5 分钟

function verifyToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  if (Date.now() - timestamp > TOKEN_TTL) return false;

  const expected = createHmac("sha256", SECRET)
    .update(timestampStr)
    .digest("hex");

  return signature === expected;
}

// FC 3.0 内置 runtime HTTP 触发器: event 是类 Buffer 对象
// 内容可能是 API Gateway 格式的 JSON 或原始请求参数
// 必须先转为字符串再解析
function parseEvent(event: any): { queryParameters: Record<string, string>; headers: Record<string, string>; body: any } {
  if (typeof event !== "object" || event === null) {
    return { queryParameters: {}, headers: {}, body: {} };
  }

  try {
    const buf = Buffer.from(event as Uint8Array);
    const str = buf.toString("utf-8");

    if (!str) return { queryParameters: {}, headers: {}, body: {} };

    const parsed = JSON.parse(str);

    // API Gateway 格式: {version, rawPath, headers, queryParameters, body, isBase64Encoded, requestContext}
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
      return { queryParameters: qp, headers, body: {} };
    }

    // 原始 JSON body
    return { queryParameters: {}, headers: {}, body: parsed };
  } catch {
    return { queryParameters: {}, headers: {}, body: {} };
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function handler(event: any, context: any): Promise<any> {
  // 处理 OPTIONS 预检请求
  const method = event?.httpMethod || event?.requestContext?.http?.method || "GET";
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  if (!SECRET) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      body: JSON.stringify({ error: "Not configured" }),
    };
  }

  const { queryParameters, headers } = parseEvent(event);

  // 优先从 Authorization header 读取 token，保留 query param fallback
  const headerToken = headers["Authorization"]?.replace("Bearer ", "");
  const headerTokenLower = headers["authorization"]?.replace("Bearer ", "");
  const token = headerToken ?? headerTokenLower ?? queryParameters["token"] ?? undefined;
  const lang = queryParameters["lang"] || "zh";

  if (!token || !verifyToken(token)) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      body: JSON.stringify({ error: "Token 无效或已过期" }),
    };
  }

  const encFilename = lang === "en" ? "resume-en.pdf.enc" : "resume.pdf.enc";
  const pdfFilename = lang === "en" ? "resume-en.pdf" : "resume.pdf";
  const filePath = path.join(process.cwd(), "private", encFilename);

  try {
    const encrypted = new Uint8Array(readFileSync(filePath));
    const pdfData = decrypt(encrypted);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename}"`,
        "Content-Length": pdfData.length.toString(),
        ...CORS_HEADERS,
      },
      body: pdfData.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    console.error("PDF decrypt failed:", e);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain", ...CORS_HEADERS },
      body: "PDF file not found",
    };
  }
}