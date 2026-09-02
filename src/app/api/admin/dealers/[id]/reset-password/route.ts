import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// POST /api/admin/dealers/[id]/reset-password - Generate a new temporary password for dealer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user: adminUser } = guard;
  const { id } = await params;

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: true },
          take: 1
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Bayi bulunamadı.' }, { status: 404 });
    }

    const dealerUser = company.members?.[0]?.user;
    if (!dealerUser) {
      return NextResponse.json({ success: false, error: 'Bayiye bağlı kullanıcı hesabı bulunamadı.' }, { status: 404 });
    }

    // Generate random secure temporary password
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const tempPassword = `Bayi${randomSuffix}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update password hash in DB (plain text is NEVER stored in database)
    await prisma.user.update({
      where: { id: dealerUser.id },
      data: { passwordHash }
    });

    // Write audit log
    await logAuditAction({
      actorId: adminUser.id,
      action: 'DEALER_PASSWORD_RESET',
      entityType: 'User',
      entityId: dealerUser.id,
      afterJson: { dealerUsername: dealerUser.username, companyId: id }
    });

    return NextResponse.json({
      success: true,
      message: 'Yeni geçici şifre başarıyla oluşturuldu.',
      username: dealerUser.username,
      tempPassword
    });
  } catch (error: unknown) {
    console.error('POST /api/admin/dealers/[id]/reset-password error:', error);
    const message = error instanceof Error ? error.message : 'Şifre sıfırlanırken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
