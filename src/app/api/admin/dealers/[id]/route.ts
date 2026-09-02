import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// GET /api/admin/dealers/[id] — Full dealer profile, finance, orders, cart, and price rules
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
        customerGroup: {
          include: {
            priceRules: true
          }
        },
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
        },
        addresses: true,
        currentAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Bayi bulunamadı.' }, { status: 404 });
    }

    const primaryMember = company.members[0];
    const primaryUser = primaryMember?.user;
    const activeCart = primaryUser?.carts[0] || null;

    // Financial calculations
    const transactions = company.currentAccount?.transactions || [];
    const latestTx = transactions[0];
    const currentBalance = latestTx ? Number(latestTx.balanceAfter) : 0;
    const creditLimit = Number(company.currentAccount?.creditLimit || 0);
    const availableCredit = Math.max(0, creditLimit - (currentBalance > 0 ? currentBalance : 0));

    const totalDebt = transactions
      .filter((t) => t.type.includes('DEBIT') || t.type === 'ORDER_DEBIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCredit = transactions
      .filter((t) => t.type.includes('CREDIT') || t.type === 'PAYMENT_CREDIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        id: company.id,
        legalName: company.legalName,
        taxNo: company.taxNo || '',
        taxOffice: company.taxOffice || '',
        phone: company.phone || primaryUser?.phone || '',
        email: company.email || primaryUser?.email || '',
        status: company.status,
        registeredAt: company.createdAt,
        user: primaryUser ? {
          id: primaryUser.id,
          username: primaryUser.username,
          name: primaryUser.name,
          email: primaryUser.email,
          phone: primaryUser.phone,
          status: primaryUser.status
        } : null,
        tier: company.customerGroup?.name || 'Standart',
        customerGroupId: company.customerGroupId,
        priceRules: company.customerGroup?.priceRules || [],
        finance: {
          accountId: company.currentAccount?.id,
          creditLimit,
          currentBalance,
          availableCredit,
          totalDebt,
          totalCredit,
          transactions: transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            balanceAfter: Number(t.balanceAfter),
            note: t.note || '',
            orderId: t.orderId,
            paymentId: t.paymentId,
            createdAt: t.createdAt
          }))
        },
        orders: company.orders.map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          grandTotal: Number(o.grandTotal),
          subtotalExVat: Number(o.subtotalExVat),
          vatTotal: Number(o.vatTotal),
          status: o.status,
          paymentMethod: o.paymentMethod,
          notes: o.notes,
          itemCount: o.items.length,
          items: o.items.map((i) => ({
            id: i.id,
            name: i.name,
            sku: i.sku,
            quantity: Number(i.quantity),
            unit: i.unit,
            unitNetExVat: Number(i.unitNetExVat),
            vatRate: Number(i.vatRate),
            lineGross: Number(i.lineGross)
          })),
          createdAt: o.createdAt
        })),
        cart: activeCart ? {
          id: activeCart.id,
          items: activeCart.items.map((ci) => ({
            id: ci.id,
            productId: ci.productId,
            name: ci.product.name,
            sku: ci.product.sku,
            quantity: Number(ci.quantity),
            salePrice: Number(ci.product.salePrice || 0),
            vatRate: Number(ci.product.vatRate || 20),
            image: ci.product.images?.[0]?.url || ''
          }))
        } : null,
        addresses: company.addresses
      }
    });
  } catch (error: unknown) {
    console.error('GET /api/admin/dealers/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Bayi detayları yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/admin/dealers/[id] — Update dealer info, status, tier, credit limit
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

    const {
      legalName,
      taxNo,
      taxOffice,
      phone,
      email,
      status,
      tier,
      creditLimit
    } = body;

    const company = await prisma.company.findUnique({
      where: { id },
      include: { currentAccount: true }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Bayi bulunamadı.' }, { status: 404 });
    }

    let customerGroupId = company.customerGroupId;
    if (tier) {
      let group = await prisma.customerGroup.findFirst({
        where: { name: tier }
      });
      if (!group) {
        group = await prisma.customerGroup.create({
          data: {
            name: tier,
            code: tier.toUpperCase(),
            description: `${tier} Fiyat Grubu`
          }
        });
      }
      customerGroupId = group.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.company.update({
        where: { id },
        data: {
          legalName: legalName !== undefined ? legalName : undefined,
          taxNo: taxNo !== undefined ? taxNo : undefined,
          taxOffice: taxOffice !== undefined ? taxOffice : undefined,
          phone: phone !== undefined ? phone : undefined,
          email: email !== undefined ? email : undefined,
          status: status !== undefined ? status : undefined,
          customerGroupId
        }
      });

      if (creditLimit !== undefined && company.currentAccount) {
        await tx.currentAccount.update({
          where: { companyId: id },
          data: { creditLimit: Number(creditLimit) }
        });
      }

      return comp;
    });

    await logAuditAction({
      actorId: user.id,
      action: 'DEALER_PROFILE_UPDATED',
      entityType: 'Company',
      entityId: id,
      afterJson: { legalName, status, tier, creditLimit }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Bayi bilgileri başarıyla güncellendi.'
    });
  } catch (error: unknown) {
    console.error('PUT /api/admin/dealers/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Bayi güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
