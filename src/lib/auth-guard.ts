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
        username: user.username || user.email || 'bayi',
        email: user.email,
        name: user.name,
        role: user.role,
        companyId,
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
 * Enterprise Audit Logger for sensitive actions
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
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeJson: params.beforeJson ? JSON.stringify(params.beforeJson) : null,
        afterJson: params.afterJson ? JSON.stringify(params.afterJson) : null,
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
