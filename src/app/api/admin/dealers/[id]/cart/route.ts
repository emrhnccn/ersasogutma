import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { calculateServerPrice } from '@/lib/pricingEngine';
import { getStockStatus } from '@/lib/stockHelper';

export const dynamic = 'force-dynamic';

// GET /api/admin/dealers/[id]/cart — View dealer's live database cart with custom dealer prices & stocks
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
      return NextResponse.json({ success: true, data: { items: [], totalTRY: 0 } });
    }

    let cart = primaryUser.carts[0];
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: primaryUser.id },
        include: { items: { include: { product: { include: { images: true, category: true, brand: true } } } } }
      });
    }

    const computedItems = await Promise.all(
      cart.items.map(async (i) => {
        const basePrice = Number(i.product.salePrice || 0);
        const qty = Number(i.quantity);
        const stockQty = Number(i.product.stockQty || 0);
        const priceInfo = await calculateServerPrice({
          productId: i.productId,
          basePriceTRY: basePrice,
          quantity: qty,
          companyId: company.id
        });

        const lineTotal = Number((priceInfo.finalPriceTRY * qty).toFixed(2));
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
          salePrice: priceInfo.finalPriceTRY,
          unitPriceTRY: priceInfo.finalPriceTRY,
          discountPercent: priceInfo.appliedDiscountPercent,
          vatRate: Number(i.product.vatRate || 20),
          image: i.product.images?.[0]?.url || '/placeholder.svg',
          lineTotal
        };
      })
    );

    const totalTRY = computedItems.reduce((sum, i) => sum + i.lineTotal, 0);

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
        totalTRY
      }
    });
  } catch (error: unknown) {
    console.error('GET /api/admin/dealers/[id]/cart error:', error);
    const message = error instanceof Error ? error.message : 'Sepet bilgisi yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/admin/dealers/[id]/cart — Edit dealer's live database cart (update quantity, delete item, add item)
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

    if (action === 'update_qty' && itemId) {
      const parsedQty = parseInt(quantity, 10);
      if (parsedQty <= 0) {
        await prisma.cartItem.delete({
          where: { id: itemId }
        });
      } else {
        await prisma.cartItem.update({
          where: { id: itemId },
          data: { quantity: parsedQty }
        });
      }
    } else if (action === 'remove_item' && itemId) {
      await prisma.cartItem.delete({
        where: { id: itemId }
      });
    } else if (action === 'add_item' && productId) {
      const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
      const existing = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        }
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Number(existing.quantity) + parsedQty }
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
