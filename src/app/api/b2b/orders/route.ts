import { NextRequest, NextResponse } from 'next/server';
import { requireDealer, requireDealerOrAdmin, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { calculateServerPrice } from '@/lib/pricingEngine';

export const dynamic = 'force-dynamic';

// GET /api/b2b/orders - Get dealer company's orders or admin all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const companyIdParam = searchParams.get('companyId');

    const guard = await requireDealerOrAdmin({
      targetCompanyId: companyIdParam || undefined
    });
    if (guard instanceof NextResponse) return guard;

    const { user, companyId, isAdmin } = guard;

    // Dealers only see their own company's orders; Admins can see all or filter by verified company
    const whereClause: any = isAdmin
      ? (companyId && companyId !== 'ALL' ? { companyId } : {})
      : { companyId };
      
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
        shipments: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNo,
      companyName: o.company?.legalName || 'Firma',
      userName: o.user?.name || o.user?.username || 'Bayi Yetkilisi',
      status: o.status, // PENDING_APPROVAL, APPROVED, PREPARING, SHIPPED, DELIVERED, CANCELLED
      paymentMethod: o.paymentMethod || 'CARI',
      paymentStatus: o.payments?.[0]?.status || (o.paymentMethod === 'SANAL_POS' ? 'SUCCESS' : 'PENDING'),
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
        image: i.product?.images?.[0]?.url || '/placeholder.svg'
      }))
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: unknown) {
    console.error('GET /api/b2b/orders error:', error);
    const message = error instanceof Error ? error.message : 'Siparişler yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/b2b/orders - Create order from dealer's active cart with Cari / Sanal POS payment
export async function POST(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  if (!companyId && user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Sipariş vermek için onaylı bir firma kaydınız bulunmalıdır.' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      paymentMethod = 'CARI', // 'CARI' | 'SANAL_POS'
      orderNote,
      accountingNote,
      addressId,
      items: incomingItems,
      paymentData,
      idempotencyKey: bodyIdempotencyKey
    } = body;

    const idempotencyKey = request.headers.get('x-idempotency-key') || bodyIdempotencyKey || null;

    // Persistent DB Idempotency Check: look up unique idempotencyKey in DB
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true }
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          data: existing,
          message: `#${existing.orderNo} nolu siparişiniz zaten işlendi (DB Idempotent koruma).`
        }, { status: 200 });
      }
    }

    // Normalizing payment method
    const normalizedPaymentMethod = 
      paymentMethod === 'SANAL_POS' || paymentMethod === 'CREDIT_CARD' || paymentMethod === 'KREDI_KARTI'
        ? 'SANAL_POS'
        : paymentMethod === 'HAVALE_EFT' || paymentMethod === 'HAVALE' || paymentMethod === 'EFT'
        ? 'HAVALE_EFT'
        : 'CARI';

    // 1. Fetch user cart from DB or sync from incomingItems
    let cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: { items: { include: { product: true } } }
      });
    }

    // If DB cart is empty but frontend sent cart items, populate DB cart items
    if (cart.items.length === 0 && Array.isArray(incomingItems) && incomingItems.length > 0) {
      for (const inc of incomingItems) {
        const prodId = inc.productId || inc.product?.id || inc.id;
        const qty = Number(inc.quantity || 1);
        if (prodId) {
          const product = await prisma.product.findUnique({ where: { id: prodId } });
          if (product) {
            await prisma.cartItem.upsert({
              where: {
                cartId_productId: {
                  cartId: cart.id,
                  productId: product.id
                }
              },
              create: {
                cartId: cart.id,
                productId: product.id,
                quantity: qty
              },
              update: {
                quantity: qty
              }
            });
          }
        }
      }

      // Re-fetch cart
      cart = await prisma.cart.findFirst({
        where: { id: cart.id },
        include: { items: { include: { product: true } } }
      });
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Sepetinizde ürün bulunmuyor.' }, { status: 400 });
    }

    // 2. Strict Price & Stock Validation
    for (const item of cart.items) {
      const basePrice = Number(item.product.salePrice || 0);
      if (!item.product.salePrice || basePrice <= 0) {
        return NextResponse.json({
          success: false,
          error: `"${item.product.name}" isimli ürünün geçerli bir satış fiyatı bulunmamaktadır (0,00 TL). Fiyatsız veya fiyatı beklenen ürünler siparişe eklenemez.`
        }, { status: 400 });
      }

      const stock = Number(item.product.stockQty || 0);
      const qty = Number(item.quantity);
      if (stock < qty) {
        return NextResponse.json({
          success: false,
          error: `Yetersiz stok: "${item.product.name}" için mevcut stok ${stock}, talep edilen ${qty}.`
        }, { status: 400 });
      }
    }

    // 3. Generate unique order number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    const orderNo = `ERS-${timestamp}-${random}`;

    // 4. Calculate server-side prices and lines
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

      if (priceInfo.finalPriceTRY <= 0) {
        return NextResponse.json({
          success: false,
          error: `"${item.product.name}" için hesaplanan net birim fiyat 0,00 TL olamaz.`
        }, { status: 400 });
      }

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
        appliedRules: priceInfo.priceSourceLabel || priceInfo.ruleAppliedName || 'Liste Fiyatı'
      });
    }

    subtotalExVat = Number(subtotalExVat.toFixed(2));
    totalVat = Number(totalVat.toFixed(2));
    const grandTotal = Number((subtotalExVat + totalVat).toFixed(2));

    // 5. Credit Limit Validation (For Cari payment)
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

    if (normalizedPaymentMethod === 'CARI') {
      if (creditLimit > 0 && totalExposure > creditLimit) {
        return NextResponse.json({
          success: false,
          error: `Bu sipariş için kullanılabilir cari limitiniz yetersizdir. (Kredi Limitiniz: ${creditLimit.toLocaleString('tr-TR')} ₺, Mevcut Borç: ${currentDebt.toLocaleString('tr-TR')} ₺, Sipariş: ${grandTotal.toLocaleString('tr-TR')} ₺, Kullanılabilir: ${Math.max(0, creditLimit - currentDebt).toLocaleString('tr-TR')} ₺)`
        }, { status: 400 });
      }
    }

    const combinedNotes = [orderNote, accountingNote ? `[Muhasebe: ${accountingNote}]` : ''].filter(Boolean).join(' | ');

    // 6. ATOMIC TRANSACTION: Create Order + Stock Deduction + Payment / Ledger Entry + Cart Cleanup
    const newOrder = await prisma.$transaction(async (tx) => {
      // A. Create Order with unique idempotencyKey
      const order = await tx.order.create({
        data: {
          orderNo,
          idempotencyKey: idempotencyKey || undefined,
          userId: user.id,
          companyId,
          buyerType: 'B2B',
          status: normalizedPaymentMethod === 'SANAL_POS' ? 'APPROVED' : 'PENDING_APPROVAL',
          currency: 'TRY',
          subtotalExVat,
          vatTotal: totalVat,
          grandTotal,
          paymentMethod: normalizedPaymentMethod,
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

      // B. Deduct stock atomically with gte check (Guarantees stock >= 0 under concurrent load)
      for (const item of cart.items) {
        const qty = Number(item.quantity);
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQty: { gte: qty }
          },
          data: {
            stockQty: { decrement: qty }
          }
        });

        if (updateResult.count === 0) {
          throw new Error(
            `Yetersiz stok: "${item.product.name}" için talep edilen ${qty} adet stok kalmadı. Lütfen sepetinizi güncelleyiniz.`
          );
        }
      }

      // C. Handle Payment Method
      if (normalizedPaymentMethod === 'CARI') {
        // Create Current Account Transaction (Cari Borç Kaydı)
        let accountId = currentAccount?.id;
        let prevBal = lastBalance;

        if (!accountId) {
          const createdAcc = await tx.currentAccount.create({
            data: {
              companyId,
              creditLimit: 150000
            }
          });
          accountId = createdAcc.id;
          prevBal = 0;
        }

        const newBalance = Number((prevBal + grandTotal).toFixed(2));

        await tx.currentAccountTransaction.create({
          data: {
            accountId,
            orderId: order.id,
            type: 'ORDER_DEBIT',
            amount: grandTotal,
            balanceAfter: newBalance,
            note: `Sipariş #${orderNo} Satış Faturası Borç Kaydı`
          }
        });
      } else if (normalizedPaymentMethod === 'SANAL_POS') {
        // Create Payment record (Sanal POS Peşin Ödeme - Cari borç yazılmaz)
        await tx.payment.create({
          data: {
            provider: 'SANAL_POS',
            providerRef: `POS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            userId: user.id,
            companyId,
            orderId: order.id,
            purpose: 'ORDER_PAYMENT',
            amount: grandTotal,
            currency: 'TRY',
            status: 'SUCCESS',
            rawPayload: paymentData ? JSON.stringify({ cardHolder: paymentData.cardHolder, last4: paymentData.cardNumber?.slice(-4) }) : null
          }
        });
      } else if (normalizedPaymentMethod === 'HAVALE_EFT') {
        // Create Payment record (Havale / EFT Havuz Kaydı - Onay bekliyor)
        await tx.payment.create({
          data: {
            provider: 'HAVALE_EFT',
            providerRef: `EFT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            userId: user.id,
            companyId,
            orderId: order.id,
            purpose: 'ORDER_PAYMENT',
            amount: grandTotal,
            currency: 'TRY',
            status: 'PENDING',
            rawPayload: JSON.stringify({ bankAccount: body.bankAccountId || 'GENEL' })
          }
        });
      }

      // D. Clear active cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return order;
    });

    // Write audit log with persistent deduplication
    await logAuditAction({
      actorId: user.id,
      action: 'ORDER_CREATE',
      entityType: 'Order',
      entityId: newOrder.id,
      dedupKey: idempotencyKey ? `order:${idempotencyKey}` : undefined,
      afterJson: {
        orderNo,
        grandTotal,
        paymentMethod: normalizedPaymentMethod,
        itemCount: orderItemsData.length
      }
    });

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: `#${orderNo} nolu siparişiniz başarıyla oluşturuldu.`
    }, { status: 201 });

  } catch (error: any) {
    // Catch unique constraint violation on idempotencyKey (concurrent submission)
    const idempotencyKey = request.headers.get('x-idempotency-key');
    if (error?.code === 'P2002' && idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true }
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          data: existing,
          message: `#${existing.orderNo} nolu siparişiniz zaten işlendi (DB Idempotent koruma).`
        }, { status: 200 });
      }
    }

    console.error('POST /api/b2b/orders error:', error);
    const message = error instanceof Error ? error.message : 'Sipariş oluşturulurken sunucu hatası oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
