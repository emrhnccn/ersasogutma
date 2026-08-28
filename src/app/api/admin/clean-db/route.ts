import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Delete in relational order
    await prisma.productImage.deleteMany({});
    await prisma.productDocument.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.brand.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Veritabanındaki tüm ürünler, kategoriler, markalar ve görseller başarıyla temizlendi.'
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
