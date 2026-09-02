import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET /api/dealer-applications — Admin fetch all applications
export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const applications = await prisma.dealerApplication.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const mapped = applications.map((app) => ({
      id: app.id,
      companyName: app.companyName,
      contactPerson: app.contactPerson,
      phone: app.phone,
      email: app.email,
      city: app.city,
      taxOffice: app.taxOffice || 'Belirtilmedi',
      taxNumber: app.taxNumber || 'Belirtilmedi',
      notes: app.notes || '',
      status: app.status,
      assignedTier: app.assignedTier || 'Silver',
      appliedAt: app.createdAt.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: unknown) {
    console.error('GET /api/dealer-applications error:', error);
    const message = error instanceof Error ? error.message : 'Başvurular yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/dealer-applications — Public submit dealer application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse and fallback for fields
    const companyName = body.companyName || body.fullName || 'Bayi Adayı';
    const contactPerson = body.contactPerson || body.fullName || 'Yetkili';
    const phone = body.phone || '';
    const email = body.email || '';
    const city = body.city || 'Belirtilmedi';
    const taxOffice = body.taxOffice || 'Belirtilmedi';
    const taxNumber = body.taxNumber || '1111111111';
    const notes = body.notes || body.message || '';

    if (!phone || !companyName) {
      return NextResponse.json(
        { success: false, error: 'Firma adı ve telefon numarası zorunludur.' },
        { status: 400 }
      );
    }

    const application = await prisma.dealerApplication.create({
      data: {
        companyName,
        contactPerson,
        phone,
        email,
        city,
        taxOffice,
        taxNumber,
        notes,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Bayilik başvurunuz başarıyla alındı. Müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/dealer-applications error:', error);
    const message = error instanceof Error ? error.message : 'Başvuru gönderilirken bir hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/dealer-applications — Admin approve / reject application with atomic transaction
export async function PUT(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const body = await request.json();
    const { id, status, assignedTier = 'Silver' } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Başvuru ID ve durum zorunludur.' }, { status: 400 });
    }

    const application = await prisma.dealerApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Başvuru bulunamadı.' }, { status: 404 });
    }

    if (status === 'REJECTED') {
      const updated = await prisma.dealerApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date()
        }
      });

      await logAuditAction({
        actorId: user.id,
        action: 'DEALER_APPLICATION_REJECTED',
        entityType: 'DealerApplication',
        entityId: application.id,
        afterJson: { companyName: application.companyName, status: 'REJECTED' }
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Başvuru reddedildi.'
      });
    }

    // Determine credit limit according to tier
    const tierLimitMap: Record<string, number> = {
      'Standart': 50000,
      'Silver': 150000,
      'Gold': 500000,
      'Platinum': 1000000
    };
    const creditLimit = tierLimitMap[assignedTier] || 150000;

    // Clean username from phone or company name
    const rawDigits = application.phone.replace(/\D/g, '');
    const cleanUsername = rawDigits.length >= 7 
      ? `bayi${rawDigits.slice(-7)}` 
      : `bayi_${application.companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
    const defaultPasswordHash = await bcrypt.hash('Bayi1234!', 10);

    // ATOMIC TRANSACTION FOR FULL B2B ONBOARDING
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Application Status
      const updatedApp = await tx.dealerApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          assignedTier,
          reviewedAt: new Date()
        }
      });

      // 2. Find or Create CustomerGroup
      let group = await tx.customerGroup.findFirst({
        where: { name: assignedTier }
      });
      if (!group) {
        group = await tx.customerGroup.create({
          data: {
            name: assignedTier,
            code: assignedTier.toUpperCase(),
            description: `${assignedTier} Bayi Fiyat Grubu`
          }
        });
      }

      // 3. Find or Create Company
      let company = await tx.company.findFirst({
        where: {
          OR: [
            { legalName: application.companyName },
            ...(application.taxNumber && application.taxNumber !== 'Belirtilmedi' && application.taxNumber !== '1111111111' 
                ? [{ taxNo: application.taxNumber }] 
                : [])
          ]
        }
      });

      if (!company) {
        company = await tx.company.create({
          data: {
            legalName: application.companyName,
            phone: application.phone,
            email: application.email,
            taxNo: application.taxNumber !== 'Belirtilmedi' ? application.taxNumber : null,
            taxOffice: application.taxOffice !== 'Belirtilmedi' ? application.taxOffice : null,
            status: 'ACTIVE',
            customerGroupId: group.id
          }
        });
      } else {
        company = await tx.company.update({
          where: { id: company.id },
          data: {
            status: 'ACTIVE',
            customerGroupId: group.id,
            phone: application.phone || company.phone,
            email: application.email || company.email
          }
        });
      }

      // 4. Find or Create CurrentAccount
      let currentAccount = await tx.currentAccount.findUnique({
        where: { companyId: company.id }
      });

      if (!currentAccount) {
        currentAccount = await tx.currentAccount.create({
          data: {
            companyId: company.id,
            creditLimit
          }
        });

        // Add Initial Transaction
        await tx.currentAccountTransaction.create({
          data: {
            accountId: currentAccount.id,
            type: 'INITIAL_BALANCE',
            amount: 0,
            balanceAfter: 0,
            note: 'Hesap açılış bakiyesi (B2B Onay)'
          }
        });
      } else {
        // Update credit limit if tier changed
        currentAccount = await tx.currentAccount.update({
          where: { id: currentAccount.id },
          data: { creditLimit }
        });
      }

      // 5. Find or Create User for Dealer Login
      let dealerUser = await tx.user.findFirst({
        where: {
          OR: [
            { username: cleanUsername },
            ...(application.email ? [{ email: application.email }] : [])
          ]
        }
      });

      if (!dealerUser) {
        dealerUser = await tx.user.create({
          data: {
            username: cleanUsername,
            email: application.email || `${cleanUsername}@ersasogutma.com.tr`,
            name: application.contactPerson,
            phone: application.phone,
            role: 'B2B_DEALER',
            status: 'ACTIVE',
            passwordHash: defaultPasswordHash
          }
        });
      } else {
        dealerUser = await tx.user.update({
          where: { id: dealerUser.id },
          data: {
            role: 'B2B_DEALER',
            status: 'ACTIVE'
          }
        });
      }

      // 6. Link User to Company (CompanyMember)
      const existingMember = await tx.companyMember.findUnique({
        where: {
          companyId_userId: {
            companyId: company.id,
            userId: dealerUser.id
          }
        }
      });

      if (!existingMember) {
        await tx.companyMember.create({
          data: {
            companyId: company.id,
            userId: dealerUser.id,
            memberRole: 'OWNER'
          }
        });
      }

      // 7. Ensure active Cart exists for user
      const existingCart = await tx.cart.findFirst({
        where: { userId: dealerUser.id }
      });

      if (!existingCart) {
        await tx.cart.create({
          data: {
            userId: dealerUser.id
          }
        });
      }

      return {
        application: updatedApp,
        company,
        user: dealerUser,
        currentAccount,
        username: cleanUsername
      };
    });

    await logAuditAction({
      actorId: user.id,
      action: 'DEALER_APPLICATION_APPROVED',
      entityType: 'Company',
      entityId: result.company.id,
      afterJson: {
        companyName: result.company.legalName,
        username: result.username,
        tier: assignedTier,
        creditLimit
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `"${result.company.legalName}" başarıyla onaylandı! Bayi Kodu/Kullanıcı Adı: ${result.username} (Şifre: Bayi1234!)`
    });
  } catch (error: unknown) {
    console.error('PUT /api/dealer-applications error:', error);
    const message = error instanceof Error ? error.message : 'Başvuru onaylanırken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
