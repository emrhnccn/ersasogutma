import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// GET /api/products — Fetch products with database-level pagination, filters, and lean projection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const category = searchParams.get('category') || searchParams.get('categoryId');
    const brand = searchParams.get('brand') || searchParams.get('brandId');
    const search = searchParams.get('search') || searchParams.get('q');
    const inStockOnly = searchParams.get('inStockOnly') === 'true' || searchParams.get('stok') === '1';
    const sort = searchParams.get('sort') || 'newest';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Status filter
    if (status !== 'ALL') {
      where.status = status;
    }

    // In Stock filter
    if (inStockOnly) {
      where.stockQty = { gt: 0 };
    }

    // Category filter (by ID, Slug, or Name)
    if (category && category !== 'all') {
      where.OR = where.OR || [];
      where.category = {
        OR: [
          { id: category },
          { slug: category },
          { name: { equals: category, mode: 'insensitive' } }
        ]
      };
    }

    // Brand filter (by ID, Slug, or Name)
    if (brand && brand !== 'all') {
      where.brand = {
        OR: [
          { id: brand },
          { slug: brand },
          { name: { equals: brand, mode: 'insensitive' } }
        ]
      };
    }

    // Search query across name, sku, barcode
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } }
        ]
      });
    }

    // Order By
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { salePrice: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { salePrice: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { name: 'asc' };
    }

    // Optimized lean query
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          barcode: true,
          salePrice: true,
          unit: true,
          stockQty: true,
          minOrderQty: true,
          currency: true,
          vatRate: true,
          description: true,
          category: {
            select: { id: true, name: true, slug: true }
          },
          brand: {
            select: { id: true, name: true, slug: true }
          },
          images: {
            select: { id: true, url: true },
            take: 1,
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy,
        take: limit,
        skip
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: products,
      page,
      limit,
      count: products.length,
      totalCount,
      totalPages,
      hasMore
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
        salePrice: Number(salePrice) || 0,
        stockQty: Number(stockQty) || 0,
        minOrderQty: Number(minOrderQty) || 1,
        brandId: brandId || null,
        categoryId: categoryId || null,
        ...(imageUrl ? {
          images: {
            create: {
              url: imageUrl,
              sortOrder: 0
            }
          }
        } : {})
      },
      include: {
        brand: true,
        category: true,
        images: true
      }
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Ürün başarıyla oluşturuldu.'
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Ürün oluşturulurken hata oluştu.' },
      { status: 500 }
    );
  }
}
