import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { calculateServerPrice, calculateServerPriceBatch } from '@/lib/pricingEngine';
import { getStockStatus } from '@/lib/stockHelper';

export const dynamic = 'force-dynamic';

// GET /api/admin/dealers/[id]/cart — View dealer's live database cart with detailed prices, VAT, discounts & stock
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { id } = await params;

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
                        product: {
                          include: {
                            images: true,
                            category: true,
                            brand: true
                          }
                        }
                      }
                    }
                  }
                }
              }
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
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          itemCount: 0,
          totalQuantity: 0,
          subtotalExVat: 0,
          totalDiscount: 0,
          vatTotal: 0,
          grandTotal: 0
        }
      });
    }

    let cart = primaryUser.carts[0];
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: primaryUser.id },
        include: { items: { include: { product: { include: { images: true, category: true, brand: true } } } } }
      });
    }

    const batchInputs = cart.items.map((i) => ({
      productId: i.productId,
      basePriceTRY: Number(i.product.salePrice || 0),
      quantity: Number(i.quantity)
    }));
    const priceInfos = await calculateServerPriceBatch(batchInputs, company.id);

    const computedItems = cart.items.map((i, idx) => {
      const basePrice = Number(i.product.salePrice || 0);
      const qty = Number(i.quantity);
      const stockQty = Number(i.product.stockQty || 0);
      const vatRate = Number(i.product.vatRate || 20);
      const priceInfo = priceInfos[idx] || {
        basePriceTRY: basePrice,
        finalPriceTRY: basePrice,
        appliedDiscountPercent: 0
      };

      const unitPriceTRY = priceInfo.finalPriceTRY;
      const lineNet = Number((unitPriceTRY * qty).toFixed(2));
      const vatAmount = Number(((lineNet * vatRate) / 100).toFixed(2));
      const lineGross = Number((lineNet + vatAmount).toFixed(2));
      const unitDiscountAmt = Number(Math.max(0, basePrice - unitPriceTRY).toFixed(2));
      const totalDiscountAmt = Number((unitDiscountAmt * qty).toFixed(2));

      const stockInfo = getStockStatus(stockQty, i.product.unit || 'Adet');

      return {
        id: i.id,
        productId: i.productId,
        name: i.product.name,
        sku: i.product.sku,
        quantity: qty,
        unit: i.product.unit || 'Adet',
        stockQty,
        stockStatus: stockInfo.status,
        stockLabel: stockInfo.label,
        isOverStock: qty > stockQty,
        basePriceTRY: basePrice,
        unitPriceTRY: unitPriceTRY,
        discountPercent: priceInfo.appliedDiscountPercent,
        unitDiscountAmt: unitDiscountAmt,
        totalDiscountAmt: totalDiscountAmt,
        vatRate: vatRate,
        vatAmount: vatAmount,
        lineNet: lineNet,
        lineGross: lineGross,
        image: i.product.images?.[0]?.url || '/placeholder.svg'
      };
    });

    const subtotalExVat = Number(computedItems.reduce((sum, i) => sum + i.lineNet, 0).toFixed(2));
    const totalDiscount = Number(computedItems.reduce((sum, i) => sum + i.totalDiscountAmt, 0).toFixed(2));
    const vatTotal = Number(computedItems.reduce((sum, i) => sum + i.vatAmount, 0).toFixed(2));
    const grandTotal = Number((subtotalExVat + vatTotal).toFixed(2));

    return NextResponse.json({
      success: true,
      data: {
        cartId: cart.id,
        dealerName: company.legalName,
        userName: primaryUser.name || primaryUser.username,
        customDiscountPercent: Number(company.customDiscountPercent || 0),
        items: computedItems,
        itemCount: computedItems.length,
        totalQuantity: computedItems.reduce((sum, i) => sum + i.quantity, 0),
        subtotalExVat,
        totalDiscount,
        vatTotal,
        grandTotal
      }
    });
  } catch (error: unknown) {
    console.error('GET /api/admin/dealers/[id]/cart error:', error);
    const message = error instanceof Error ? error.message : 'Sepet bilgisi yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/admin/dealers/[id]/cart — Edit dealer's live database cart with stock checks & pricing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, itemId, productId, quantity } = body;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              include: { carts: true }
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
      return NextResponse.json({ success: false, error: 'Bayiye ait kullanıcı bulunamadı.' }, { status: 404 });
    }

    let cart = primaryUser.carts[0];
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: primaryUser.id }
      });
    }

    // ACTION: Clear entire cart
    if (action === 'clear_cart') {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      await prisma.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      });

      await logAuditAction({
        actorId: user.id,
        action: 'ADMIN_CART_CLEARED',
        entityType: 'Cart',
        entityId: cart.id,
        afterJson: { companyId: id, companyName: company.legalName }
      });

      return NextResponse.json({
        success: true,
        message: 'Bayinin sepeti başarıyla tamamen temizlendi.'
      });
    }

    // ACTION: Set entire cart with specified items
    if (action === 'set_cart') {
      const incoming = Array.isArray(body.items) ? body.items : [];
      await prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        for (const it of incoming) {
          const pId = it.productId;
          const qty = Math.max(1, parseInt(String(it.quantity), 10) || 1);
          if (pId) {
            await tx.cartItem.create({
              data: {
                cartId: cart.id,
                productId: pId,
                quantity: qty
              }
            });
          }
        }
        await tx.cart.update({
          where: { id: cart.id },
          data: { updatedAt: new Date() }
        });
      }, {
        maxWait: 15000,
        timeout: 60000
      });

      return NextResponse.json({
        success: true,
        message: 'Bayinin sepeti başarıyla güncellendi.'
      });
    }

    // ACTION: Update quantity
    if (action === 'update_qty' && itemId) {
      const parsedQty = parseInt(String(quantity), 10);

      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { product: true }
      });

      if (!cartItem) {
        return NextResponse.json({ success: false, error: 'Sepet kalemi bulunamadı.' }, { status: 404 });
      }

      if (parsedQty <= 0) {
        await prisma.cartItem.delete({
          where: { id: itemId }
        });
      } else {
        // Stock Validation
        const availableStock = Number(cartItem.product.stockQty || 0);
        if (parsedQty > availableStock) {
          return NextResponse.json({
            success: false,
            error: `Yetersiz stok! "${cartItem.product.name}" için mevcut stok: ${availableStock} ${cartItem.product.unit || 'Adet'}. Talep edilen: ${parsedQty}`
          }, { status: 400 });
        }

        await prisma.cartItem.update({
          where: { id: itemId },
          data: { quantity: parsedQty }
        });
      }
    }

    // ACTION: Remove item
    else if (action === 'remove_item' && itemId) {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { product: true }
      });

      if (!cartItem) {
        return NextResponse.json({ success: false, error: 'Silinecek ürün bulunamadı.' }, { status: 404 });
      }

      await prisma.cartItem.delete({
        where: { id: itemId }
      });
    }

    // ACTION: Add new product to cart
    else if (action === 'add_item' && productId) {
      const parsedQty = Math.max(1, parseInt(String(quantity), 10) || 1);

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return NextResponse.json({ success: false, error: 'Eklenecek ürün bulunamadı.' }, { status: 404 });
      }

      const availableStock = Number(product.stockQty || 0);

      const existing = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        }
      });

      const currentQty = existing ? Number(existing.quantity) : 0;
      const targetQty = currentQty + parsedQty;

      // Stock Validation
      if (targetQty > availableStock) {
        return NextResponse.json({
          success: false,
          error: `Yetersiz stok! "${product.name}" için mevcut stok: ${availableStock} ${product.unit || 'Adet'}.${currentQty > 0 ? ` (Sepette ${currentQty} adet mevcut)` : ''}`
        }, { status: 400 });
      }

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: targetQty }
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity: parsedQty
          }
        });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Geçersiz işlem veya eksik parametre.' }, { status: 400 });
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() }
    });

    await logAuditAction({
      actorId: user.id,
      action: 'ADMIN_CART_MODIFIED',
      entityType: 'Cart',
      entityId: cart.id,
      afterJson: { action, itemId, productId, quantity, companyId: id }
    });

    return NextResponse.json({
      success: true,
      message: 'Sepet başarıyla güncellendi.'
    });
  } catch (error: unknown) {
    console.error('PUT /api/admin/dealers/[id]/cart error:', error);
    const message = error instanceof Error ? error.message : 'Sepet düzenlenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
