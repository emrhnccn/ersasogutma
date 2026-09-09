import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { calculateServerPriceBatch } from '@/lib/pricingEngine';

export const dynamic = 'force-dynamic';

// POST /api/admin/dealers/[id]/order — Create an order for a dealer directly from Admin Panel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user: adminUser } = guard;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      items: incomingItems,
      paymentMethod = 'CARI',
      notes = '',
      status = 'APPROVED',
      clearCart = true
    } = body;

    // 1. Fetch Dealer Company
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              include: {
                carts: {
                  include: {
                    items: {
                      include: {
                        product: true
                      }
                    }
                  }
                }
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
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Bayi bulunamadı.' }, { status: 404 });
    }

    const primaryUser = company.members[0]?.user;
    if (!primaryUser) {
      return NextResponse.json({ success: false, error: 'Bayiye ait kullanıcı hesabı bulunamadı.' }, { status: 404 });
    }

    // 2. Determine Items Source (from incomingItems or existing dealer Cart)
    let rawItems: Array<{ productId: string; quantity: number }> = [];

    if (Array.isArray(incomingItems) && incomingItems.length > 0) {
      rawItems = incomingItems.map((i: any) => ({
        productId: i.productId,
        quantity: Math.max(1, parseInt(String(i.quantity), 10) || 1)
      }));
    } else {
      const dealerCart = primaryUser.carts[0];
      if (!dealerCart || !dealerCart.items || dealerCart.items.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Bayinin sepetinde siparişe dönüştürülecek ürün bulunamadı. Lütfen önce ürün ekleyiniz.'
        }, { status: 400 });
      }
      rawItems = dealerCart.items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity)
      }));
    }

    if (rawItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Sipariş kalemi belirtilmedi.' }, { status: 400 });
    }

    // 3. Fetch Product details from DB
    const productIds = rawItems.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true, brand: true }
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Check availability & stock
    for (const item of rawItems) {
      const p = productMap.get(item.productId);
      if (!p) {
        return NextResponse.json({ success: false, error: `Ürün bulunamadı (ID: ${item.productId})` }, { status: 400 });
      }
      const availableStock = Number(p.stockQty || 0);
      if (item.quantity > availableStock) {
        return NextResponse.json({
          success: false,
          error: `Yetersiz stok! "${p.name}" için mevcut stok: ${availableStock}, talep edilen: ${item.quantity}`
        }, { status: 400 });
      }
    }

    // 4. Calculate prices with dealer discount
    const priceBatchInputs = rawItems.map((it) => {
      const p = productMap.get(it.productId)!;
      return {
        productId: p.id,
        basePriceTRY: Number(p.salePrice || 0),
        quantity: it.quantity
      };
    });

    const calculatedPrices = await calculateServerPriceBatch(priceBatchInputs, company.id);

    let subtotalExVat = 0;
    let totalVat = 0;

    const orderItemsData = rawItems.map((it, idx) => {
      const p = productMap.get(it.productId)!;
      const priceInfo = calculatedPrices[idx] || {
        basePriceTRY: Number(p.salePrice || 0),
        finalPriceTRY: Number(p.salePrice || 0),
        discountAmountTRY: 0,
        priceSourceLabel: 'Standart'
      };

      const unitNetExVat = priceInfo.finalPriceTRY;
      const lineNetTotal = unitNetExVat * it.quantity;
      const vatRate = Number(p.vatRate || 20);
      const vatAmt = Number(((lineNetTotal * vatRate) / 100).toFixed(2));
      const lineGross = Number((lineNetTotal + vatAmt).toFixed(2));

      subtotalExVat += lineNetTotal;
      totalVat += vatAmt;

      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        quantity: it.quantity,
        unit: p.unit || 'ADET',
        currency: 'TRY',
        unitNetExVat,
        discountAmt: priceInfo.discountAmountTRY || 0,
        vatRate,
        vatAmount: vatAmt,
        lineGross,
        appliedRules: priceInfo.priceSourceLabel || 'Standart'
      };
    });

    subtotalExVat = Number(subtotalExVat.toFixed(2));
    totalVat = Number(totalVat.toFixed(2));
    const grandTotal = Number((subtotalExVat + totalVat).toFixed(2));

    // 5. Generate unique Order Number
    const orderCount = await prisma.order.count();
    const orderNo = `ERS-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, '0')}`;

    // 6. Execute Transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // A. Create Order
      const order = await tx.order.create({
        data: {
          orderNo,
          userId: primaryUser.id,
          companyId: company.id,
          buyerType: 'B2B',
          status,
          currency: 'TRY',
          subtotalExVat,
          vatTotal: totalVat,
          grandTotal,
          paymentMethod,
          notes: notes ? `[Yönetici Siparişi] ${notes}` : '[Yönetici Tarafından Oluşturuldu]',
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
          items: true,
          company: true,
          user: true
        }
      });

      // B. Deduct Stock
      for (const item of rawItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: { decrement: item.quantity }
          }
        });
      }

      // C. Clear dealer cart if requested
      if (clearCart && primaryUser.carts[0]) {
        await tx.cartItem.deleteMany({
          where: { cartId: primaryUser.carts[0].id }
        });
      }

      // D. If payment method is CARI, record ledger transaction
      if (paymentMethod === 'CARI') {
        let currentAccount = company.currentAccount;
        if (!currentAccount) {
          currentAccount = await tx.currentAccount.create({
            data: {
              companyId: company.id,
              creditLimit: 0
            },
            include: { transactions: true }
          });
        }

        const lastBalance = currentAccount.transactions?.[0]
          ? Number(currentAccount.transactions[0].balanceAfter)
          : 0;
        const newBalance = Number((lastBalance + grandTotal).toFixed(2));

        await tx.currentAccountTransaction.create({
          data: {
            accountId: currentAccount.id,
            orderId: order.id,
            type: 'ORDER_DEBIT',
            amount: grandTotal,
            balanceAfter: newBalance,
            note: `Sipariş No: ${orderNo} (Yönetici Tarafından Oluşturuldu)`
          }
        });
      }

      return order;
    });

    // 7. Audit log
    await logAuditAction({
      actorId: adminUser.id,
      action: 'ADMIN_ORDER_CREATED',
      entityType: 'Order',
      entityId: newOrder.id,
      afterJson: {
        orderNo: newOrder.orderNo,
        companyId: company.id,
        companyName: company.legalName,
        grandTotal,
        itemCount: orderItemsData.length
      }
    });

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: `"${company.legalName}" için ${newOrder.orderNo} nolu sipariş başarıyla oluşturuldu.`
    });
  } catch (error: unknown) {
    console.error('POST /api/admin/dealers/[id]/order error:', error);
    const message = error instanceof Error ? error.message : 'Sipariş oluşturulurken bir hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
