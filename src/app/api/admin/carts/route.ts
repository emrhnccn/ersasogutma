import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { calculateServerPriceBatch } from '@/lib/pricingEngine';
import { getStockStatus } from '@/lib/stockHelper';

export const dynamic = 'force-dynamic';

// GET /api/admin/carts — List all active dealer carts across the entire platform
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase();

    // Fetch all carts that have at least 1 item
    const carts = await prisma.cart.findMany({
      where: {
        items: {
          some: {}
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            phone: true,
            memberships: {
              include: {
                company: {
                  select: {
                    id: true,
                    legalName: true,
                    taxNo: true,
                    phone: true,
                    customDiscountPercent: true
                  }
                }
              }
            }
          }
        },
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
                category: true,
                brand: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const mappedCarts = await Promise.all(
      carts.map(async (cart) => {
        const primaryCompany = cart.user?.memberships?.[0]?.company;
        const companyId = primaryCompany?.id;
        const discountPercent = Number(primaryCompany?.customDiscountPercent || 0);

        let totalCartAmount = 0;
        let totalItemsQty = 0;
        let hasOverStock = false;

        const batchInputs = cart.items.map((item) => ({
          productId: item.productId,
          basePriceTRY: Number(item.product.salePrice || 0),
          quantity: Number(item.quantity)
        }));
        const priceInfos = await calculateServerPriceBatch(batchInputs, companyId);

        const items = cart.items.map((item, idx) => {
          const basePrice = Number(item.product.salePrice || 0);
          const qty = Number(item.quantity);
          const stockQty = Number(item.product.stockQty || 0);
          const isOverStock = qty > stockQty;

          if (isOverStock) hasOverStock = true;

          const priceInfo = priceInfos[idx] || {
            basePriceTRY: basePrice,
            finalPriceTRY: basePrice,
            appliedDiscountPercent: 0
          };

          const lineTotal = Number((priceInfo.finalPriceTRY * qty).toFixed(2));
          totalCartAmount += lineTotal;
          totalItemsQty += qty;

          const stockInfo = getStockStatus(stockQty, item.product.unit || 'Adet');

          return {
            id: item.id,
            productId: item.productId,
            name: item.product.name,
            sku: item.product.sku,
            image: item.product.images?.[0]?.url || '/placeholder.svg',
            category: item.product.category?.name || 'Genel',
            brand: item.product.brand?.name || 'Ersa',
            unit: item.product.unit || 'Adet',
            quantity: qty,
            stockQty,
            stockStatus: stockInfo.status,
            stockLabel: stockInfo.label,
            isOverStock,
            basePriceTRY: basePrice,
            unitPriceTRY: priceInfo.finalPriceTRY,
            discountPercent: priceInfo.appliedDiscountPercent,
            totalTRY: lineTotal
          };
        });

        return {
          cartId: cart.id,
          updatedAt: cart.updatedAt.toISOString(),
          dealer: {
            userId: cart.user?.id,
            username: cart.user?.username || '—',
            contactName: cart.user?.name || 'Yetkili',
            email: cart.user?.email || '—',
            phone: cart.user?.phone || primaryCompany?.phone || '—',
            companyId: primaryCompany?.id,
            companyName: primaryCompany?.legalName || cart.user?.name || 'Bayi',
            taxNo: primaryCompany?.taxNo || '—',
            customDiscountPercent: discountPercent
          },
          summary: {
            distinctItemCount: items.length,
            totalQuantity: totalItemsQty,
            totalAmountTRY: Number(totalCartAmount.toFixed(2)),
            hasOverStock
          },
          items
        };
      })
    );

    // Apply search filtering
    const filtered = search
      ? mappedCarts.filter(
          (c) =>
            c.dealer.companyName.toLowerCase().includes(search) ||
            c.dealer.username.toLowerCase().includes(search) ||
            c.dealer.phone.includes(search) ||
            c.items.some((i: any) => i.name.toLowerCase().includes(search) || i.sku.toLowerCase().includes(search))
        )
      : mappedCarts;

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error: unknown) {
    console.error('GET /api/admin/carts error:', error);
    const message = error instanceof Error ? error.message : 'Canlı sepetler listelenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/admin/carts — Admin modifies any dealer cart directly
export async function PUT(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { user: adminUser } = guard;

  try {
    const body = await request.json();
    const { cartId, action, itemId, productId, quantity } = body;

    if (!cartId) {
      return NextResponse.json({ success: false, error: 'Sepet ID belirtilmelidir.' }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        user: {
          include: {
            memberships: {
              include: { company: true }
            }
          }
        }
      }
    });

    if (!cart) {
      return NextResponse.json({ success: false, error: 'Sepet bulunamadı.' }, { status: 404 });
    }

    const primaryCompany = cart.user?.memberships?.[0]?.company;

    if (action === 'clear_cart') {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
      await logAuditAction({
        actorId: adminUser.id,
        action: 'ADMIN_CART_CLEARED',
        entityType: 'Cart',
        entityId: cart.id,
        afterJson: { cartId: cart.id, companyId: primaryCompany?.id, companyName: primaryCompany?.legalName }
      });
      return NextResponse.json({ success: true, message: 'Sepet tamamen temizlendi.' });
    }

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
        await prisma.cartItem.delete({ where: { id: itemId } });
      } else {
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
    } else if (action === 'remove_item' && itemId) {
      const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
      if (!cartItem) {
        return NextResponse.json({ success: false, error: 'Silinecek ürün bulunamadı.' }, { status: 404 });
      }
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else if (action === 'add_item' && productId) {
      const parsedQty = Math.max(1, parseInt(String(quantity), 10) || 1);
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ success: false, error: 'Eklenecek ürün bulunamadı.' }, { status: 404 });
      }
      const availableStock = Number(product.stockQty || 0);
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } }
      });
      const currentQty = existing ? Number(existing.quantity) : 0;
      const targetQty = currentQty + parsedQty;

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
          data: { cartId: cart.id, productId, quantity: parsedQty }
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
      actorId: adminUser.id,
      action: 'ADMIN_CART_MODIFIED',
      entityType: 'Cart',
      entityId: cart.id,
      afterJson: { action, itemId, productId, quantity, cartId: cart.id }
    });

    return NextResponse.json({ success: true, message: 'Sepet başarıyla güncellendi.' });
  } catch (error: unknown) {
    console.error('PUT /api/admin/carts error:', error);
    const message = error instanceof Error ? error.message : 'Sepet güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
