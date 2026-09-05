import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { BankAccountSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/bank-accounts - Publicly visible for dealers & public customers with optional currency filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');

    const where: Record<string, any> = { isActive: true };
    if (currency && currency !== 'ALL') {
      where.currency = currency.toUpperCase();
    }

    const accounts = await prisma.bankAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error: unknown) {
    console.error('GET /api/bank-accounts error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST /api/bank-accounts - Admin only
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const body = await request.json();
    const parsed = BankAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, bankName, accountHolder, iban, branchName, branchCode, accountNumber, currency, swiftCode, bankLogo } = parsed.data;

    if (id) {
      const updated = await prisma.bankAccount.update({
        where: { id },
        data: {
          bankName,
          accountHolder,
          iban,
          branchName,
          branchCode,
          accountNumber,
          currency,
          swiftCode,
          bankLogo: bankLogo || '🏛️'
        }
      });

      await logAuditAction({
        actorId: user.id,
        action: 'BANK_ACCOUNT_UPDATE',
        entityType: 'BankAccount',
        entityId: id,
        afterJson: updated
      });

      return NextResponse.json({ success: true, data: updated, message: 'Banka hesabı güncellendi.' });
    }

    const created = await prisma.bankAccount.create({
      data: {
        bankName,
        accountHolder,
        iban,
        branchName,
        branchCode,
        accountNumber,
        currency,
        swiftCode,
        bankLogo: bankLogo || '🏛️'
      }
    });

    await logAuditAction({
      actorId: user.id,
      action: 'BANK_ACCOUNT_CREATE',
      entityType: 'BankAccount',
      entityId: created.id,
      afterJson: created
    });

    return NextResponse.json({ success: true, data: created, message: 'Banka hesabı başarıyla eklendi.' }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/bank-accounts error:', error);
    const message = error instanceof Error ? error.message : 'Hesap kaydedilirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/bank-accounts?id=xxx - Admin only
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Hesap ID belirtilmedi.' }, { status: 400 });
    }

    const deleted = await prisma.bankAccount.delete({
      where: { id }
    });

    await logAuditAction({
      actorId: user.id,
      action: 'BANK_ACCOUNT_DELETE',
      entityType: 'BankAccount',
      entityId: id,
      beforeJson: deleted
    });

    return NextResponse.json({ success: true, message: 'Banka hesabı silindi.' });
  } catch (error: unknown) {
    console.error('DELETE /api/bank-accounts error:', error);
    const message = error instanceof Error ? error.message : 'Hesap silinirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
