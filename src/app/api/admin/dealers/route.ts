import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// GET /api/admin/dealers — List all dealers with real cari and order summary
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { taxNo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        customerGroup: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
                phone: true,
                status: true
              }
            }
          }
        },
        currentAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNo: true,
            grandTotal: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = companies.map((c) => {
      const primaryUser = c.members[0]?.user;
      const latestTx = c.currentAccount?.transactions[0];
      const currentBalance = latestTx ? Number(latestTx.balanceAfter) : 0;
      const creditLimit = Number(c.currentAccount?.creditLimit || 0);
      const availableCredit = Math.max(0, creditLimit - (currentBalance > 0 ? currentBalance : 0));
      const totalOrderSum = c.orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
      const lastOrder = c.orders[0];
      const customDiscount = Number(c.customDiscountPercent || 0);

      return {
        id: c.id,
        dealerCode: primaryUser?.username || `BAYI-${c.id.slice(-6).toUpperCase()}`,
        companyName: c.legalName,
        contactPerson: primaryUser?.name || 'Yetkili',
        phone: c.phone || primaryUser?.phone || '',
        email: c.email || primaryUser?.email || '',
        taxNo: c.taxNo || '—',
        taxOffice: c.taxOffice || '—',
        customDiscountPercent: customDiscount,
        discountRate: customDiscount,
        creditLimit,
        currentBalance,
        availableCredit,
        status: c.status,
        totalOrders: c.orders.length,
        totalOrderSum,
        lastOrderDate: lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString('tr-TR') : '—',
        registeredAt: new Date(c.createdAt).toLocaleDateString('tr-TR')
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: unknown) {
    console.error('GET /api/admin/dealers error:', error);
    const message = error instanceof Error ? error.message : 'Bayiler listelenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
