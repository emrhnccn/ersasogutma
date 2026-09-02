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

    // Calculate lines and totals using server-side pricing
    let subtotalExVat = 0;
    let totalVat = 0;
    const orderItemsData: Array<{
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      unit: string;
      currency: string;
      unitNetExVat: number;
      discountAmt: number;
      vatRate: number;
      vatAmount: number;
      lineGross: number;
      appliedRules?: string;
    }> = [];

    for (const item of cart.items) {
      const basePrice = Number(item.product.salePrice || 0);
      const qty = Number(item.quantity);
      const vatRate = Number(item.product.vatRate || 20);
      const priceInfo = await calculateServerPrice({
        productId: item.productId,
        basePriceTRY: basePrice,
        quantity: qty,
        companyId
      });

      const lineNetTotal = priceInfo.finalPriceTRY * qty;
      const vatAmt = Number((lineNetTotal * vatRate / 100).toFixed(2));
      const lineGross = Number((lineNetTotal + vatAmt).toFixed(2));

      subtotalExVat += lineNetTotal;
      totalVat += vatAmt;

      orderItemsData.push({
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        quantity: qty,
        unit: item.product.unit || 'ADET',
        currency: 'TRY',
        unitNetExVat: priceInfo.finalPriceTRY,
        discountAmt: priceInfo.discountAmountTRY,
        vatRate,
        vatAmount: vatAmt,
        lineGross,
        appliedRules: priceInfo.ruleAppliedName || `${priceInfo.tierName} %${priceInfo.appliedDiscountPercent}`
      });
    }

    subtotalExVat = Number(subtotalExVat.toFixed(2));
    totalVat = Number(totalVat.toFixed(2));
    const grandTotal = Number((subtotalExVat + totalVat).toFixed(2));

    // Check credit limit and risk
    const currentAccount = await prisma.currentAccount.findUnique({
      where: { companyId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const creditLimit = Number(currentAccount?.creditLimit || 0);
    const lastBalance = currentAccount?.transactions?.[0] ? Number(currentAccount.transactions[0].balanceAfter) : 0;
    const currentDebt = lastBalance > 0 ? lastBalance : 0;
    const totalExposure = currentDebt + grandTotal;
    const isLimitExceeded = creditLimit > 0 && totalExposure > creditLimit;

    const initialOrderStatus = isLimitExceeded ? 'PENDING_LIMIT_APPROVAL' : 'PENDING_APPROVAL';
    const limitNote = isLimitExceeded 
      ? `[KREDİ LİMİTİ AŞIMI: Limit ${creditLimit.toLocaleString('tr-TR')} ₺, Talep Edilen Toplam Borç: ${totalExposure.toLocaleString('tr-TR')} ₺ - Yönetici Onayı Bekliyor]` 
      : '';

    const combinedNotes = [orderNote, accountingNote ? `[Muhasebe Notu: ${accountingNote}]` : '', limitNote].filter(Boolean).join(' | ');

    // Use transaction for atomicity: create order + deduct stock + create cari entry + clear cart
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Create Order with Items
      const order = await tx.order.create({
        data: {
          orderNo,
          userId: user.id,
          companyId,
          buyerType: 'B2B',
          status: initialOrderStatus,
          currency: 'TRY',
          subtotalExVat,
          vatTotal: totalVat,
          grandTotal,
          paymentMethod,
          notes: combinedNotes,
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

      // 2. Deduct stock for all items
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              decrement: Number(item.quantity)
            }
          }
        });
      }

      // 3. Create Current Account Transaction (Cari borç kaydı)
      if (currentAccount) {
        const newBalance = lastBalance + grandTotal;

        await tx.currentAccountTransaction.create({
          data: {
            accountId: currentAccount.id,
            orderId: order.id,
            type: 'ORDER_DEBIT',
            amount: grandTotal,
            balanceAfter: newBalance,
            note: `Sipariş #${orderNo} Satış Faturası Borç Kaydı${isLimitExceeded ? ' (Limit Aşımı)' : ''}`
          }
        });
      }

      // 4. Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return order;
    });

    // Write audit log (outside transaction - non-critical)
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
