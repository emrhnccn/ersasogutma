import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// GET /api/admin/dealers/[id]/cart — View dealer's live database cart
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

    const items = cart.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      sku: i.product.sku,
      quantity: Number(i.quantity),
      unit: i.product.unit || 'ADET',
      salePrice: Number(i.product.salePrice || 0),
      vatRate: Number(i.product.vatRate || 20),
      image: i.product.images?.[0]?.url || '',
      lineTotal: Number(i.quantity) * Number(i.product.salePrice || 0)
    }));

    const totalTRY = items.reduce((sum, i) => sum + i.lineTotal, 0);

    return NextResponse.json({
      success: true,
      data: {
        cartId: cart.id,
        dealerName: company.legalName,
        userName: primaryUser.name || primaryUser.username,
        items,
        itemCount: items.length,
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
              include: {
                carts: true
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
      return NextResponse.json({ success: false, error: 'Bayiye ait kullanıcı bulunamadı.' }, { status: 400 });
    }

    let cart = primaryUser.carts[0];
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: primaryUser.id }
      });
    }

    if (action === 'update_qty') {
      const numQty = Number(quantity);
      if (numQty <= 0) {
        await prisma.cartItem.delete({
          where: { id: itemId }
        });
      } else {
        await prisma.cartItem.update({
          where: { id: itemId },
          data: { quantity: numQty }
        });
      }
    } else if (action === 'remove_item') {
      await prisma.cartItem.delete({
        where: { id: itemId }
      });
    } else if (action === 'add_item') {
      const numQty = Number(quantity) || 1;
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
          data: { quantity: Number(existing.quantity) + numQty }
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity: numQty
          }
        });
      }
    } else if (action === 'clear_cart') {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    await logAuditAction({
      actorId: user.id,
      action: 'ADMIN_DEALER_CART_UPDATED',
      entityType: 'Cart',
      entityId: cart.id,
      afterJson: { companyId: id, action, itemId, productId, quantity }
    });

    return NextResponse.json({
      success: true,
      message: 'Bayi sepeti başarıyla güncellendi.'
    });
  } catch (error: unknown) {
    console.error('PUT /api/admin/dealers/[id]/cart error:', error);
    const message = error instanceof Error ? error.message : 'Sepet güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
