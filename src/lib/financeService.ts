import { prisma } from '@/lib/prisma';

export interface CompanyFinanceSummary {
  companyId: string;
  companyName: string;
  taxNo: string;
  taxOffice: string;
  tierName: string;
  creditLimit: number;
  rawBalance: number;         // Positive if Borçlu (debt), negative if Alacaklı (credit)
  cariBakiye: number;         // Absolute value of balance
  bakiyeYonu: 'BORC' | 'ALACAK';
  balanceType: 'B' | 'A';
  kullanilabilirLimit: number; // Max(0, creditLimit - (rawBalance > 0 ? rawBalance : 0))
  gecikenBorc: number;
  odenecekTutar: number;      // Amount dealer owes that can be collected / paid via POS
  totalDebit: number;         // Total debit transactions sum
  totalCredit: number;        // Total credit transactions sum
  lastTransactionDate?: string | null;
}

/**
 * Pure helper function for atomic financial calculation
 */
export function calculateFinancialFields(params: {
  creditLimit: number;
  totalDebit: number;
  totalCredit: number;
  rawBalance?: number;
  overdueSum?: number;
}) {
  const creditLimit = Number(params.creditLimit) || 0;
  const totalDebit = Number(params.totalDebit) || 0;
  const totalCredit = Number(params.totalCredit) || 0;

  // If rawBalance is not provided directly, calculate it: totalDebit - totalCredit
  const rawBalance = params.rawBalance !== undefined
    ? Number(params.rawBalance)
    : Number((totalDebit - totalCredit).toFixed(2));

  const cariBakiye = Math.abs(rawBalance);
  const bakiyeYonu: 'BORC' | 'ALACAK' = rawBalance >= 0 ? 'BORC' : 'ALACAK';
  const balanceType: 'B' | 'A' = rawBalance >= 0 ? 'B' : 'A';

  const usedCredit = rawBalance > 0 ? rawBalance : 0;
  const kullanilabilirLimit = Math.max(0, Number((creditLimit - usedCredit).toFixed(2)));
  const odenecekTutar = rawBalance > 0 ? Number(rawBalance.toFixed(2)) : 0;
  const gecikenBorc = params.overdueSum && rawBalance > 0 ? Math.min(rawBalance, params.overdueSum) : 0;

  return {
    creditLimit,
    rawBalance,
    cariBakiye,
    bakiyeYonu,
    balanceType,
    kullanilabilirLimit,
    odenecekTutar,
    gecikenBorc,
    totalDebit,
    totalCredit
  };
}

/**
 * Single source of truth for company financial statement and live balances
 */
export async function getCompanyFinanceSummary(companyId: string): Promise<CompanyFinanceSummary | null> {
  if (!companyId) return null;

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

  if (!company) return null;

  const creditLimit = Number(company.currentAccount?.creditLimit || 0);
  const transactions = company.currentAccount?.transactions || [];

  // Latest transaction determines current balance
  const latestTx = transactions[0];
  const rawBalance = latestTx ? Number(latestTx.balanceAfter) : 0;

  // Overdue debt calculation
  let overdueSum = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const overdueTx = transactions.filter(
    (t) => (t.type.includes('DEBIT') || t.type === 'ORDER_DEBIT') && new Date(t.createdAt) < thirtyDaysAgo
  );
  if (rawBalance > 0 && overdueTx.length > 0) {
    overdueSum = overdueTx.reduce((sum, t) => sum + Number(t.amount), 0);
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const t of transactions) {
    const amt = Number(t.amount);
    if (t.type.includes('DEBIT') || t.type === 'ORDER_DEBIT') {
      totalDebit += amt;
    } else {
      totalCredit += amt;
    }
  }

  const computed = calculateFinancialFields({
    creditLimit,
    rawBalance,
    totalDebit,
    totalCredit,
    overdueSum
  });

  return {
    companyId: company.id,
    companyName: company.legalName,
    taxNo: company.taxNo || '—',
    taxOffice: company.taxOffice || '—',
    tierName: company.customerGroup?.name || 'Standart Bayi',
    ...computed,
    lastTransactionDate: latestTx ? latestTx.createdAt.toISOString() : null
  };
}
