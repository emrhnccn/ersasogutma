import { prisma } from '@/lib/prisma';

export type DiscountSource = 
  | 'DEALER_PRODUCT'   // 1. Bayiye Özel Ürün Fiyatı
  | 'DEALER_SPECIAL'   // 2. Bayiye Özel Genel İskonto
  | 'TIER'             // 3. Bayi Kademe İskontosu
  | 'CATEGORY'         // 4. Kategori İskontosu
  | 'STANDARD';        // 5. Standart Liste Fiyatı

export interface PriceCalculationResult {
  basePriceTRY: number;
  finalPriceTRY: number;
  appliedDiscountPercent: number;
  discountAmountTRY: number;
  discountSource: DiscountSource;
  priceSourceLabel: string;
  ruleAppliedName?: string;
  ruleType?: string;
}

/**
 * Server-side Unified Price Calculator following strict 5-tier business rules:
 * 1. Bayiye özel ürün fiyatı / kuralı (PriceRule: CUSTOMER_PRODUCT)
 * 2. Bayiye özel genel iskonto (Company: customDiscountPercent)
 * 3. Bayi kademe iskontosu (PriceRule: GROUP_PERCENT or CustomerGroup tier)
 * 4. Kategori iskontosu (Category: discountPercent or PriceRule: GROUP_CATEGORY)
 * 5. Standart liste satış fiyatı (Product: salePrice)
 */
