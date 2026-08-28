import { NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/b2b/cari - Get dealer company's ledger statement
export async function GET() {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { companyId } = guard;

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        customerGroup: true,
        currentAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 50
            }
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Firma cari bilgisi bulunamadı.' }, { status: 404 });
    }

    const creditLimit = Number(company.currentAccount?.creditLimit || 250000);
    const transactions = company.currentAccount?.transactions || [];

    // Compute balance from transactions
    let totalDebit = 0;
    let totalCredit = 0;

    const mappedTransactions = transactions.map((t) => {
      const amt = Number(t.amount);
      const isDebit = t.type.includes('DEBIT') || t.type.includes('INVOICE');
      if (isDebit) totalDebit += amt;
      else totalCredit += amt;

      return {
        id: t.id,
        date: t.createdAt.toLocaleDateString('tr-TR'),
        documentNo: t.orderId ? `SIP-${t.orderId.slice(-6)}` : `EVR-${t.id.slice(-6)}`,
        documentType: isDebit ? 'Satış Faturası' : 'Tahsilat Makbuzu',
        debt: isDebit ? amt : 0,
        credit: isDebit ? 0 : amt,
        balance: 0,
        balanceType: 'B',
        description: t.note || 'Cari İşlemi'
      };
    });

    const netBalance = totalDebit - totalCredit;

    return NextResponse.json({
      success: true,
      data: {
        companyName: company.legalName,
        taxNo: company.taxNo,
        taxOffice: company.taxOffice,
        tier: company.customerGroup?.name || 'Gold',
        creditLimit,
        totalDebit,
        totalCredit,
        balance: Math.abs(netBalance),
        balanceType: netBalance >= 0 ? 'B' : 'A', // B = Borçlu, A = Alacaklı
        transactions: mappedTransactions
      }
    });
  } catch (error: unknown) {
    console.error('GET /api/b2b/cari error:', error);
    const message = error instanceof Error ? error.message : 'Cari bilgileri yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
