import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// POST /api/admin/dealers/[id]/cari-transaction — Add manual debt or payment transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      type = 'MANUAL_DEBIT', // MANUAL_DEBIT, MANUAL_CREDIT, CORRECTION
      amount,
      note,
      docNo
    } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Geçerli bir işlem tutarı giriniz.' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        currentAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Bayi bulunamadı.' }, { status: 404 });
    }

    let accountId = company.currentAccount?.id;
    let prevBalance = 0;

    if (!company.currentAccount) {
      const created = await prisma.currentAccount.create({
        data: { companyId: id, creditLimit: 150000 }
      });
      accountId = created.id;
    } else {
      const latestTx = company.currentAccount.transactions?.[0];
      prevBalance = latestTx ? Number(latestTx.balanceAfter) : 0;
    }

    const isDebit = type.includes('DEBIT') || type === 'ORDER_DEBIT';
    const balanceAfter = Number((isDebit ? prevBalance + numAmount : prevBalance - numAmount).toFixed(2));

    const finalNote = [
      docNo ? `[Evrak No: ${docNo}]` : '',
      note || (isDebit ? 'Manuel Borç Dekontu' : 'Manuel Tahsilat/Ödeme Dekontu'),
      `(İşlem Yapan: ${user.name || user.username})`
    ].filter(Boolean).join(' - ');

    const newTx = await prisma.currentAccountTransaction.create({
      data: {
        accountId: accountId!,
        type,
        amount: numAmount,
        balanceAfter,
        note: finalNote
      }
    });

    await logAuditAction({
      actorId: user.id,
      action: 'CARI_TRANSACTION_CREATED',
      entityType: 'CurrentAccountTransaction',
      entityId: newTx.id,
      afterJson: {
        companyId: id,
        companyName: company.legalName,
        type,
        amount: numAmount,
        balanceAfter,
        docNo
      }
    });

    return NextResponse.json({
      success: true,
      data: newTx,
      message: `${isDebit ? 'Borç' : 'Tahsilat'} hareketi başarıyla işlendi. Yeni Bakiye: ${balanceAfter.toLocaleString('tr-TR')} ₺`
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/admin/dealers/[id]/cari-transaction error:', error);
    const message = error instanceof Error ? error.message : 'Cari hareket kaydedilirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