export async function calculateServerPrice(params: {
  productId: string;
  basePriceTRY: number;
  quantity: number;
  companyId?: string | null;
}): Promise<PriceCalculationResult> {
  const { productId, basePriceTRY, quantity, companyId } = params;

  if (!basePriceTRY || basePriceTRY <= 0) {
    return {
      basePriceTRY: 0,
      finalPriceTRY: 0,
      appliedDiscountPercent: 0,
      discountAmountTRY: 0,
      discountSource: 'STANDARD',
      priceSourceLabel: 'Fiyat Bekleniyor'
    };
  }

  // 1. Fetch Company & Product with relations
  let company = null;
  if (companyId) {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { customerGroup: true }
    });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      categoryId: true,
      brandId: true,
      discountPercent: true,
      category: {
        select: { id: true, name: true, discountPercent: true }
      }
    }
  });

  // 2. Fetch active PriceRules ordered by priority (1 is highest priority)
  const rules = await prisma.priceRule.findMany({
    where: {
      active: true,
      OR: [
        { companyId: companyId || undefined },
        { customerGroupId: company?.customerGroupId || undefined },
        { productId },
        { brandId: product?.brandId || undefined },
        { categoryId: product?.categoryId || undefined },
      ]
    },
    orderBy: { priority: 'asc' }
  });

  const now = new Date();

  // Tier 1: Bayiye özel ürün fiyatı / kuralı (CUSTOMER_PRODUCT)
  for (const rule of rules) {
    if (rule.type !== 'CUSTOMER_PRODUCT' || rule.companyId !== companyId || rule.productId !== productId) continue;
    if (rule.minQty && quantity < rule.minQty) continue;
    if (rule.validFrom && now < rule.validFrom) continue;
    if (rule.validTo && now > rule.validTo) continue;

    if (rule.specialPrice) {
      const special = Number(rule.specialPrice);
      const discountAmt = Math.max(0, basePriceTRY - special);
      const discPct = Number(((discountAmt / basePriceTRY) * 100).toFixed(2));
      return {
        basePriceTRY,
        finalPriceTRY: special,
        appliedDiscountPercent: discPct,
        discountAmountTRY: Number(discountAmt.toFixed(2)),
        discountSource: 'DEALER_PRODUCT',
        priceSourceLabel: `Bayiye Özel Fiyat (${rule.name || 'Özel Fiyat'})`,
        ruleAppliedName: rule.name,
        ruleType: rule.type
      };
    }
    if (rule.discountPercent) {
      const discPct = Number(rule.discountPercent);
      const discountAmt = Number(((basePriceTRY * discPct) / 100).toFixed(2));
      const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
      return {
        basePriceTRY,
        finalPriceTRY: finalPrice,
        appliedDiscountPercent: discPct,
        discountAmountTRY: discountAmt,
        discountSource: 'DEALER_PRODUCT',
        priceSourceLabel: `Bayiye Özel Ürün İskontosu (%${discPct})`,
        ruleAppliedName: rule.name,
        ruleType: rule.type
      };
    }
  }

  // Tier 2: Bayiye özel genel iskonto (Company.customDiscountPercent)
  const customDiscount = company?.customDiscountPercent ? Number(company.customDiscountPercent) : 0;
  if (customDiscount > 0) {
    const discountAmt = Number(((basePriceTRY * customDiscount) / 100).toFixed(2));
    const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
    return {
      basePriceTRY,
      finalPriceTRY: finalPrice,
      appliedDiscountPercent: customDiscount,
      discountAmountTRY: discountAmt,
      discountSource: 'DEALER_SPECIAL',
      priceSourceLabel: `Bayi Özel İskontosu (%${customDiscount})`
    };
  }

  // Tier 3: Bayi kademe iskontosu (PriceRule: GROUP_PERCENT or tier rules)
  for (const rule of rules) {
    if (
      (rule.type === 'GROUP_PERCENT' || rule.type === 'GROUP_PRODUCT' || rule.type === 'GROUP_BRAND') &&
      rule.customerGroupId === company?.customerGroupId
    ) {
      if (rule.minQty && quantity < rule.minQty) continue;
      if (rule.validFrom && now < rule.validFrom) continue;
      if (rule.validTo && now > rule.validTo) continue;

      if (rule.discountPercent && Number(rule.discountPercent) > 0) {
        const discPct = Number(rule.discountPercent);
        const discountAmt = Number(((basePriceTRY * discPct) / 100).toFixed(2));
        const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
        return {
          basePriceTRY,
          finalPriceTRY: finalPrice,
          appliedDiscountPercent: discPct,
          discountAmountTRY: discountAmt,
          discountSource: 'TIER',
          priceSourceLabel: `${company?.customerGroup?.name || 'Kademe'} İskontosu (%${discPct})`,
          ruleAppliedName: rule.name,
          ruleType: rule.type
        };
      }
    }
  }

  // Tier 4: Kategori iskontosu (Category.discountPercent or PriceRule: GROUP_CATEGORY / CATEGORY)
  const categoryDiscount = product?.category?.discountPercent ? Number(product.category.discountPercent) : 0;
  if (categoryDiscount > 0) {
    const discountAmt = Number(((basePriceTRY * categoryDiscount) / 100).toFixed(2));
    const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
    return {
      basePriceTRY,
      finalPriceTRY: finalPrice,
      appliedDiscountPercent: categoryDiscount,
      discountAmountTRY: discountAmt,
      discountSource: 'CATEGORY',
      priceSourceLabel: `Kategori İskontosu (%${categoryDiscount})`
    };
  }

  // Also check product's own direct discount if present
  const productDiscount = product?.discountPercent ? Number(product.discountPercent) : 0;
  if (productDiscount > 0) {
    const discountAmt = Number(((basePriceTRY * productDiscount) / 100).toFixed(2));
    const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
    return {
      basePriceTRY,
      finalPriceTRY: finalPrice,
      appliedDiscountPercent: productDiscount,
      discountAmountTRY: discountAmt,
      discountSource: 'STANDARD',
      priceSourceLabel: `Kampanya İndirimi (%${productDiscount})`
    };
  }

  // Tier 5: Standart liste satış fiyatı
  return {
    basePriceTRY,
    finalPriceTRY: basePriceTRY,
    appliedDiscountPercent: 0,
    discountAmountTRY: 0,
    discountSource: 'STANDARD',
    priceSourceLabel: 'Standart Satış Fiyatı'
  };
}

/**
 * Client-side sync Price Calculator
 */
export function calculateClientPrice(
  basePriceTRY: number,
  discountPercent: number = 0,
  quantity: number = 1
): PriceCalculationResult {
  if (!basePriceTRY || basePriceTRY <= 0) {
    return {
      basePriceTRY: 0,
      finalPriceTRY: 0,
      appliedDiscountPercent: 0,
      discountAmountTRY: 0,
      discountSource: 'STANDARD',
      priceSourceLabel: 'Fiyat Bekleniyor'
    };
  }

  const safeDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmt = Number(((basePriceTRY * safeDiscount) / 100).toFixed(2));
  const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));

  return {
    basePriceTRY,
    finalPriceTRY: finalPrice,
    appliedDiscountPercent: safeDiscount,
    discountAmountTRY: discountAmt,
    discountSource: safeDiscount > 0 ? 'DEALER_SPECIAL' : 'STANDARD',
    priceSourceLabel: safeDiscount > 0 ? `Bayi İskontosu (%${safeDiscount})` : 'Standart Satış Fiyatı'
  };
}
