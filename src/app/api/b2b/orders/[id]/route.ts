import { NextRequest, NextResponse } from 'next/server';
import { requireDealer, requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/b2b/orders/[id] - Get order detail by ID or orderNo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;
  const { id } = await params;

  try {
    const whereClause: any = {
      OR: [
        { id },
        { orderNo: id }
      ]
    };
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
        address: true,
        payments: true
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const mapped = {
      id: order.id,
      orderNumber: order.orderNo,
      companyName: order.company?.legalName || 'Firma',
      userName: order.user?.name || order.user?.username || 'Bayi Yetkilisi',
      status: order.status,
      paymentMethod: order.paymentMethod || 'CARI',
      paymentStatus: order.payments?.[0]?.status || (order.paymentMethod === 'SANAL_POS' ? 'SUCCESS' : 'PENDING'),
      currency: order.currency,
      subtotalExVat: Number(order.subtotalExVat),
      vatTotal: Number(order.vatTotal),
      grandTotal: Number(order.grandTotal),
      orderNote: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      trackingNumber: order.shipments?.[0]?.trackingNumber || null,
      carrier: order.shipments?.[0]?.provider || null,
      address: order.address ? {
        title: order.address.title,
        line1: order.address.line1,
        district: order.address.district,
        city: order.address.city
      } : null,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        sku: i.sku,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitNetExVat: Number(i.unitNetExVat),
        discountAmt: Number(i.discountAmt),
        lineGross: Number(i.lineGross),
        image: i.product?.images?.[0]?.url || '/placeholder.svg'
      }))
    };

    return NextResponse.json({ success: true, data: mapped });
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

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNo: id }
        ]
      },
      include: { shipments: true, items: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const isCancelling = status === 'CANCELLED' && existingOrder.status !== 'CANCELLED';

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      const ord = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          status: status || existingOrder.status,
        },
        include: {
          items: true
        }
      });

      // 2. Update or create shipment tracking
      if (trackingNumber || carrier) {
        if (existingOrder.shipments && existingOrder.shipments.length > 0) {
          await tx.shipment.update({
            where: { id: existingOrder.shipments[0].id },
            data: {
              trackingNumber: trackingNumber || existingOrder.shipments[0].trackingNumber,
              provider: carrier || existingOrder.shipments[0].provider,
              status: status === 'DELIVERED' ? 'DELIVERED' : status === 'SHIPPED' ? 'SHIPPED' : 'IN_TRANSIT'
            }
          });
        } else {
          await tx.shipment.create({
            data: {
              orderId: existingOrder.id,
              provider: carrier || 'Aras Kargo',
              trackingNumber: trackingNumber || null,
              status: status === 'DELIVERED' ? 'DELIVERED' : status === 'SHIPPED' ? 'SHIPPED' : 'IN_TRANSIT'
            }
          });
        }
      }

      // 3. If cancelling, restore stocks and create reversal cari credit transaction (if paid with Cari)
      if (isCancelling) {
        // Restore stocks
        for (const item of ord.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQty: {
                  increment: Number(item.quantity)
                }
              }
            });
          }
        }

        // Reversal cari transaction only if order was billed to Cari account
        if (existingOrder.companyId && existingOrder.paymentMethod === 'CARI') {
          const currentAccount = await tx.currentAccount.findUnique({
            where: { companyId: existingOrder.companyId },
            include: {
              transactions: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          });

          if (currentAccount) {
            const lastBalance = currentAccount.transactions?.[0] ? Number(currentAccount.transactions[0].balanceAfter) : 0;
            const newBalance = Number((lastBalance - Number(existingOrder.grandTotal)).toFixed(2));

            await tx.currentAccountTransaction.create({
              data: {
                accountId: currentAccount.id,
                orderId: existingOrder.id,
                type: 'ORDER_CANCEL_CREDIT',
                amount: Number(existingOrder.grandTotal),
                balanceAfter: newBalance,
                note: `Sipariş #${existingOrder.orderNo} İptal / Bakiye Düzeltme İadesi`
              }
            });
          }
        }
      }

      return ord;
    });

    // Write audit log
    await logAuditAction({
      actorId: user.id,
      action: 'ORDER_UPDATE',
      entityType: 'Order',
      entityId: existingOrder.id,
      beforeJson: { status: existingOrder.status },
      afterJson: { status: updated.status, trackingNumber, carrier }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Sipariş durumu "${updated.status}" olarak güncellendi.`
    });

  } catch (error: unknown) {
    console.error('PUT /api/b2b/orders/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Sipariş güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
