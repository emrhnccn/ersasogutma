import { NextRequest, NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/b2b/warranty - Get warranty claims
export async function GET() {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const whereClause: any = user.role === 'ADMIN' ? {} : { companyId };
    const claims = await prisma.warrantyClaim.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: claims });
  } catch (error: unknown) {
    console.error('GET /api/b2b/warranty error:', error);
    const message = error instanceof Error ? error.message : 'Garanti talepleri yüklenemedi.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/b2b/warranty - Submit new claim
export async function POST(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const body = await request.json();
    const { serialNumber, productName, productCode, issueDescription } = body;

    if (!serialNumber || !productName || !issueDescription) {
      return NextResponse.json({ success: false, error: 'Seri numarası, ürün adı ve arıza açıklaması zorunludur.' }, { status: 400 });
    }

    const claim = await prisma.warrantyClaim.create({
      data: {
        companyId,
        userId: user.id,
        serialNumber,
        productName,
        productCode,
        issueDescription,
        status: 'UNDER_REVIEW'
      }
    });

    return NextResponse.json({
      success: true,
      data: claim,
      message: 'Garanti servis talebiniz başarıyla kaydedildi ve incelemeye alındı.'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/b2b/warranty error:', error);
    const message = error instanceof Error ? error.message : 'Garanti talebi oluşturulamadı.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
