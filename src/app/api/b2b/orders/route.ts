import { NextRequest, NextResponse } from 'next/server';
import { requireDealer, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { OrderCreateSchema } from '@/lib/validations';
import { calculateServerPrice } from '@/lib/pricingEngine';

export const dynamic = 'force-dynamic';

// GET /api/b2b/orders - Get dealer company's orders or admin all orders
export async function GET(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Dealers only see their own company's orders; Admins can see all or filter
    const whereClause: any = user.role === 'ADMIN' ? {} : { companyId };
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
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
        company: {
          select: { id: true, legalName: true, taxNo: true, phone: true }
        },
        user: {
          select: { id: true, name: true, email: true, username: true }
        },
        shipments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNo,
      companyName: o.company?.legalName || 'Firma',
      userName: o.user?.name || o.user?.username || 'Bayi Yetkilisi',
      status: o.status, // PENDING_APPROVAL, APPROVED, PREPARING, SHIPPED, DELIVERED, CANCELLED
      currency: o.currency,
      subtotalExVat: Number(o.subtotalExVat),
      vatTotal: Number(o.vatTotal),
      grandTotal: Number(o.grandTotal),
      orderNote: o.notes,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      trackingNumber: o.shipments?.[0]?.trackingNumber || null,
      carrier: o.shipments?.[0]?.provider || null,
      itemCount: o.items.length,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        sku: i.sku,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitNetExVat: Number(i.unitNetExVat),
        discountAmt: Number(i.discountAmt),
        lineGross: Number(i.lineGross),
        image: i.product?.images?.[0]?.url || ''
      }))
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: unknown) {
    console.error('GET /api/b2b/orders error:', error);
    const message = error instanceof Error ? error.message : 'Siparişler yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/b2b/orders - Create order from dealer's active cart
export async function POST(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = OrderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { paymentMethod, orderNote, accountingNote, addressId } = parsed.data;

    // Fetch user cart
    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Sepetinizde ürün bulunmuyor.' }, { status: 400 });
    }

    // Check stock for all items
    for (const item of cart.items) {
      const stock = Number(item.product.stockQty || 0);
      const qty = Number(item.quantity);
      if (stock < qty) {
        return NextResponse.json({
          success: false,
          error: `Yetersiz stok: "${item.product.name}" için mevcut stok ${stock}, talep edilen ${qty}.`
        }, { status: 400 });
      }
    }

    // Generate unique sequential order number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    const orderNo = `ERS-${timestamp}-${random}`;

    // Calculate lines and totals
    let subtotalExVat = 0;
    let totalDiscount = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const basePrice = Number(item.product.salePrice || 0);
      const qty = Number(item.quantity);
      const priceInfo = await calculateServerPrice({
        productId: item.productId,
        basePriceTRY: basePrice,
        quantity: qty,
        companyId
      });

      const lineTotal = priceInfo.finalPriceTRY * qty;
      const vatAmt = lineTotal * 0.20;
      const lineGross = lineTotal + vatAmt;

      subtotalExVat += (basePrice * qty);
      totalDiscount += (priceInfo.discountAmountTRY * qty);

      orderItemsData.push({
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        quantity: qty,
        unit: item.product.unit || 'ADET',
        currency: 'TRY',
        unitNetExVat: priceInfo.finalPriceTRY,
        discountAmt: priceInfo.discountAmountTRY,
        vatRate: 20,
        vatAmount: vatAmt,
        lineGross,
        appliedRules: priceInfo.ruleAppliedName || `${priceInfo.tierName} %${priceInfo.appliedDiscountPercent}`
      });

      // Deduct stock in DB
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQty: {
            decrement: qty
          }
        }
      });
    }

    const discountedSubtotal = subtotalExVat - totalDiscount;
    const vatTotal = discountedSubtotal * 0.20;
    const grandTotal = discountedSubtotal + vatTotal;

    // Create Order with Items
    const newOrder = await prisma.order.create({
      data: {
        orderNo,
        userId: user.id,
        companyId,
        buyerType: 'B2B',
        status: 'PENDING_APPROVAL',
        currency: 'TRY',
        subtotalExVat: discountedSubtotal,
        vatTotal,
        grandTotal,
        paymentMethod,
        notes: [orderNote, accountingNote ? `[Muhasebe Notu: ${accountingNote}]` : ''].filter(Boolean).join(' | '),
        addressId: addressId || undefined,
        items: {
          create: orderItemsData
        },
        shipments: {
          create: {
            provider: 'Aras Kargo',
            status: 'PENDING'
          }
        }
      },
      include: {
        items: true
      }
    });

    // Create Current Account Transaction (Cari borç kaydı)
    const currentAccount = await prisma.currentAccount.findUnique({
      where: { companyId }
    });

    if (currentAccount) {
      await prisma.currentAccountTransaction.create({
        data: {
          accountId: currentAccount.id,
          orderId: newOrder.id,
          type: 'ORDER_DEBIT',
          amount: grandTotal,
          balanceAfter: 0,
          note: `Sipariş #${orderNo} Satış Faturası Borç Kaydı`
        }
      });
    }

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    // Write audit log
    await logAuditAction({
      actorId: user.id,
      action: 'ORDER_CREATE',
      entityType: 'Order',
      entityId: newOrder.id,
      afterJson: { orderNo, grandTotal, itemCount: orderItemsData.length }
    });

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: `#${orderNo} nolu siparişiniz başarıyla oluşturuldu.`
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('POST /api/b2b/orders error:', error);
    const message = error instanceof Error ? error.message : 'Sipariş oluşturulurken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
