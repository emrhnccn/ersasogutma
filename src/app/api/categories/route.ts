import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/categories — Fetch all categories with product count, ordered by sortOrder
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
        },
        parent: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: unknown) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Kategoriler yüklenirken hata oluştu.' },
      { status: 500 }
    );
  }
}

// POST /api/categories — Create a new category (Admin only)
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { name, parentId, vatRate = 20, sortOrder = 0, discountPercent = 0, seoTitle, seoDescription } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Kategori adı zorunludur.' }, { status: 400 });
    }

    const baseSlug = slugify(name);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
        vatRate: vatRate ? Number(vatRate) : 20,
        sortOrder: Number(sortOrder) || 0,
        discountPercent: discountPercent !== undefined ? Number(discountPercent) : 0,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null
      }
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/categories error:', error);
    const message = error instanceof Error ? error.message : 'Kategori eklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/categories — Update category or reorder (Admin only)
export async function PUT(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();

    // Check if bulk reorder request
    if (body.reorder && Array.isArray(body.reorder)) {
      const updates = body.reorder.map((item: { id: string; sortOrder: number }) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      );
      await prisma.$transaction(updates);
      return NextResponse.json({ success: true, message: 'Kategori sıralaması güncellendi.' });
    }

    // Single category update
    const { id, name, parentId, sortOrder, discountPercent, vatRate } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Kategori ID belirtilmedi.' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = `${slugify(name)}-${id.slice(-4)}`;
    }
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (discountPercent !== undefined) updateData.discountPercent = Number(discountPercent);
    if (vatRate !== undefined) updateData.vatRate = Number(vatRate);

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        _count: { select: { products: true } }
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('PUT /api/categories error:', error);
    const message = error instanceof Error ? error.message : 'Kategori güncellenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/categories?id=xxx (Admin only)
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Kategori ID belirtilmedi.' }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Kategori başarıyla silindi.' });
  } catch (error: unknown) {
    console.error('DELETE /api/categories error:', error);
    const message = error instanceof Error ? error.message : 'Kategori silinirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
