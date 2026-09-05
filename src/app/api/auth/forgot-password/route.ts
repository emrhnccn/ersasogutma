import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, generateSecureToken, hashToken } from '@/lib/auth/password-policy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await request.json().catch(() => ({}));
    const identifier = (body.identifier || body.emailOrUsername || body.email || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Lütfen kullanıcı adı veya e-posta adresinizi girin.' },
        { status: 400 }
      );
    }

    // Rate Limiting: Max 5 requests per 15 minutes per IP/identifier
    const rateLimitKey = `pwd_reset_${ip}_${identifier.toLowerCase()}`;
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla şifre sıfırlama talebinde bulundunuz. Lütfen 15 dakika sonra tekrar deneyiniz.' },
        { status: 429 }
      );
    }

    // Lookup user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    });

    // To prevent user enumeration attacks, always respond with a positive message
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Eğer girdiğiniz bilgilere ait bir hesap mevcutsa, şifre sıfırlama bağlantısı oluşturuldu.'
      });
    }

    // Clean up any old unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Generate cryptographically secure token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: ip
      }
    });

    const resetUrl = `/bayi/sifre-sifirla?token=${rawToken}`;

    return NextResponse.json({
      success: true,
      message: 'Şifre sıfırlama bağlantısı başarıyla oluşturuldu.',
      // In development or demo mode, provide the direct reset url for testing
      resetUrl
    });
  } catch (error: unknown) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Şifre sıfırlama işlemi sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
