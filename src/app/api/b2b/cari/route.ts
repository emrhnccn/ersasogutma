import { NextRequest, NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/b2b/cari - Get dealer company's ledger statement and transactions
export async function GET(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { companyId } = guard;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const docType = searchParams.get('docType'); // all, invoice, payment, correction

    const company = await prisma.company.findUnique({
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
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Firma cari bilgisi bulunamadı.' }, { status: 404 });
    }

    const creditLimit = Number(company.currentAccount?.creditLimit || 250000);
    const allTransactions = company.currentAccount?.transactions || [];

    // Latest balance
    const latestTx = allTransactions[0];
    const currentBalance = latestTx ? Number(latestTx.balanceAfter) : 0;
    const availableCredit = Math.max(0, creditLimit - (currentBalance > 0 ? currentBalance : 0));

    let totalDebit = 0;
    let totalCredit = 0;

    const mappedTransactions = allTransactions.map((t) => {
      const amt = Number(t.amount);
      const isDebit = t.type.includes('DEBIT') || t.type === 'ORDER_DEBIT';
      if (isDebit) totalDebit += amt;
      else totalCredit += amt;

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
        companyName: company.legalName,
        taxNo: company.taxNo || '—',
        taxOffice: company.taxOffice || '—',
        tier: company.customerGroup?.name || 'Gold',
        creditLimit,
        currentBalance,
        availableCredit,
        totalDebit,
        totalCredit,
        balance: Math.abs(currentBalance),
        balanceType: currentBalance >= 0 ? 'B' : 'A', // B = Borçlu, A = Alacaklı
        transactions: filtered
      }
    });
  } catch (error: unknown) {
    console.error('GET /api/b2b/cari error:', error);
    const message = error instanceof Error ? error.message : 'Cari bilgileri yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
