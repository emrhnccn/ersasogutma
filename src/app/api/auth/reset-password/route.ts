import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashToken, validatePasswordStrength } from '@/lib/auth/password-policy';
import { logAuditAction } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await request.json().catch(() => ({}));
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veya eksik sıfırlama kodu.' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.message },
        { status: 400 }
      );
    }

    const hashed = hashToken(token.trim());

    // Find valid token
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

    if (resetRecord.usedAt) {
      return NextResponse.json(
        { success: false, error: 'Bu şifre sıfırlama bağlantısı daha önce kullanılmış.' },
        { status: 400 }
      );
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Şifre sıfırlama bağlantısının süresi dolmuş. Lütfen tekrar talepte bulunun.' },
        { status: 400 }
      );
    }

    // Hash new password securely
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() }
      }),
      // Delete any other tokens for this user
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetRecord.userId,
          id: { not: resetRecord.id }
        }
      })
    ]);

    // Record audit log
    await logAuditAction({
      actorId: resetRecord.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: resetRecord.userId,
      afterJson: {
        method: 'TOKEN_RESET',
        ipAddress: ip,
        email: resetRecord.user.email
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi. Yeni şifreniz ile güvenle giriş yapabilirsiniz.'
    });
  } catch (error: unknown) {
    console.error('POST /api/auth/reset-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Şifre sıfırlanırken beklenmeyen bir hata oluştu.' },
      { status: 500 }
    );
  }
}
