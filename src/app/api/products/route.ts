import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// GET /api/products — Fetch all active products with brand, category, images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');
    const search = searchParams.get('search');
    const hasExplicitPagination = searchParams.has('page') || searchParams.has('limit');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : (hasExplicitPagination ? 50 : undefined);
    const skip = hasExplicitPagination && limit ? (page - 1) * limit : undefined;

    const where: Record<string, unknown> = {};

    // Filter by status (ACTIVE, PUBLISHED, DRAFT, ALL)
    if (status !== 'ALL') {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          documents: true
        },
        orderBy: { createdAt: 'desc' },
        ...(limit ? { take: limit } : {}),
        ...(skip !== undefined ? { skip } : {})
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      totalCount,
      page: hasExplicitPagination ? page : 1,
      totalPages: limit ? Math.ceil(totalCount / limit) : 1
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Ürünler yüklenirken hata oluştu.' },
      { status: 500 }
    );
  }
}

// POST /api/products — Create a new product (Admin only)
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  try {
    const body = await request.json();

    const {
      name, sku, barcode, description, specsJson,
      status = 'ACTIVE', unit = 'ADET', vatRate = 20,
      currency = 'TRY', costPrice, salePrice,
      stockQty = 0, minOrderQty = 1,
      brandId, categoryId, imageUrl
    } = body;

    if (!name || !sku) {
      return NextResponse.json(
        { success: false, error: 'Ürün adı ve SKU zorunludur.' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        barcode: barcode || null,
        description: description || null,
        specsJson: specsJson ? JSON.stringify(specsJson) : null,
        status,
        unit,
        vatRate: vatRate ? Number(vatRate) : 20,
        currency,
        costPrice: costPrice ? Number(costPrice) : null,
        salePrice: salePrice ? Number(salePrice) : null,
        stockQty: stockQty ? Number(stockQty) : 0,
        minOrderQty: minOrderQty ? Number(minOrderQty) : 1,
        brandId: brandId || null,
        categoryId: categoryId || null,
        images: imageUrl ? {
          create: {
            url: imageUrl,
            alt: name,
            sortOrder: 0
          }
        } : undefined
      },
      include: {
        brand: true,
        category: true,
        images: true
      }
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/products error:', error);
    const message = error instanceof Error ? error.message : 'Ürün eklenirken hata oluştu.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
