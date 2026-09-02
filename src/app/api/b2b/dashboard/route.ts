import { NextRequest, NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/b2b/dashboard — Live database dashboard metrics for the authenticated dealer
export async function GET(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        currentAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } }
                }
              }
            },
            shipments: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Bayi firma bilgisi bulunamadı.' }, { status: 404 });
    }

    // 1. Finance & Cari Metrics
    const transactions = company.currentAccount?.transactions || [];
    const latestTx = transactions[0];
    const currentBalance = latestTx ? Number(latestTx.balanceAfter) : 0;
    const creditLimit = Number(company.currentAccount?.creditLimit || 0);
    const usedCredit = currentBalance > 0 ? currentBalance : 0;
    const availableCredit = Math.max(0, creditLimit - usedCredit);
    const creditUsagePercent = creditLimit > 0 ? Math.min(100, Math.round((usedCredit / creditLimit) * 100)) : 0;
    const balanceType = currentBalance >= 0 ? 'B' : 'A'; // 'B': Borçlu, 'A': Alacaklı

    // 2. Invoiced Sum (Delivered or Approved Orders)
    const invoicedOrders = company.orders.filter(
      (o) => o.status === 'DELIVERED' || o.status === 'APPROVED' || o.status === 'COMPLETED'
    );
    const totalInvoiced = invoicedOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);

    // 3. Order Counts by Status
    const allOrders = company.orders;
    const pendingOrders = allOrders.filter(
      (o) => o.status === 'PENDING' || o.status === 'PENDING_APPROVAL' || o.status === 'bekliyor'
    );
    const inTransitOrders = allOrders.filter(
      (o) => o.status === 'SHIPPED' || o.status === 'PREPARING' || o.status === 'sevkiyatta' || o.status === 'parcali'
    );
    const deliveredOrders = allOrders.filter(
      (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED' || o.status === 'tamamlandi'
    );

    // 4. Recent Orders (Top 5)
    const recentOrders = allOrders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNo,
      date: new Date(o.createdAt).toLocaleDateString('tr-TR'),
      time: new Date(o.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      totalTRY: Number(o.grandTotal),
      status: o.status,
      paymentMethod: o.paymentMethod || 'CARI',
      itemCount: o.items.length,
      items: o.items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitPriceTRY: Number(i.unitNetExVat),
        totalTRY: Number(i.lineGross),
        image: i.product?.images?.[0]?.url || '/placeholder.svg'
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        company: {
          id: company.id,
          legalName: company.legalName,
          taxNo: company.taxNo || '',
          dealerCode: user.username || `BAYI-${company.id.slice(-6).toUpperCase()}`,
          customDiscountPercent: Number(company.customDiscountPercent || 0)
        },
        finance: {
          currentBalance,
          creditLimit,
          availableCredit,
          creditUsagePercent,
          balanceType,
          totalInvoiced,
          averageMaturityDays: null, // null means "Vade bilgisi bulunmuyor"
          upcomingPaymentDate: null // null means "Yaklaşan ödeme bulunmuyor"
        },
        orders: {
          totalCount: allOrders.length,
          pendingCount: pendingOrders.length,
          inTransitCount: inTransitOrders.length,
          deliveredCount: deliveredOrders.length,
          recent: recentOrders
        }
      }
    });

  } catch (error: unknown) {
    console.error('GET /api/b2b/dashboard error:', error);
    const message = error instanceof Error ? error.message : 'Dashboard verileri yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
