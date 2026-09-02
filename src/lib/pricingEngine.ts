import { prisma } from '@/lib/prisma';

export interface PriceCalculationResult {
  basePriceTRY: number;
  finalPriceTRY: number;
  appliedDiscountPercent: number;
  discountAmountTRY: number;
  ruleAppliedName?: string;
  ruleType?: string;
}

/**
 * Server-side Price Calculator using Prisma Database Custom Discount & PriceRules
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
      discountAmountTRY: 0
    };
  }

  // 1. Fetch Company & Product
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

  // 2. Custom Dealer Discount from Company record
  const customDiscount = company?.customDiscountPercent ? Number(company.customDiscountPercent) : 0;

  // 3. Fetch active PriceRules ordered by priority (1 is highest priority)
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

  for (const rule of rules) {
    if (rule.minQty && quantity < rule.minQty) continue;
    const now = new Date();
    if (rule.validFrom && now < rule.validFrom) continue;
    if (rule.validTo && now > rule.validTo) continue;

    let isMatch = false;
    if (rule.type === 'CUSTOMER_PRODUCT' && rule.companyId === companyId && rule.productId === productId) isMatch = true;
    else if (rule.type === 'GROUP_PRODUCT' && rule.customerGroupId === company?.customerGroupId && rule.productId === productId) isMatch = true;
    else if (rule.type === 'GROUP_BRAND' && rule.customerGroupId === company?.customerGroupId && rule.brandId === product?.brandId) isMatch = true;
    else if (rule.type === 'GROUP_CATEGORY' && rule.customerGroupId === company?.customerGroupId && rule.categoryId === product?.categoryId) isMatch = true;
    else if (rule.type === 'QTY_TIER' && rule.minQty && quantity >= rule.minQty) isMatch = true;
    else if (rule.type === 'GROUP_PERCENT' && rule.customerGroupId === company?.customerGroupId) isMatch = true;

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
          ruleAppliedName: rule.name,
          ruleType: rule.type
        };
      }
    }
  }

  // 4. Fallback: Apply Dealer's Custom Discount percentage from Database
  const discountAmt = Number(((basePriceTRY * customDiscount) / 100).toFixed(2));
  const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));

  return {
    basePriceTRY,
    finalPriceTRY: finalPrice,
    appliedDiscountPercent: customDiscount,
    discountAmountTRY: discountAmt,
    ruleAppliedName: customDiscount > 0 ? 'Bayi Özel İskonto' : undefined
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
  const safeDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmt = Number(((basePriceTRY * safeDiscount) / 100).toFixed(2));
  const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));

  return {
    basePriceTRY,
    finalPriceTRY: finalPrice,
    appliedDiscountPercent: safeDiscount,
    discountAmountTRY: discountAmt
  };
}
