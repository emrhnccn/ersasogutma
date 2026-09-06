import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// PUT /api/admin/dealers/[id]/account - Update dealer username, password (hashed), and account status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user: adminUser } = guard;
  const { id } = await params;

  try {
    const body = await request.json();
    const { username, newPassword, newPasswordConfirm, confirmPassword, status } = body;
    const resolvedConfirm = newPasswordConfirm || confirmPassword;

    // Find company and primary user
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Bayi firması bulunamadı.' }, { status: 404 });
    }

    let dealerUser = company.members?.[0]?.user;

    if (!dealerUser && company.email) {
      dealerUser = (await prisma.user.findUnique({
        where: { email: company.email }
      })) as any;
    }

    if (!dealerUser) {
      dealerUser = (await prisma.user.findFirst({
        where: {
          OR: [{ phone: company.phone }, { role: 'B2B_DEALER' }]
        }
      })) as any;
    }

    if (!dealerUser) {
      return NextResponse.json({ success: false, error: 'Bayiye bağlı kullanıcı hesabı bulunamadı.' }, { status: 404 });
    }

    const userUpdateData: any = {};
    const auditChanges: Record<string, any> = {};

    // 1. Username Validation & Duplicate Check
    if (username !== undefined && username !== null) {
      const cleanUsername = String(username).trim();
      if (cleanUsername.length < 3) {
        return NextResponse.json({
          success: false,
          error: 'Kullanıcı adı en az 3 karakter olmalıdır.'
        }, { status: 400 });
      }

      if (cleanUsername !== dealerUser.username) {
        const duplicate = await prisma.user.findFirst({
          where: {
            username: cleanUsername,
            NOT: { id: dealerUser.id }
          }
        });

        if (duplicate) {
          return NextResponse.json({
            success: false,
            error: `"${cleanUsername}" kullanıcı adı başka bir kullanıcı tarafından kullanılıyor. Lütfen farklı bir kullanıcı adı seçiniz.`
          }, { status: 400 });
        }

        userUpdateData.username = cleanUsername;
        auditChanges.oldUsername = dealerUser.username;
        auditChanges.newUsername = cleanUsername;
      }
    }

    // 2. Password Change & Safe Bcrypt Hashing
    if (newPassword || resolvedConfirm) {
      if (!newPassword || !resolvedConfirm) {
        return NextResponse.json({
          success: false,
          error: 'Şifre değiştirmek için "Yeni Şifre" ve "Yeni Şifre Tekrar" alanlarının her ikisi de doldurulmalıdır.'
        }, { status: 400 });
      }

      if (newPassword !== resolvedConfirm) {
        return NextResponse.json({
          success: false,
          error: 'Girilen şifreler birbiriyle eşleşmiyor. Lütfen iki alanı da aynı şifreyle doldurunuz.'
        }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({
          success: false,
          error: 'Yeni şifre en az 6 karakter uzunluğunda olmalıdır.'
        }, { status: 400 });
      }

      // Hash with bcryptjs (Plaintext is NEVER stored or sent back)
      const passwordHash = await bcrypt.hash(newPassword, 10);
      userUpdateData.passwordHash = passwordHash;
      userUpdateData.passwordChangedAt = new Date();
      userUpdateData.tokenVersion = { increment: 1 };
      auditChanges.passwordChanged = true;
    }

    // 3. User Status Change (ACTIVE / SUSPENDED / INACTIVE)
    if (status) {
      const validStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING', 'INACTIVE'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({
          success: false,
          error: `Geçersiz durum. İzin verilen değerler: ${validStatuses.join(', ')}`
        }, { status: 400 });
      }

      userUpdateData.status = status;
      auditChanges.status = status;
    }

    if (Object.keys(userUpdateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Güncellenecek herhangi bir alan belirtilmedi.'
      }, { status: 400 });
    }

    // Execute atomic update
    const updatedUser = await prisma.user.update({
      where: { id: dealerUser.id },
      data: userUpdateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    // If status was changed, also sync company status
    if (status && (status === 'ACTIVE' || status === 'SUSPENDED')) {
      await prisma.company.update({
        where: { id: company.id },
        data: { status }
      });
    }

    // Audit log
    await logAuditAction({
      actorId: adminUser.id,
      action: 'DEALER_ACCOUNT_UPDATED',
      entityType: 'User',
      entityId: dealerUser.id,
      afterJson: {
        dealerId: company.id,
        companyName: company.legalName,
        changes: auditChanges
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Bayi kullanıcı adı, şifresi ve hesap durumu başarıyla güncellendi.',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        status: updatedUser.status
      }
    });
  } catch (error: unknown) {
    console.error('PUT /api/admin/dealers/[id]/account error:', error);
    const message = error instanceof Error ? error.message : 'Kullanıcı hesabı güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
