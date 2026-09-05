import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string | null;
  name?: string | null;
  role: 'ADMIN' | 'B2B_DEALER' | 'B2C_CUSTOMER';
  companyId?: string | null;
}

/**
 * Server-side guard requiring ADMIN role
 */
export async function requireAdmin(): Promise<{ user: AuthenticatedUser } | NextResponse> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim. Lütfen yönetici olarak oturum açın.' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Erişim reddedildi. Bu işlem için ADMIN yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    return {
      user: {
        id: user.id,
        username: user.username || user.email || 'admin',
        email: user.email,
        name: user.name,
        role: 'ADMIN',
        companyId: user.companyId || null,
      }
    };
  } catch (error) {
    console.error('requireAdmin error:', error);
    return NextResponse.json(
      { success: false, error: 'Oturum doğrulama sırasında sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}

/**
 * Server-side guard requiring B2B_DEALER or ADMIN role
 */
export async function requireDealer(): Promise<{ user: AuthenticatedUser; companyId: string } | NextResponse> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim. Lütfen bayi girişi yapın.' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    if (user.role !== 'B2B_DEALER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Erişim engellendi. Yalnızca onaylı B2B bayileri erişebilir.' },
        { status: 403 }
      );
    }

    // Resolve companyId for user
    let companyId = user.companyId;
    if (!companyId) {
      const membership = await prisma.companyMember.findFirst({
        where: { userId: user.id },
        select: { companyId: true }
      });
      if (membership) {
        companyId = membership.companyId;
      } else if (user.role === 'ADMIN') {
        companyId = ''; // Admins operate globally across all companies
      } else {
        return NextResponse.json(
          { success: false, error: 'Bu kullanıcıya ait firma bulunamadı. Lütfen yöneticinize başvurun.' },
          { status: 403 }
        );
      }
    }

    return {
      user: {
        id: user.id,
        username: user.username || user.email || (user.role === 'ADMIN' ? 'admin' : 'bayi'),
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: companyId || null,
      },
      companyId: companyId || ''
    };
  } catch (error) {
    console.error('requireDealer error:', error);
    return NextResponse.json(
      { success: false, error: 'Bayi oturum doğrulaması başarısız oldu.' },
      { status: 500 }
    );
  }
}

// In-memory debounce cache to prevent spamming identical audit logs within 5 seconds
const recentAuditCache = new Map<string, number>();

/**
 * Recursively masks sensitive fields (PII, credentials, cards) in JSON payloads
 */
export function maskSensitiveAuditData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveAuditData);
  }

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('sifre') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey === 'cvv' ||
      lowerKey === 'cvc'
    ) {
      masked[key] = '***REDACTED***';
    } else if (lowerKey.includes('cardnumber') || lowerKey.includes('kartno')) {
      const strVal = String(value || '');
      masked[key] = strVal.length >= 4 ? `**** **** **** ${strVal.slice(-4)}` : '****';
    } else if (lowerKey === 'phone' || lowerKey.includes('telefon') || lowerKey === 'phonegsm') {
      const strVal = String(value || '');
      masked[key] = strVal.length >= 4 ? `${strVal.slice(0, 3)}****${strVal.slice(-4)}` : '****';
    } else if (lowerKey === 'taxno' || lowerKey === 'taxnumber' || lowerKey.includes('vergino')) {
      const strVal = String(value || '');
      masked[key] = strVal.length >= 4 ? `******${strVal.slice(-4)}` : '******';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveAuditData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

/**
 * Enterprise Audit Logger for sensitive actions with deduplication & PII masking
 */
export async function logAuditAction(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: any;
  afterJson?: any;
}) {
  try {
    // 1. Deduplication check (skip identical event for same entity within 4 seconds)
    const dedupKey = `${params.actorId || 'anon'}:${params.action}:${params.entityType}:${params.entityId}`;
    const now = Date.now();
    const lastLogged = recentAuditCache.get(dedupKey);
    if (lastLogged && now - lastLogged < 4000) {
      return; // Skip duplicate spam log
    }
    recentAuditCache.set(dedupKey, now);

    // Keep cache size bounded
    if (recentAuditCache.size > 200) {
      for (const [k, timestamp] of recentAuditCache.entries()) {
        if (now - timestamp > 30000) recentAuditCache.delete(k);
      }
    }

    // 2. Sanitize and mask sensitive payloads
    const sanitizedBefore = params.beforeJson ? maskSensitiveAuditData(params.beforeJson) : null;
    const sanitizedAfter = params.afterJson ? maskSensitiveAuditData(params.afterJson) : null;

    await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeJson: sanitizedBefore ? JSON.stringify(sanitizedBefore) : null,
        afterJson: sanitizedAfter ? JSON.stringify(sanitizedAfter) : null,
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
