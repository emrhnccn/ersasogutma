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
  tokenVersion?: number;
}

/**
 * Validates that the active session user exists in the DB, is active,
 * and that their tokenVersion has not been invalidated by a password reset.
 */
async function validateDbSession(sessionUser: any): Promise<AuthenticatedUser | NextResponse> {
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      status: true,
      tokenVersion: true
    }
  });

  if (!dbUser) {
    return NextResponse.json(
      { success: false, error: 'Kullanıcı hesabı bulunamadı.' },
      { status: 401 }
    );
  }

  if (dbUser.status === 'SUSPENDED' || dbUser.status === 'DELETED') {
    return NextResponse.json(
      { success: false, error: 'Kullanıcı hesabı askıya alınmıştır.' },
      { status: 403 }
    );
  }

  // If password was reset, tokenVersion was incremented in DB
  if (
    sessionUser.tokenVersion !== undefined &&
    dbUser.tokenVersion !== sessionUser.tokenVersion
  ) {
    return NextResponse.json(
      {
        success: false,
        error: 'Şifreniz sıfırlandığı için aktif oturumunuz sonlandırılmıştır. Lütfen yeni şifrenizle giriş yapınız.'
      },
      { status: 401 }
    );
  }

  return {
    id: dbUser.id,
    username: dbUser.username || dbUser.email || 'user',
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role as any,
    companyId: sessionUser.companyId || null,
    tokenVersion: dbUser.tokenVersion
  };
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

    const validated = await validateDbSession(session.user);
    if (validated instanceof NextResponse) return validated;

    if (validated.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Erişim reddedildi. Bu işlem için ADMIN yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    return { user: validated };
  } catch (error) {
    console.error('requireAdmin error:', error);
    return NextResponse.json(
      { success: false, error: 'Oturum doğrulama sırasında sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}

/**
 * Server-side guard requiring STRICTLY B2B_DEALER role.
 * Admins are NOT allowed here; use requireDealerOrAdmin() if admin access is intended.
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

    const validated = await validateDbSession(session.user);
    if (validated instanceof NextResponse) return validated;

    if (validated.role !== 'B2B_DEALER') {
      return NextResponse.json(
        { success: false, error: 'Erişim engellendi. Bu işlem yalnızca onaylı B2B bayileri içindir.' },
        { status: 403 }
      );
    }

    // Resolve companyId for dealer
    let companyId = validated.companyId;
    if (!companyId) {
      const membership = await prisma.companyMember.findFirst({
        where: { userId: validated.id },
        select: { companyId: true }
      });
      if (membership) {
        companyId = membership.companyId;
      } else {
        return NextResponse.json(
          { success: false, error: 'Bu kullanıcıya ait bayi firma kaydı bulunamadı.' },
          { status: 403 }
        );
      }
    }

    return {
      user: {
        ...validated,
        companyId
      },
      companyId
    };
  } catch (error) {
    console.error('requireDealer error:', error);
    return NextResponse.json(
      { success: false, error: 'Bayi oturum doğrulaması başarısız oldu.' },
      { status: 500 }
    );
  }
}

/**
 * Combined guard permitting either B2B_DEALER or ADMIN with explicit tenant isolation and IDOR checks.
 * - If dealer: Target company MUST match dealer's own companyId (otherwise 403 IDOR rejection).
 * - If admin: Validates that the requested targetCompanyId exists in database, or allows global access if not requested.
 */
export async function requireDealerOrAdmin(
  options?: { targetCompanyId?: string | null }
): Promise<
  | {
      user: AuthenticatedUser;
      companyId: string | null;
      isAdmin: boolean;
      targetCompany?: any;
    }
  | NextResponse
> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim. Lütfen oturum açın.' },
        { status: 401 }
      );
    }

    const validated = await validateDbSession(session.user);
    if (validated instanceof NextResponse) return validated;

    // 1. DEALER access path
    if (validated.role === 'B2B_DEALER') {
      let dealerCompanyId = validated.companyId;
      if (!dealerCompanyId) {
        const membership = await prisma.companyMember.findFirst({
          where: { userId: validated.id },
          select: { companyId: true }
        });
        if (membership) {
          dealerCompanyId = membership.companyId;
        } else {
          return NextResponse.json(
            { success: false, error: 'Bayi firma üyeliği bulunamadı.' },
            { status: 403 }
          );
        }
      }

      // IDOR / Tenant Isolation check:
      if (options?.targetCompanyId && options.targetCompanyId !== dealerCompanyId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Yetkisiz erişim (IDOR engellendi): Başka bir bayiye ait verilere erişim yetkiniz bulunmamaktadır.'
          },
          { status: 403 }
        );
      }

      return {
        user: { ...validated, companyId: dealerCompanyId },
        companyId: dealerCompanyId,
        isAdmin: false
      };
    }

    // 2. ADMIN access path
    if (validated.role === 'ADMIN') {
      if (options?.targetCompanyId && options.targetCompanyId !== 'ALL') {
        const targetCompany = await prisma.company.findUnique({
          where: { id: options.targetCompanyId }
        });

        if (!targetCompany) {
          return NextResponse.json(
            { success: false, error: 'Belirtilen hedef bayi/firma veritabanında bulunamadı.' },
            { status: 404 }
          );
        }

        return {
          user: validated,
          companyId: options.targetCompanyId,
          isAdmin: true,
          targetCompany
        };
      }

      return {
        user: validated,
        companyId: null,
        isAdmin: true
      };
    }

    return NextResponse.json(
      { success: false, error: 'Erişim engellendi. Bu işlem için bayi veya yönetici yetkisi gereklidir.' },
      { status: 403 }
    );
  } catch (error) {
    console.error('requireDealerOrAdmin error:', error);
    return NextResponse.json(
      { success: false, error: 'Yetki doğrulama sırasında sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}

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
 * Enterprise Audit Logger for sensitive actions with persistent DB deduplication & PII masking.
 * Does NOT suppress legitimate fast actions via arbitrary in-memory time windows;
 * uses unique dedupKey or requestId when deduplication is required.
 */
export async function logAuditAction(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: any;
  afterJson?: any;
  dedupKey?: string;
  requestId?: string;
}) {
  try {
    const sanitizedBefore = params.beforeJson ? maskSensitiveAuditData(params.beforeJson) : null;
    const sanitizedAfter = params.afterJson ? maskSensitiveAuditData(params.afterJson) : null;

    // Use explicit dedupKey or build from requestId if provided
    const dedupKey = params.dedupKey || (params.requestId ? `${params.requestId}:${params.action}:${params.entityId}` : null);

    await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeJson: sanitizedBefore ? JSON.stringify(sanitizedBefore) : null,
        afterJson: sanitizedAfter ? JSON.stringify(sanitizedAfter) : null,
        dedupKey: dedupKey || undefined,
        requestId: params.requestId || null,
      }
    });
  } catch (err: any) {
    // Unique constraint violation (P2002) means this exact request was already recorded (idempotent duplicate)
    if (err?.code === 'P2002') {
      return;
    }
    console.error('Failed to write audit log:', err);
  }
}
