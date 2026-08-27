import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

// PUT /api/products/[id] — Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name, sku, barcode, description, specsJson,
      status, unit, vatRate, currency,
      costPrice, salePrice, stockQty, minOrderQty,
      brandId, categoryId
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (barcode !== undefined) updateData.barcode = barcode || null;
    if (description !== undefined) updateData.description = description || null;
    if (specsJson !== undefined) updateData.specsJson = typeof specsJson === 'string' ? specsJson : JSON.stringify(specsJson);
    if (status !== undefined) updateData.status = status;
    if (unit !== undefined) updateData.unit = unit;
    if (vatRate !== undefined) updateData.vatRate = Number(vatRate);
    if (currency !== undefined) updateData.currency = currency;
    if (costPrice !== undefined) updateData.costPrice = costPrice ? Number(costPrice) : null;
    if (salePrice !== undefined) updateData.salePrice = salePrice ? Number(salePrice) : null;
    if (stockQty !== undefined) updateData.stockQty = Number(stockQty);
    if (minOrderQty !== undefined) updateData.minOrderQty = Number(minOrderQty);
    if (brandId !== undefined) updateData.brandId = brandId || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        category: true,
        images: true
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

// DELETE /api/products/[id] — Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
