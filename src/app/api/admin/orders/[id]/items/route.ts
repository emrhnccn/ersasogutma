import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/orders/[id]/items - Admin intervention on dealer order items
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, productId, itemId, quantity, unitNetExVat, customPrice } = body;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNo: id }]
      },
      include: {
        company: true,
        items: {
          include: {
            product: {
              include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      return NextResponse.json({
        success: false,
        error: `"${order.status}" durumundaki sipariş üzerinde değişiklik yapılamaz.`
      }, { status: 400 });
    }

    const previousGrandTotal = Number(order.grandTotal);

    // Calculate dealer discount rate
    const dealerDiscountRate = order.company?.customDiscountPercent
      ? Number(order.company.customDiscountPercent)
      : 0;

    const result = await prisma.$transaction(async (tx) => {
      if (action === 'add_item') {
        if (!productId) {
          throw new Error('Ürün ID belirtilmedi.');
        }

        const product = await tx.product.findUnique({
          where: { id: productId },
          include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } }
        });

        if (!product) {
          throw new Error('Eklenecek ürün bulunamadı.');
        }

        const rawQty = Number(quantity) || 1;
        const availableStock = Number(product.stockQty || 0);
        const finalQty = availableStock > 0 && rawQty > availableStock ? availableStock : Math.max(1, rawQty);

        const listPrice = Number(product.salePrice || 0);
        // Custom unit price specified by admin or calculated default
        const priceToUse =
          customPrice !== undefined && !isNaN(Number(customPrice)) && Number(customPrice) >= 0
            ? Number(Number(customPrice).toFixed(2))
            : unitNetExVat !== undefined && !isNaN(Number(unitNetExVat)) && Number(unitNetExVat) >= 0
            ? Number(Number(unitNetExVat).toFixed(2))
            : Number((listPrice * (1 - dealerDiscountRate)).toFixed(2));

        const finalUnitNetExVat = priceToUse;
        const vatRate = Number(product.vatRate || 20);
        const vatAmount = Number((finalUnitNetExVat * (vatRate / 100)).toFixed(2));
        const lineGross = Number(((finalUnitNetExVat + vatAmount) * finalQty).toFixed(2));

        // Deduct from product stock
        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: { decrement: finalQty } }
        });

        // Check if item already in order
        const existingItem = order.items.find((i) => i.productId === productId);
        if (existingItem) {
          const newQty = Number(existingItem.quantity) + finalQty;
          const newLineGross = Number(((finalUnitNetExVat + vatAmount) * newQty).toFixed(2));
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: newQty,
              unitNetExVat: finalUnitNetExVat,
              vatAmount,
              lineGross: newLineGross
            }
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              name: product.name,
              sku: product.sku,
              quantity: finalQty,
              unit: product.unit || 'ADET',
              currency: order.currency || 'TRY',
              unitNetExVat: finalUnitNetExVat,
              vatRate,
              vatAmount,
              lineGross,
              discountAmt: Number((listPrice * dealerDiscountRate).toFixed(2))
            }
          });
        }
      } else if (
        action === 'update_qty' ||
        action === 'update_item' ||
        action === 'update_price'
      ) {
        if (!itemId) {
          throw new Error('Kalem ID belirtilmedi.');
        }

        const existingItem = order.items.find((i) => i.id === itemId);
        if (!existingItem) {
          throw new Error('Düzenlenecek sipariş kalemi bulunamadı.');
        }

        const oldQty = Number(existingItem.quantity);
        const newQty = quantity !== undefined ? Number(quantity) : oldQty;

        if (newQty <= 0) {
          if (existingItem.productId) {
            await tx.product.update({
              where: { id: existingItem.productId },
              data: { stockQty: { increment: oldQty } }
            });
          }
          await tx.orderItem.delete({ where: { id: itemId } });
        } else {
          // Check product stock clamp (including what this order item already holds)
          let finalQty = newQty;
          if (existingItem.productId && quantity !== undefined) {
            const prod = await tx.product.findUnique({ where: { id: existingItem.productId } });
            const maxAllowed = prod ? Math.max(0, Number(prod.stockQty) + oldQty) : finalQty;
            if (maxAllowed > 0 && finalQty > maxAllowed) {
              finalQty = maxAllowed;
            }
          }

          const qtyDelta = finalQty - oldQty;
          if (qtyDelta !== 0 && existingItem.productId) {
            if (qtyDelta > 0) {
              await tx.product.update({
                where: { id: existingItem.productId },
                data: { stockQty: { decrement: qtyDelta } }
              });
            } else {
              await tx.product.update({
                where: { id: existingItem.productId },
                data: { stockQty: { increment: Math.abs(qtyDelta) } }
              });
            }
          }

          // Check custom unit price
          const finalUnitNet =
            unitNetExVat !== undefined && !isNaN(Number(unitNetExVat)) && Number(unitNetExVat) >= 0
              ? Number(Number(unitNetExVat).toFixed(2))
              : Number(existingItem.unitNetExVat);

          const vatRate = Number(existingItem.vatRate || 20);
          const newVatAmt = Number((finalUnitNet * (vatRate / 100)).toFixed(2));
          const newLineGross = Number(((finalUnitNet + newVatAmt) * finalQty).toFixed(2));

          await tx.orderItem.update({
            where: { id: itemId },
            data: {
              quantity: finalQty,
              unitNetExVat: finalUnitNet,
              vatAmount: newVatAmt,
              lineGross: newLineGross
            }
          });
        }
      } else if (action === 'remove_item') {
        if (!itemId) {
          throw new Error('Kalem ID belirtilmedi.');
        }
        const existingItem = order.items.find((i) => i.id === itemId);
        if (!existingItem) {
          throw new Error('Silinecek sipariş kalemi bulunamadı.');
        }
        if (existingItem.productId) {
          await tx.product.update({
            where: { id: existingItem.productId },
            data: { stockQty: { increment: Number(existingItem.quantity) } }
          });
        }
        await tx.orderItem.delete({ where: { id: itemId } });
      } else if (action === 'apply_discount') {
        const percent = Number(body.discountPercent);
        if (isNaN(percent) || percent <= 0 || percent >= 100) {
          throw new Error('Geçerli bir indirim yüzdesi giriniz (1-99 arası).');
        }
        for (const itm of order.items) {
          const currentNet = Number(itm.unitNetExVat);
          const discountedNet = Number((currentNet * (1 - percent / 100)).toFixed(2));
          const vatRate = Number(itm.vatRate || 20);
          const newVatAmt = Number((discountedNet * (vatRate / 100)).toFixed(2));
          const newLineGross = Number(((discountedNet + newVatAmt) * Number(itm.quantity)).toFixed(2));
          await tx.orderItem.update({
            where: { id: itm.id },
            data: {
              unitNetExVat: discountedNet,
              vatAmount: newVatAmt,
              lineGross: newLineGross
            }
          });
        }
      } else {
        throw new Error(`Bilinmeyen işlem: ${action}`);
      }

      // Recalculate whole order totals from scratch
      const allUpdatedItems = await tx.orderItem.findMany({
        where: { orderId: order.id }
      });

      let newSubtotalExVat = 0;
      let newVatTotal = 0;
      let newGrandTotal = 0;

      for (const item of allUpdatedItems) {
        const q = Number(item.quantity);
        const net = Number(item.unitNetExVat);
        const vat = Number(item.vatAmount);
        newSubtotalExVat += q * net;
        newVatTotal += q * vat;
        newGrandTotal += Number(item.lineGross);
      }

      newSubtotalExVat = Number(newSubtotalExVat.toFixed(2));
      newVatTotal = Number(newVatTotal.toFixed(2));
      newGrandTotal = Number(newGrandTotal.toFixed(2));

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          subtotalExVat: newSubtotalExVat,
          vatTotal: newVatTotal,
          grandTotal: newGrandTotal
        },
        include: {
          company: true,
          user: true,
          items: {
            include: {
              product: {
                include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } }
              }
            }
          }
        }
      });

      // Adjust Cari balance if order is CARI payment
      const diff = Number((newGrandTotal - previousGrandTotal).toFixed(2));
      if (diff !== 0 && order.companyId && order.paymentMethod === 'CARI') {
        const currentAccount = await tx.currentAccount.findUnique({
          where: { companyId: order.companyId },
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });

        if (currentAccount) {
          const lastBalance = currentAccount.transactions?.[0] ? Number(currentAccount.transactions[0].balanceAfter) : 0;
          const newBalance = Number((lastBalance + diff).toFixed(2));

          await tx.currentAccountTransaction.create({
            data: {
              accountId: currentAccount.id,
              orderId: order.id,
              type: diff > 0 ? 'ORDER_DEBIT' : 'ORDER_CANCEL_CREDIT',
              amount: Math.abs(diff),
              balanceAfter: newBalance,
              note: `Sipariş #${order.orderNo} Yönetici Revizyonu (${diff > 0 ? '+' : ''}${diff} TL)`
            }
          });
        }
      }

      return updatedOrder;
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    // Audit log
    await logAuditAction({
      actorId: user.id,
      action: 'ORDER_INTERVENTION',
      entityType: 'Order',
      entityId: order.id,
      beforeJson: { grandTotal: previousGrandTotal, itemCount: order.items.length },
      afterJson: { grandTotal: Number(result.grandTotal), itemCount: result.items.length, action }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        orderNumber: result.orderNo,
        companyName: result.company?.legalName || 'Firma',
        userName: result.user?.name || result.user?.username || 'Bayi Yetkilisi',
        status: result.status,
        paymentMethod: result.paymentMethod || 'CARI',
        currency: result.currency,
        subtotalExVat: Number(result.subtotalExVat),
        vatTotal: Number(result.vatTotal),
        grandTotal: Number(result.grandTotal),
        items: result.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          name: i.name,
          sku: i.sku,
          quantity: Number(i.quantity),
          unit: i.unit,
          unitNetExVat: Number(i.unitNetExVat),
          vatRate: Number(i.vatRate || 20),
          vatAmount: Number(i.vatAmount || 0),
          discountAmt: Number(i.discountAmt),
          lineGross: Number(i.lineGross),
          image: i.product?.images?.[0]?.url || '/placeholder.svg',
          stockQty: i.product?.stockQty ? Number(i.product.stockQty) : 0
        }))
      },
      message: 'Sipariş içeriği başarıyla güncellendi.'
    });

  } catch (error: unknown) {
    console.error('POST /api/admin/orders/[id]/items error:', error);
    const message = error instanceof Error ? error.message : 'Sipariş güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
