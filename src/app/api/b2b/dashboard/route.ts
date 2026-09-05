import { NextRequest, NextResponse } from 'next/server';
import { requireDealerOrAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { getCompanyFinanceSummary } from '@/lib/financeService';

export const dynamic = 'force-dynamic';

// GET /api/b2b/dashboard — Live database dashboard metrics for the authenticated dealer
export async function GET(request: NextRequest) {
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

  try {
    const [summary, company] = await Promise.all([
      getCompanyFinanceSummary(targetCompanyId),
      prisma.company.findUnique({
        where: { id: targetCompanyId },
        include: {
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
      }) as any
    ]);

    if (!company || !summary) {
      return NextResponse.json({ success: false, error: 'Bayi firma bilgisi bulunamadı.' }, { status: 404 });
    }

    // 1. Finance & Cari Metrics from authoritative finance service
    const creditUsagePercent = summary.creditLimit > 0
      ? Math.min(100, Math.round(((summary.rawBalance > 0 ? summary.rawBalance : 0) / summary.creditLimit) * 100))
      : 0;

    // 2. Invoiced Sum (Delivered or Approved Orders)
    const allOrders: any[] = company.orders || [];
    const invoicedOrders = allOrders.filter(
      (o: any) => o.status === 'DELIVERED' || o.status === 'APPROVED' || o.status === 'COMPLETED'
    );
    const totalInvoiced = invoicedOrders.reduce((sum: number, o: any) => sum + Number(o.grandTotal), 0);

    // 3. Order Counts by Status
    const pendingOrders = allOrders.filter(
      (o: any) => o.status === 'PENDING' || o.status === 'PENDING_APPROVAL' || o.status === 'bekliyor'
    );
    const inTransitOrders = allOrders.filter(
      (o: any) => o.status === 'SHIPPED' || o.status === 'PREPARING' || o.status === 'sevkiyatta' || o.status === 'parcali'
    );
    const deliveredOrders = allOrders.filter(
      (o: any) => o.status === 'DELIVERED' || o.status === 'COMPLETED' || o.status === 'tamamlandi'
    );

    // 4. Recent Orders (Top 5)
    const recentOrders = allOrders.slice(0, 5).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNo,
      date: new Date(o.createdAt).toLocaleDateString('tr-TR'),
      time: new Date(o.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      totalTRY: Number(o.grandTotal),
      status: o.status,
      paymentMethod: o.paymentMethod || 'CARI',
      itemCount: o.items.length,
      items: o.items.map((i: any) => ({
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
          // Atomic fields
          cariBakiye: summary.cariBakiye,
          bakiyeYonu: summary.bakiyeYonu,
          krediLimiti: summary.creditLimit,
          kullanilabilirLimit: summary.kullanilabilirLimit,
          gecikenBorc: summary.gecikenBorc,
          odenecekTutar: summary.odenecekTutar,
          // Legacy mappings
          currentBalance: summary.rawBalance,
          creditLimit: summary.creditLimit,
          availableCredit: summary.kullanilabilirLimit,
          creditUsagePercent,
          balanceType: summary.balanceType,
          totalInvoiced,
          averageMaturityDays: null,
          upcomingPaymentDate: null
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
