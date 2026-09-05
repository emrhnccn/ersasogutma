import { prisma } from '@/lib/prisma';

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

/**
 * Serverless & database-backed persistent rate limiter
 * Guaranteed to survive lambda freezes and multi-instance container restarts.
 */
export async function checkPersistentRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900 // 15 minutes default
): Promise<RateLimitCheckResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    // 1. Clean up expired record for this key if past expiresAt
    const existing = await prisma.rateLimitRecord.findUnique({
      where: { key }
    });

    if (!existing || existing.expiresAt < now) {
      // Create new or reset existing window
      const record = await prisma.rateLimitRecord.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          expiresAt
        },
        update: {
          count: 1,
          expiresAt,
          updatedAt: now
        }
      });

      return {
        allowed: true,
        remaining: Math.max(0, maxAttempts - 1),
        resetAt: record.expiresAt,
        limit: maxAttempts
      };
    }

    // 2. Increment within active window
    const updated = await prisma.rateLimitRecord.update({
      where: { key },
      data: {
        count: { increment: 1 },
        updatedAt: now
      }
    });

    const allowed = updated.count <= maxAttempts;
    const remaining = Math.max(0, maxAttempts - updated.count);

    return {
      allowed,
      remaining,
      resetAt: updated.expiresAt,
      limit: maxAttempts
    };
  } catch (err) {
    console.error('Persistent rate limit error, falling back for availability:', err);
    // Fail open if database glitch, but log
    return {
      allowed: true,
      remaining: 1,
      resetAt: expiresAt,
      limit: maxAttempts
    };
  }
}

export async function checkRateLimit(
  req: Request | any,
  actionKey: string,
  options: { limit?: number; windowSeconds?: number } = {}
): Promise<{ allowed: boolean; message?: string }> {
  const ip = req?.headers?.get?.('x-forwarded-for') || '127.0.0.1';
  const key = `rl:${actionKey}:${ip}`;
  const res = await checkPersistentRateLimit(key, options.limit || 10, options.windowSeconds || 60);
  return {
    allowed: res.allowed,
    message: res.allowed ? undefined : 'Çok fazla istek gönderildi. Lütfen biraz bekleyiniz.'
  };
}
