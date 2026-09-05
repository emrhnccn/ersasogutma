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
    const missingPriceOnly = searchParams.get('missingPriceOnly') === 'true';
    const sort = searchParams.get('sort') || 'newest';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));
    const skip = (page - 1) * limit;

    const conditions: any[] = [];

    // Status filter
    if (status !== 'ALL') {
      conditions.push({ status });
    }

    // Missing Price Only filter
    if (missingPriceOnly) {
      conditions.push({
        OR: [
          { salePrice: null },
          { salePrice: { lte: 0 } }
        ]
      });
    }

    // In Stock filter
    if (inStockOnly) {
      conditions.push({ stockQty: { gt: 0 } });
    }

    // Category filter (by ID, Slug, or Name)
    if (category && category !== 'all') {
      conditions.push({
        OR: [
          { categoryId: category },
          { category: { is: { slug: category } } },
          { category: { is: { name: { equals: category, mode: 'insensitive' } } } }
        ]
      });
    }

    // Brand filter (by ID, Slug, or Name)
    if (brand && brand !== 'all') {
      conditions.push({
        OR: [
          { brandId: brand },
          { brand: { is: { slug: brand } } },
          { brand: { is: { name: { equals: brand, mode: 'insensitive' } } } }
        ]
      });
    }

    // Search query across name, sku, barcode
    if (search && search.trim() !== '') {
      const q = search.trim();
      conditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } }
        ]
      });
    }

    const where: any = conditions.length > 0 ? { AND: conditions } : {};

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
          costPrice: true,
          discountPercent: true,
          unit: true,
          stockQty: true,
          minOrderQty: true,
          currency: true,
          vatRate: true,
          status: true,
          description: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, slug: true, discountPercent: true, sortOrder: true }
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
      const isMissingPrice = p.salePrice === null || p.salePrice === undefined || Number(p.salePrice) <= 0;
      const base = isMissingPrice ? 0 : Number(p.salePrice);
      const productDiscount = p.discountPercent ? Number(p.discountPercent) : 0;
      const categoryDiscount = p.category?.discountPercent ? Number(p.category.discountPercent) : 0;

      if (isMissingPrice) {
        return {
          ...p,
          salePrice: 0,
          basePrice: 0,
          discountPercent: 0,
          productDiscount: 0,
          categoryDiscount: 0,
          dealerDiscount: 0,
          discountSource: 'STANDARD',
          discountAmount: 0,
          hasPrice: false,
          isPricePending: true,
          priceLabel: 'Fiyat Bekleniyor'
        };
      }

      // Discount hierarchy: Dealer Discount (Tier 2) > Category Discount (Tier 4) > Product Discount (Tier 5)
      let effectiveDiscount = 0;
      let discountSource = 'STANDARD';
      let priceLabel = 'Standart Fiyat';

      if (dealerDiscount > 0) {
        effectiveDiscount = dealerDiscount;
        discountSource = 'DEALER_SPECIAL';
        priceLabel = `Bayi İskontosu (%${dealerDiscount})`;
      } else if (categoryDiscount > 0) {
        effectiveDiscount = categoryDiscount;
        discountSource = 'CATEGORY';
        priceLabel = `Kategori İskontosu (%${categoryDiscount})`;
      } else if (productDiscount > 0) {
        effectiveDiscount = productDiscount;
        discountSource = 'STANDARD';
        priceLabel = `Ürün İndirimi (%${productDiscount})`;
      }

      const discountAmount = Number(((base * effectiveDiscount) / 100).toFixed(2));
      const effectivePrice = Number((base - discountAmount).toFixed(2));

      return {
        ...p,
        salePrice: effectivePrice,
        basePrice: base,
        discountPercent: effectiveDiscount,
        productDiscount,
        categoryDiscount,
        dealerDiscount,
        discountSource,
        discountAmount,
        hasPrice: true,
        isPricePending: false,
        priceLabel
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
      hasMore,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore
      }
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
      name,
      sku,
      barcode,
      salePrice,
      costPrice,
      discountPercent,
      stockQty,
      categoryId,
      brandId,
      description,
      images,
      imageUrl
    } = body;

    if (!name || !sku) {
      return NextResponse.json({ success: false, error: 'Ürün adı ve stok kodu (SKU) zorunludur.' }, { status: 400 });
    }

    const slug = `${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const imageList: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: any) => {
        if (typeof img === 'string' && img.trim()) imageList.push(img.trim());
      });
    } else if (typeof imageUrl === 'string' && imageUrl.trim()) {
      imageList.push(imageUrl.trim());
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        barcode: barcode || null,
        slug,
        salePrice: salePrice ? parseFloat(salePrice) : 0,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
        stockQty: stockQty ? parseInt(stockQty, 10) : 0,
        categoryId: categoryId || null,
        brandId: brandId || null,
        description: description || null,
        status: 'PUBLISHED',
        images: imageList.length > 0 ? {
          create: imageList.map((url: string, idx: number) => ({
            url,
            sortOrder: idx
          }))
        } : undefined
      },
      include: {
        images: true,
        category: true,
        brand: true
      }
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ success: false, error: 'Ürün eklenirken hata oluştu.' }, { status: 500 });
  }
}
