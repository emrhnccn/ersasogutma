import { NextRequest, NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { getCompanyFinanceSummary } from '@/lib/financeService';

export const dynamic = 'force-dynamic';

// GET /api/b2b/cari - Get dealer company's ledger statement and transactions
export async function GET(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;
  let companyId = guard.companyId;

  const { searchParams } = new URL(request.url);
  const requestedCompanyId = searchParams.get('companyId');

  // Allow admins to inspect any company's cari statement
  if (user.role === 'ADMIN' && requestedCompanyId) {
    companyId = requestedCompanyId;
  } else if (user.role === 'ADMIN' && !companyId) {
    // If admin didn't specify companyId, pick first active dealer company
    const firstCompany = await prisma.company.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });
    companyId = firstCompany?.id || '';
  }

  if (!companyId) {
    return NextResponse.json({ success: false, error: 'Firma ID bulunamadı.' }, { status: 400 });
  }

  try {
    const search = searchParams.get('search');
    const docType = searchParams.get('docType'); // all, invoice, payment, correction

    const [summary, company] = await Promise.all([
      getCompanyFinanceSummary(companyId),
      prisma.company.findUnique({
        where: { id: companyId },
        include: {
          customerGroup: true,
          currentAccount: {
            include: {
              transactions: {
                orderBy: { createdAt: 'desc' },
                include: {
                  order: {
                    select: { orderNo: true }
                  }
                }
              }
            }
          }
        }
      })
    ]);

    if (!company || !summary) {
      return NextResponse.json({ success: false, error: 'Firma cari bilgisi bulunamadı.' }, { status: 404 });
    }

    const allTransactions = company.currentAccount?.transactions || [];

    const mappedTransactions = allTransactions.map((t) => {
      const amt = Number(t.amount);
      const isDebit = t.type.includes('DEBIT') || t.type === 'ORDER_DEBIT';

      let docTypeLabel = 'Diğer İşlem';
      if (t.type === 'ORDER_DEBIT') docTypeLabel = 'Satış Faturası';
      else if (t.type === 'ORDER_CANCEL_CREDIT') docTypeLabel = 'İptal / İade Dekontu';
      else if (t.type === 'MANUAL_DEBIT') docTypeLabel = 'Borç Dekontu';
      else if (t.type === 'MANUAL_CREDIT' || t.type === 'PAYMENT_CREDIT') docTypeLabel = 'Tahsilat Makbuzu';
      else if (t.type === 'INITIAL_BALANCE') docTypeLabel = 'Açılış Fişi';
      else if (t.type === 'CORRECTION') docTypeLabel = 'Virman / Düzeltme';

      const docNo = t.order?.orderNo 
        ? t.order.orderNo 
        : (t.note?.match(/\[Evrak No:\s*([^\]]+)\]/)?.[1] || `EVR-${t.id.slice(-6).toUpperCase()}`);

      return {
        id: t.id,
        date: new Date(t.createdAt).toLocaleDateString('tr-TR'),
        time: new Date(t.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        documentNo: docNo,
        documentType: docTypeLabel,
        rawType: t.type,
        debt: isDebit ? amt : 0,
        credit: isDebit ? 0 : amt,
        balance: Number(t.balanceAfter),
        balanceType: Number(t.balanceAfter) >= 0 ? 'B' : 'A',
        description: t.note || docTypeLabel,
        createdAt: t.createdAt
      };
    });

    // Apply optional query filters
    let filtered = mappedTransactions;
    if (docType && docType !== 'all') {
      filtered = filtered.filter((t) => t.documentType.toLowerCase().includes(docType.toLowerCase()));
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((t) =>
        t.documentNo.toLowerCase().includes(q) ||
        t.documentType.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        companyId: summary.companyId,
        companyName: summary.companyName,
        taxNo: summary.taxNo,
        taxOffice: summary.taxOffice,
        tier: summary.tierName,
        // Atomic finance fields as requested
        cariBakiye: summary.cariBakiye,
        bakiyeYonu: summary.bakiyeYonu,
        krediLimiti: summary.creditLimit,
        kullanilabilirLimit: summary.kullanilabilirLimit,
        gecikenBorc: summary.gecikenBorc,
        odenecekTutar: summary.odenecekTutar,
        // Backwards compatibility mappings for older components
        creditLimit: summary.creditLimit,
        currentBalance: summary.rawBalance,
        availableCredit: summary.kullanilabilirLimit,
        totalDebit: summary.totalDebit,
        totalCredit: summary.totalCredit,
        balance: summary.cariBakiye,
        balanceType: summary.balanceType,
        transactions: filtered
      }
    });
  } catch (error: unknown) {
    console.error('GET /api/b2b/cari error:', error);
    const message = error instanceof Error ? error.message : 'Cari bilgileri yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
