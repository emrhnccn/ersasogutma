import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/bank-accounts
export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error: unknown) {
    console.error('GET /api/bank-accounts error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST /api/bank-accounts - Create or update bank account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, bankName, accountHolder, iban, branchName, branchCode, accountNumber, currency = 'TRY', swiftCode, bankLogo } = body;

    if (!bankName || !accountHolder || !iban) {
      return NextResponse.json(
        { success: false, error: 'Banka adı, hesap sahibi ve IBAN zorunludur.' },
        { status: 400 }
      );
    }

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
          bankLogo
        }
      });
      return NextResponse.json({ success: true, data: updated });
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

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/bank-accounts error:', error);
    const message = error instanceof Error ? error.message : 'Hesap kaydedilirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/bank-accounts?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Hesap ID belirtilmedi.' }, { status: 400 });
    }

    await prisma.bankAccount.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Banka hesabı silindi.' });
  } catch (error: unknown) {
    console.error('DELETE /api/bank-accounts error:', error);
    const message = error instanceof Error ? error.message : 'Hesap silinirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
