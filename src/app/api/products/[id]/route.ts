import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] — Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        documents: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('GET /api/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Ürün yüklenirken hata oluştu.' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — Update product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name, sku, barcode, description, specsJson,
      status, unit, vatRate, currency,
      costPrice, salePrice, discountPercent, stockQty, minOrderQty,
      brandId, categoryId, images, imageUrl
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) {
      updateData.sku = sku;
      // Update slug based on SKU
      updateData.slug = `${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id.slice(-4)}`;
    }
    if (barcode !== undefined) updateData.barcode = barcode || null;
    if (description !== undefined) updateData.description = description || null;
    if (specsJson !== undefined) updateData.specsJson = typeof specsJson === 'string' ? specsJson : JSON.stringify(specsJson);
    if (status !== undefined) updateData.status = status;
    if (unit !== undefined) updateData.unit = unit;
    if (vatRate !== undefined) updateData.vatRate = Number(vatRate);
    if (currency !== undefined) updateData.currency = currency;
    if (costPrice !== undefined) updateData.costPrice = costPrice !== null && costPrice !== '' ? Number(costPrice) : null;
    if (salePrice !== undefined) updateData.salePrice = salePrice !== null && salePrice !== '' ? Number(salePrice) : null;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent !== null && discountPercent !== '' ? Number(discountPercent) : 0;
    if (stockQty !== undefined) updateData.stockQty = Number(stockQty);
    if (minOrderQty !== undefined) updateData.minOrderQty = Number(minOrderQty);
    if (brandId !== undefined) updateData.brandId = brandId || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;

    // Handle Image updates
    const imageList: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: any) => {
        if (typeof img === 'string' && img.trim()) imageList.push(img.trim());
        else if (img?.url && typeof img.url === 'string') imageList.push(img.url.trim());
      });
    } else if (typeof imageUrl === 'string' && imageUrl.trim()) {
      imageList.push(imageUrl.trim());
    }

    if (imageList.length > 0) {
      // Clear old images and insert new
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: imageList.map((url, idx) => ({
          productId: id,
          url,
          sortOrder: idx
        }))
      });
    } else if (images !== undefined && Array.isArray(images) && images.length === 0) {
      // Admin deliberately cleared images
      await prisma.productImage.deleteMany({ where: { productId: id } });
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } }
      }
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    console.error('PUT /api/products/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Ürün güncellenirken hata oluştu.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — Delete product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { id } = await params;

    // Delete related images and documents first
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productDocument.deleteMany({ where: { productId: id } });

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Ürün başarıyla silindi.' });
  } catch (error: unknown) {
    console.error('DELETE /api/products/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Ürün silinirken hata oluştu.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
