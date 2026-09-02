import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET /api/products — Fetch products with database-level pagination, filters, and dealer pricing
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

    // Get logged-in dealer session if any to apply custom dealer discount
    let dealerDiscount = 0;
    try {
      const session = await auth();
      if (session?.user?.id) {
        const member = await prisma.companyMember.findFirst({
          where: { userId: session.user.id },
          include: { company: true }
        });
        if (member?.company?.customDiscountPercent) {
          dealerDiscount = Number(member.company.customDiscountPercent);
        }
      }
    } catch {
      // ignore
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

    const mappedProducts = products.map((p) => {
      const base = Number(p.salePrice || 0);
      const effectivePrice = dealerDiscount > 0 ? Number((base * (1 - dealerDiscount / 100)).toFixed(2)) : base;
      return {
        ...p,
        salePrice: effectivePrice,
        basePrice: base
      };
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: mappedProducts,
      page,
      limit,
      count: mappedProducts.length,
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
    const { name, sku, salePrice, costPrice, stockQty, categoryId, brandId, description, images } = body;

    if (!name || !sku) {
      return NextResponse.json({ success: false, error: 'Ürün adı ve stok kodu (SKU) zorunludur.' }, { status: 400 });
    }

    const slug = `${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        slug,
        salePrice: salePrice ? parseFloat(salePrice) : 0,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stockQty: stockQty ? parseInt(stockQty, 10) : 0,
        categoryId: categoryId || null,
        brandId: brandId || null,
        description: description || null,
        status: 'PUBLISHED',
        images: images && Array.isArray(images) && images.length > 0 ? {
          create: images.map((url: string, idx: number) => ({
            url,
            sortOrder: idx
          }))
        } : undefined
      }
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ success: false, error: 'Ürün eklenirken hata oluştu.' }, { status: 500 });
  }
}
