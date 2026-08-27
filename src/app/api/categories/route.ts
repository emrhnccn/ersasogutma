import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories — Fetch all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        children: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Kategoriler yüklenirken hata oluştu.' },
      { status: 500 }
    );
  }
}
