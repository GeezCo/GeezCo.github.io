// 共享状态存储模块

const TEMP_PASSWORD_TTL = 10 * 60 * 1000; // 10 分钟
const LOCKOUT_DURATION = 24 * 60 * 60 * 1000; // 1 天
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 分钟

// ========== 临时密码存储 ==========
let currentTempPassword: { password: string; expiresAt: number } | null = null;

export function setTempPassword(password: string, expiresAt: number): void {
  currentTempPassword = { password, expiresAt };
}

export function getTempPassword(): { password: string; expiresAt: number } | null {
  if (!currentTempPassword) return null;
  if (Date.now() > currentTempPassword.expiresAt) {
    currentTempPassword = null;
    return null;
  }
  return currentTempPassword;
}

export function generateTempPassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ========== 长期锁定存储（1 天）==========
const ipLockouts = new Map<string, number>();
const fingerprintLockouts = new Map<string, number>();

export function isLocked(ip: string, fingerprint: string): { locked: boolean; unlockTime?: number } {
  const now = Date.now();

  const ipUnlockTime = ipLockouts.get(ip);
  if (ipUnlockTime && now < ipUnlockTime) {
    return { locked: true, unlockTime: ipUnlockTime };
  } else if (ipUnlockTime && now >= ipUnlockTime) {
    ipLockouts.delete(ip);
  }

  const fpUnlockTime = fingerprintLockouts.get(fingerprint);
  if (fpUnlockTime && now < fpUnlockTime) {
    return { locked: true, unlockTime: fpUnlockTime };
  } else if (fpUnlockTime && now >= fpUnlockTime) {
    fingerprintLockouts.delete(fingerprint);
  }

  return { locked: false };
}

export function lockDevice(ip: string, fingerprint: string): void {
  const unlockTime = Date.now() + LOCKOUT_DURATION;
  ipLockouts.set(ip, unlockTime);
  fingerprintLockouts.set(fingerprint, unlockTime);
}

export function getLockouts(): { ips: Map<string, number>; fingerprints: Map<string, number> } {
  return { ips: ipLockouts, fingerprints: fingerprintLockouts };
}

export function unlockDevice(ip?: string, fingerprint?: string): void {
  if (ip) ipLockouts.delete(ip);
  if (fingerprint) fingerprintLockouts.delete(fingerprint);
}

// ========== 短期频率限制（15 分钟）==========
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function checkRate(ip: string): boolean {
  const entry = rateMap.get(ip);
  if (!entry) return true;
  if (Date.now() > entry.resetAt) {
    rateMap.delete(ip);
    return true;
  }
  return entry.count < MAX_FAILURES;
}

export function recordFailure(ip: string, fingerprint: string): void {
  const entry = rateMap.get(ip);
  if (!entry || Date.now() > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: Date.now() + LOCKOUT_MS });
  } else {
    entry.count += 1;
    if (entry.count >= MAX_FAILURES) {
      lockDevice(ip, fingerprint);
    }
  }
}

export function resetRate(ip: string): void {
  rateMap.delete(ip);
}
