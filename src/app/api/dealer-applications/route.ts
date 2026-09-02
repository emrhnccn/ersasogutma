import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { DealerApplicationSchema } from '@/lib/validations';

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

// PUT /api/dealer-applications — Admin approve / reject application
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

    const updated = await prisma.dealerApplication.update({
      where: { id },
      data: {
        status,
        assignedTier: status === 'APPROVED' ? assignedTier : null,
        reviewedAt: new Date()
      }
    });

    // If approved, create company in DB if it doesn't already exist
    if (status === 'APPROVED') {
      const existingCompany = await prisma.company.findFirst({
        where: {
          OR: [
            { legalName: application.companyName },
            ...(application.taxNumber && application.taxNumber !== 'Belirtilmedi' ? [{ taxNo: application.taxNumber }] : [])
          ]
        }
      });

      if (!existingCompany) {
        // Find or create customer group
        let group = await prisma.customerGroup.findFirst({
          where: { name: assignedTier }
        });

        if (!group) {
          group = await prisma.customerGroup.create({
            data: {
              name: assignedTier,
              code: assignedTier.toUpperCase(),
              description: `${assignedTier} Bayi Grubu`
            }
          });
        }

        const newCompany = await prisma.company.create({
          data: {
            legalName: application.companyName,
            phone: application.phone,
            email: application.email,
            taxNo: application.taxNumber !== 'Belirtilmedi' ? application.taxNumber : null,
            taxOffice: application.taxOffice !== 'Belirtilmedi' ? application.taxOffice : null,
            status: 'ACTIVE',
            customerGroupId: group.id,
            currentAccount: {
              create: {
                creditLimit: assignedTier === 'Gold' ? 500000 : assignedTier === 'Platinum' ? 1000000 : 250000
              }
            }
          }
        });

        await logAuditAction({
          actorId: user.id,
          action: 'DEALER_APPLICATION_APPROVED',
          entityType: 'Company',
          entityId: newCompany.id,
          afterJson: { companyName: newCompany.legalName, tier: assignedTier }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Başvuru "${status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}" olarak güncellendi.`
    });
  } catch (error: unknown) {
    console.error('PUT /api/dealer-applications error:', error);
    const message = error instanceof Error ? error.message : 'Başvuru güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
