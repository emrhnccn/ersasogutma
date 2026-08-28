import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { CleanDbSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Strict Admin Authentication Guard
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const body = await request.json().catch(() => ({}));
    
    // 2. Strict Confirmation Check (Requires explicit confirmation phrase)
    const parsed = CleanDbSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 3. Count entities before deletion for audit record
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const brandCount = await prisma.brand.count();

    // 4. Delete in safe relational order
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

    // 5. Write to AuditLog
    await logAuditAction({
      actorId: user.id,
      action: 'DATABASE_CLEAN_ALL',
      entityType: 'System',
      entityId: 'database',
      beforeJson: { productCount, categoryCount, brandCount },
      afterJson: { cleared: true, timestamp: new Date().toISOString() }
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
