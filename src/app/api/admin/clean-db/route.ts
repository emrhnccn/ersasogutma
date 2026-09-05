import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Strict Admin Authentication Guard
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  // 2. Admin permission check
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Bu işlem yalnızca yetkili yönetici (ADMIN) tarafından yürütülebilir.' },
      { status: 403 }
    );
  }

  // 3. Strict Production Environment Guard
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DANGEROUS_DB_CLEAN !== 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'Üretim (Production) ortamında veritabanını temizleme işlemi kesin olarak yasaklanmıştır. Veri kaybını önlemek için bu özellik kilitlenmiştir.'
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { confirmPhrase, acknowledgedRisk } = body;

    // 4. Double Confirmation Check
    if (confirmPhrase !== 'ERSA_RESET_CONFIRM_2026') {
      return NextResponse.json(
        { success: false, error: 'Onay ifadesi hatalı. Lütfen "ERSA_RESET_CONFIRM_2026" ifadesini birebir yazınız.' },
        { status: 400 }
      );
    }

    if (!acknowledgedRisk) {
      return NextResponse.json(
        { success: false, error: 'Tüm katalog ve ilişkili verilerin silineceğini kabul ettiğinizi belirten onay kutusunu işaretleyiniz.' },
        { status: 400 }
      );
    }

    // 5. Pre-check: entity counts before deletion for backup & audit verification
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const brandCount = await prisma.brand.count();
    const orderCount = await prisma.order.count();
    const cartCount = await prisma.cart.count();

    // 6. Delete in safe relational order
    await prisma.cartItem.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.quoteItem.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productDocument.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.supplierProduct.deleteMany({});
    await prisma.priceRule.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.brand.deleteMany({});

    // 7. Write to AuditLog with complete snapshot
    await logAuditAction({
      actorId: user.id,
      action: 'DATABASE_CLEAN_ALL',
      entityType: 'System',
      entityId: 'database',
      beforeJson: {
        productCount,
        categoryCount,
        brandCount,
        orderCount,
        cartCount,
        executedBy: user.email || user.username,
        environment: process.env.NODE_ENV
      },
      afterJson: {
        cleared: true,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Veritabanı başarıyla temizlendi. (${productCount} ürün, ${categoryCount} kategori, ${brandCount} marka silindi).`
    });
  } catch (error: unknown) {
    console.error('Clean DB error:', error);
    const message = error instanceof Error ? error.message : 'Veritabanı temizlenirken hata oluştu.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
