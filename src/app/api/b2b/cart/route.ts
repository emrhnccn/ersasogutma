import { NextRequest, NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { CartItemSchema } from '@/lib/validations';
import { calculateServerPrice } from '@/lib/pricingEngine';

export const dynamic = 'force-dynamic';

// GET /api/b2b/cart - Get dealer company's cart items from DB
export async function GET() {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    let cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
                brand: true,
                category: true,
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { sortOrder: 'asc' } },
                  brand: true,
                  category: true,
                }
              }
            }
          }
        }
      });
    }

    // Compute live B2B prices for cart items
    const computedItems = await Promise.all(
      cart.items.map(async (item) => {
        const basePrice = Number(item.product.salePrice || 0);
        const qty = Number(item.quantity);
        const priceInfo = await calculateServerPrice({
          productId: item.productId,
          basePriceTRY: basePrice,
          quantity: qty,
          companyId
        });

        return {
          id: item.id,
          productId: item.productId,
          productCode: item.product.sku,
          productName: item.product.name,
          categoryName: item.product.category?.name || 'Genel',
          brandName: item.product.brand?.name || 'Ersa',
          image: item.product.images?.[0]?.url || '',
          quantity: qty,
          minOrderQty: Number(item.product.minOrderQty || 1),
          unitPriceTRY: priceInfo.finalPriceTRY,
          basePriceTRY: priceInfo.basePriceTRY,
          appliedDiscountRate: priceInfo.appliedDiscountPercent,
          totalTRY: Number((priceInfo.finalPriceTRY * qty).toFixed(2)),
          stockQty: Number(item.product.stockQty || 0),
          inStock: Number(item.product.stockQty || 0) >= qty,
        };
      })
    );

    const subtotalTRY = computedItems.reduce((sum, item) => sum + (item.basePriceTRY * item.quantity), 0);
    const totalTRY = computedItems.reduce((sum, item) => sum + item.totalTRY, 0);
    const discountTRY = subtotalTRY - totalTRY;
    const vatTRY = totalTRY * 0.20;
    const grandTotalTRY = totalTRY + vatTRY;

    return NextResponse.json({
      success: true,
      data: {
        cartId: cart.id,
        items: computedItems,
        summary: {
          itemCount: computedItems.reduce((sum, i) => sum + i.quantity, 0),
          subtotalTRY: Number(subtotalTRY.toFixed(2)),
          discountTRY: Number(discountTRY.toFixed(2)),
          vatTRY: Number(vatTRY.toFixed(2)),
          grandTotalTRY: Number(grandTotalTRY.toFixed(2)),
        }
      }
    });
  } catch (error: unknown) {
    console.error('GET /api/b2b/cart error:', error);
    const message = error instanceof Error ? error.message : 'Sepet yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/b2b/cart - Add or update cart item
export async function POST(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const body = await request.json();
    const parsed = CartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { productId, quantity } = parsed.data;

    // Verify product exists and check stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Ürün bulunamadı.' }, { status: 404 });
    }

    let cart = await prisma.cart.findFirst({
      where: { userId: user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id }
      });
    }

    // Upsert cart item
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      },
      create: {
        cartId: cart.id,
        productId,
        quantity
      },
      update: {
        quantity
      }
    });

    return NextResponse.json({
      success: true,
      message: `${product.name} sepete eklendi.`
    });
  } catch (error: unknown) {
    console.error('POST /api/b2b/cart error:', error);
    const message = error instanceof Error ? error.message : 'Sepete eklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/b2b/cart?productId=xxx
export async function DELETE(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clearAll = searchParams.get('clearAll') === 'true';

    const cart = await prisma.cart.findFirst({
      where: { userId: user.id }
    });

    if (!cart) {
      return NextResponse.json({ success: true, message: 'Sepet zaten boş.' });
    }

    if (clearAll) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      return NextResponse.json({ success: true, message: 'Sepet tamamen temizlendi.' });
    }

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Ürün ID belirtilmedi.' }, { status: 400 });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId
      }
    });

    return NextResponse.json({ success: true, message: 'Ürün sepetten kaldırıldı.' });
  } catch (error: unknown) {
    console.error('DELETE /api/b2b/cart error:', error);
    const message = error instanceof Error ? error.message : 'Sepetten silinirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
