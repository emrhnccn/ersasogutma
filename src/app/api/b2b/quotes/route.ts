import { NextRequest, NextResponse } from 'next/server';
import { requireDealer, logAuditAction } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { QuoteCreateSchema } from '@/lib/validations';
import { calculateServerPrice } from '@/lib/pricingEngine';

export const dynamic = 'force-dynamic';

// GET /api/b2b/quotes - Get company quotes
export async function GET() {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const whereClause: any = user.role === 'ADMIN' ? {} : { companyId };
    const quotes = await prisma.quote.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: quotes });
  } catch (error: unknown) {
    console.error('GET /api/b2b/quotes error:', error);
    const message = error instanceof Error ? error.message : 'Teklifler yüklenirken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/b2b/quotes - Create quote from cart
export async function POST(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const body = await request.json();
    const parsed = QuoteCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { validUntil, notes } = parsed.data;

    // Fetch user cart
    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Teklif oluşturmak için sepetinizde ürün bulunmalıdır.' }, { status: 400 });
    }

    const quoteNo = `TEK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    let subtotalTRY = 0;
    let discountTRY = 0;
    const itemsData = [];

    for (const item of cart.items) {
      const basePrice = Number(item.product.salePrice || 0);
      const qty = Number(item.quantity);
      const priceInfo = await calculateServerPrice({
        productId: item.productId,
        basePriceTRY: basePrice,
        quantity: qty,
        companyId
      });

      const lineBase = basePrice * qty;
      const lineFinal = priceInfo.finalPriceTRY * qty;
      subtotalTRY += lineBase;
      discountTRY += (lineBase - lineFinal);

      itemsData.push({
        productId: item.productId,
        productName: item.product.name,
        productCode: item.product.sku,
        quantity: qty,
        unitPriceTRY: priceInfo.finalPriceTRY,
        totalTRY: lineFinal,
        discountRate: priceInfo.appliedDiscountPercent
      });
    }

    const totalBeforeVat = subtotalTRY - discountTRY;
    const vatTRY = totalBeforeVat * 0.20;
    const grandTotalTRY = totalBeforeVat + vatTRY;

    const newQuote = await prisma.quote.create({
      data: {
        quoteNo,
        companyId,
        userId: user.id,
        status: 'PENDING',
        validUntil: new Date(validUntil),
        subtotalTRY,
        discountTRY,
        vatTRY,
        totalTRY: grandTotalTRY,
        notes,
        items: {
          create: itemsData
        }
      },
      include: { items: true }
    });

    return NextResponse.json({
      success: true,
      data: newQuote,
      message: `#${quoteNo} nolu proforma teklif başarıyla hazırlandı.`
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('POST /api/b2b/quotes error:', error);
    const message = error instanceof Error ? error.message : 'Teklif oluşturulurken hata oluştu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
