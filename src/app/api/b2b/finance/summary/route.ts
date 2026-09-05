import { NextRequest, NextResponse } from 'next/server';
import { requireDealerOrAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { getCompanyFinanceSummary } from '@/lib/financeService';

export const dynamic = 'force-dynamic';

// GET /api/b2b/finance/summary — Central single source of truth for dealer financial summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get('companyId');

    const guard = await requireDealerOrAdmin({
      targetCompanyId: requestedCompanyId || undefined
    });
    if (guard instanceof NextResponse) return guard;

    const { user, companyId, isAdmin } = guard;

    let targetCompanyId = companyId;
    if (isAdmin && !targetCompanyId) {
      const firstCompany = await prisma.company.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });
      targetCompanyId = firstCompany?.id || null;
    }

    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'Firma ID bulunamadı.' }, { status: 400 });
    }

    const summary = await getCompanyFinanceSummary(targetCompanyId);
    if (!summary) {
      return NextResponse.json({ success: false, error: 'Finans özeti bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: summary
    });
  } catch (error: unknown) {
    console.error('GET /api/b2b/finance/summary error:', error);
    const message = error instanceof Error ? error.message : 'Finans özeti yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
