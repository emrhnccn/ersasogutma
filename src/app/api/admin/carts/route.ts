import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { calculateServerPrice } from '@/lib/pricingEngine';
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

        const items = await Promise.all(
          cart.items.map(async (item) => {
            const basePrice = Number(item.product.salePrice || 0);
            const qty = Number(item.quantity);
            const stockQty = Number(item.product.stockQty || 0);
            const isOverStock = qty > stockQty;

            if (isOverStock) hasOverStock = true;

            const priceInfo = await calculateServerPrice({
              productId: item.productId,
              basePriceTRY: basePrice,
              quantity: qty,
              companyId
            });

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
          })
        );

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
