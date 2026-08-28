import { prisma } from '@/lib/prisma';

export interface PriceCalculationResult {
  basePriceTRY: number;
  finalPriceTRY: number;
  appliedDiscountPercent: number;
  discountAmountTRY: number;
  ruleAppliedName?: string;
  ruleType?: string;
  tierName: string;
  tierDiscountPercent: number;
}

export interface PricingContext {
  companyId?: string;
  customerGroupId?: string;
  tier?: string; // 'Standart' | 'Silver' | 'Gold' | 'Platinum' | 'VIP'
}

/**
 * Standard Tier Discount Map
 */
export const TIER_DISCOUNT_MAP: Record<string, number> = {
  Standart: 20,
  Silver: 30,
  Gold: 40,
  Platinum: 50,
  VIP: 60,
};

/**
 * Server-side Price Calculator using Prisma Database PriceRules
 */
export async function calculateServerPrice(params: {
  productId: string;
  basePriceTRY: number;
  quantity: number;
  companyId?: string;
}): Promise<PriceCalculationResult> {
  const { productId, basePriceTRY, quantity, companyId } = params;

  if (!basePriceTRY || basePriceTRY <= 0) {
    return {
      basePriceTRY: 0,
      finalPriceTRY: 0,
      appliedDiscountPercent: 0,
      discountAmountTRY: 0,
      tierName: 'Standart',
      tierDiscountPercent: 20
    };
  }

  // 1. Fetch Company, CustomerGroup, Product Category & Brand
  let company = null;
  if (companyId) {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { customerGroup: true }
    });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, categoryId: true, brandId: true }
  });

  const tier = company?.customerGroup?.name || 'Gold';
  const tierDiscount = TIER_DISCOUNT_MAP[tier] ?? 20;

  // 2. Fetch all matching active PriceRules ordered by priority (1 is highest priority)
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

  // Evaluate rules in priority order
  for (const rule of rules) {
    // Check quantity constraint
    if (rule.minQty && quantity < rule.minQty) {
      continue;
    }

    // Check validity date
    const now = new Date();
    if (rule.validFrom && now < rule.validFrom) continue;
    if (rule.validTo && now > rule.validTo) continue;

    // Rule match checking
    let isMatch = false;

    if (rule.type === 'CUSTOMER_PRODUCT' && rule.companyId === companyId && rule.productId === productId) {
      isMatch = true;
    } else if (rule.type === 'GROUP_PRODUCT' && rule.customerGroupId === company?.customerGroupId && rule.productId === productId) {
      isMatch = true;
    } else if (rule.type === 'GROUP_BRAND' && rule.customerGroupId === company?.customerGroupId && rule.brandId === product?.brandId) {
      isMatch = true;
    } else if (rule.type === 'GROUP_CATEGORY' && rule.customerGroupId === company?.customerGroupId && rule.categoryId === product?.categoryId) {
      isMatch = true;
    } else if (rule.type === 'QTY_TIER' && rule.minQty && quantity >= rule.minQty) {
      isMatch = true;
    } else if (rule.type === 'GROUP_PERCENT' && rule.customerGroupId === company?.customerGroupId) {
      isMatch = true;
    }

    if (isMatch) {
      if (rule.specialPrice) {
        const special = Number(rule.specialPrice);
        const discountAmt = Math.max(0, basePriceTRY - special);
        const discPct = Number(((discountAmt / basePriceTRY) * 100).toFixed(2));
        return {
          basePriceTRY,
          finalPriceTRY: special,
          appliedDiscountPercent: discPct,
          discountAmountTRY: discountAmt,
          ruleAppliedName: rule.name,
          ruleType: rule.type,
          tierName: tier,
          tierDiscountPercent: tierDiscount
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
          ruleAppliedName: rule.name,
          ruleType: rule.type,
          tierName: tier,
          tierDiscountPercent: tierDiscount
        };
      }
    }
  }

  // 3. Fallback to standard Company Tier Discount
  const discountAmt = Number(((basePriceTRY * tierDiscount) / 100).toFixed(2));
  const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));

  return {
    basePriceTRY,
    finalPriceTRY: finalPrice,
    appliedDiscountPercent: tierDiscount,
    discountAmountTRY: discountAmt,
    tierName: tier,
    tierDiscountPercent: tierDiscount
  };
}

/**
 * Client-side sync Price Calculator (Fast UI computation)
 */
export function calculateClientPrice(
  basePriceTRY: number,
  tier: string = 'Gold',
  quantity: number = 1
): PriceCalculationResult {
  const tierDiscount = TIER_DISCOUNT_MAP[tier] ?? 40;
  
  // Apply additional bulk quantity discount if qty >= 10 (+5%) or qty >= 50 (+10%)
  let extraQtyDiscount = 0;
  if (quantity >= 50) extraQtyDiscount = 10;
  else if (quantity >= 10) extraQtyDiscount = 5;

  const totalDiscount = Math.min(80, tierDiscount + extraQtyDiscount);
  const discountAmt = Number(((basePriceTRY * totalDiscount) / 100).toFixed(2));
  const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));

  return {
    basePriceTRY,
    finalPriceTRY: finalPrice,
    appliedDiscountPercent: totalDiscount,
    discountAmountTRY: discountAmt,
    tierName: tier,
    tierDiscountPercent: tierDiscount,
    ruleAppliedName: extraQtyDiscount > 0 ? `Toplu Alım İndirimi (+%${extraQtyDiscount})` : undefined
  };
}
