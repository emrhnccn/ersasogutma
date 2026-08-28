import { NextRequest, NextResponse } from 'next/server';
import { requireDealer, requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/b2b/orders/[id] - Get order detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;
  const { id } = await params;

  try {
    const whereClause: any = { id };
    if (user.role !== 'ADMIN') {
      whereClause.companyId = companyId;
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } }
              }
            }
          }
        },
        company: true,
        user: true,
        shipments: true,
        address: true
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: unknown) {
    console.error('GET /api/b2b/orders/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Sipariş detayı yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/b2b/orders/[id] - Update order status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, trackingNumber, carrier } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { shipments: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: status || existingOrder.status,
      }
    });

    if (trackingNumber || carrier) {
      if (existingOrder.shipments.length > 0) {
        await prisma.shipment.update({
          where: { id: existingOrder.shipments[0].id },
          data: {
            trackingNumber: trackingNumber || existingOrder.shipments[0].trackingNumber,
            provider: carrier || existingOrder.shipments[0].provider,
            status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT'
          }
        });
      } else {
        await prisma.shipment.create({
          data: {
            orderId: id,
            trackingNumber,
            provider: carrier || 'Aras Kargo',
            status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT'
          }
        });
      }
    }

    // Write audit log
    await logAuditAction({
      actorId: user.id,
      action: 'ORDER_STATUS_UPDATE',
      entityType: 'Order',
      entityId: id,
      beforeJson: { status: existingOrder.status },
      afterJson: { status, trackingNumber, carrier }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Sipariş durumu "${status}" olarak güncellendi.`
    });
  } catch (error: unknown) {
    console.error('PUT /api/b2b/orders/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Sipariş güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
