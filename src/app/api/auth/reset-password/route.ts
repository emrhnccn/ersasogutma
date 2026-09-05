import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashToken, validatePasswordStrength } from '@/lib/auth/password-policy';
import { logAuditAction } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const body = await request.json().catch(() => ({}));
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veya eksik sıfırlama kodu.' },
        { status: 400 }
      );
    }

    // 1. Validate password strength against policy
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.message },
        { status: 400 }
      );
    }

    const hashed = hashToken(token.trim());

    // 2. Find valid token
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashed },
      include: { user: true }
    });

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, error: 'Şifre sıfırlama bağlantısı bulunamadı veya geçersiz.' },
        { status: 400 }
      );
    }

    // 3. Single-use check
    if (resetRecord.usedAt) {
      return NextResponse.json(
        { success: false, error: 'Bu şifre sıfırlama bağlantısı daha önce kullanılmış.' },
        { status: 400 }
      );
    }

    // 4. Expiration check
    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Şifre sıfırlama bağlantısının süresi dolmuş. Lütfen tekrar talepte bulunun.' },
        { status: 400 }
      );
    }

    // 5. Hash new password securely with bcrypt
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();

    // 6. Invalidate all active sessions via tokenVersion increment + delete token in atomic transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
          passwordChangedAt: now,
          updatedAt: now
        }
      }),
      // Mark current token as used and delete all tokens for this user
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetRecord.userId }
      })
    ]);

    // 7. Record audit log
    await logAuditAction({
      actorId: resetRecord.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: resetRecord.userId,
      dedupKey: `pwd_reset_complete:${resetRecord.userId}:${now.getTime()}`,
      afterJson: {
        method: 'TOKEN_RESET',
        ipAddress: ip,
        email: resetRecord.user.email
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi. Eski oturumlar sonlandırıldı, yeni şifrenizle giriş yapabilirsiniz.'
    });
  } catch (error: unknown) {
    console.error('POST /api/auth/reset-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Şifre sıfırlanırken beklenmeyen bir hata oluştu.' },
      { status: 500 }
    );
  }
}
