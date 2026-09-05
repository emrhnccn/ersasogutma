import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function normalizeBrandName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('tr-TR');
}

// GET /api/brands — Get active brands with product counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minCount = parseInt(searchParams.get('minCount') || '0', 10);

    // Fetch brands from Brand model
    const dbBrands = await prisma.brand.findMany({
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Also check distinct brands from products if any exist without explicit Brand table entry
    const formattedBrands = dbBrands
      .map(b => ({
        id: b.id,
        name: b.name.trim(),
        slug: b.slug,
        productCount: b._count.products,
        normalized: normalizeBrandName(b.name)
      }))
      .filter(b => b.productCount >= minCount);

    // Sort by name alphabetically (Turkish locale)
    formattedBrands.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

    return NextResponse.json({
      success: true,
      data: formattedBrands,
      totalCount: formattedBrands.length
    });
  } catch (error: unknown) {
    console.error('GET /api/brands error:', error);
    return NextResponse.json(
      { success: false, error: 'Markalar listelenirken hata oluştu.' },
      { status: 500 }
    );
  }
}
