import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth/password-policy';
import { checkPersistentRateLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const GENERIC_RESPONSE_MESSAGE = 'Eğer girdiğiniz bilgilere ait kayıtlı bir hesap varsa, şifre sıfırlama talimatı gönderilmiştir.';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const body = await request.json().catch(() => ({}));
    const identifier = (body.identifier || body.emailOrUsername || body.email || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Lütfen kullanıcı adı veya e-posta adresinizi girin.' },
        { status: 400 }
      );
    }

    // 1. Persistent Database-backed Rate Limiting (5 requests per 15 minutes per IP/identifier)
    const rateLimitKey = `pwd_reset:${ip}:${identifier.toLowerCase()}`;
    const rateCheck = await checkPersistentRateLimit(rateLimitKey, 5, 15 * 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla şifre sıfırlama talebinde bulundunuz. Lütfen daha sonra tekrar deneyiniz.' },
        { status: 429 }
      );
    }

    // 2. Lookup user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    });

    // 3. User Enumeration Prevention: If user does not exist, return generic success
    if (!user) {
      return NextResponse.json({
        success: true,
        message: GENERIC_RESPONSE_MESSAGE
      });
    }

    // 4. Invalidate any old unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // 5. Generate cryptographically secure token using CSPRNG (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Strict 15 minutes short-lived expiry

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: ip
      }
    });

    const resetUrl = `/bayi/sifre-sifirla?token=${rawToken}`;

    // 6. Production Safety: Token/resetUrl must NEVER be returned or logged outside development
    const isDevelopment = process.env.NODE_ENV === 'development';

    const responsePayload: { success: boolean; message: string; resetUrl?: string } = {
      success: true,
      message: GENERIC_RESPONSE_MESSAGE
    };

    if (isDevelopment) {
      responsePayload.resetUrl = resetUrl;
    }

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json(
      { success: false, error: 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyiniz.' },
      { status: 500 }
    );
  }
}
