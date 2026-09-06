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

export interface PriceBatchItem {
  productId: string;
  basePriceTRY: number;
  quantity: number;
}

/**
 * Server-side Unified Batch Price Calculator following strict 5-tier business rules:
 * 1. Bayiye özel ürün fiyatı / kuralı (PriceRule: CUSTOMER_PRODUCT)
 * 2. Bayiye özel genel iskonto (Company: customDiscountPercent)
 * 3. Bayi kademe iskontosu (PriceRule: GROUP_PERCENT or CustomerGroup tier)
 * 4. Kategori iskontosu (Category: discountPercent or PriceRule: GROUP_CATEGORY)
 * 5. Standart liste satış fiyatı (Product: salePrice)
 *
 * Eliminates N+1 database queries by batch fetching Company, Products, and Rules in 2 parallel/sequential queries.
 */
export async function calculateServerPriceBatch(
  items: PriceBatchItem[],
  companyId?: string | null
): Promise<PriceCalculationResult[]> {
  if (!items || items.length === 0) {
    return [];
  }

  const results: PriceCalculationResult[] = new Array(items.length);
  const itemsToCompute: { index: number; item: PriceBatchItem }[] = [];

  // Default invalid/zero-price items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.basePriceTRY || item.basePriceTRY <= 0) {
      results[i] = {
        basePriceTRY: 0,
        finalPriceTRY: 0,
        appliedDiscountPercent: 0,
        discountAmountTRY: 0,
        discountSource: 'STANDARD',
        priceSourceLabel: 'Fiyat Bekleniyor'
      };
    } else {
      itemsToCompute.push({ index: i, item });
    }
  }

  if (itemsToCompute.length === 0) {
    return results;
  }

  const uniqueProductIds = Array.from(new Set(itemsToCompute.map((entry) => entry.item.productId)));

  // 1. Batch Fetch Company and Products in parallel
  const [company, products] = await Promise.all([
    companyId
      ? prisma.company.findUnique({
          where: { id: companyId },
          include: { customerGroup: true }
        })
      : Promise.resolve(null),
    prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
      select: {
        id: true,
        categoryId: true,
        brandId: true,
        discountPercent: true,
        category: {
          select: { id: true, name: true, discountPercent: true }
        }
      }
    })
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const uniqueBrandIds = Array.from(
    new Set(products.map((p) => p.brandId).filter((id): id is string => Boolean(id)))
  );
  const uniqueCategoryIds = Array.from(
    new Set(products.map((p) => p.categoryId).filter((id): id is string => Boolean(id)))
  );

  // 2. Batch Fetch active PriceRules ordered by priority
  const ruleOrConditions: any[] = [];
  if (companyId) {
    ruleOrConditions.push({ companyId });
  }
  if (company?.customerGroupId) {
    ruleOrConditions.push({ customerGroupId: company.customerGroupId });
  }
  if (uniqueProductIds.length > 0) {
    ruleOrConditions.push({ productId: { in: uniqueProductIds } });
  }
  if (uniqueBrandIds.length > 0) {
    ruleOrConditions.push({ brandId: { in: uniqueBrandIds } });
  }
  if (uniqueCategoryIds.length > 0) {
    ruleOrConditions.push({ categoryId: { in: uniqueCategoryIds } });
  }

  const rules = ruleOrConditions.length > 0
    ? await prisma.priceRule.findMany({
        where: {
          active: true,
          OR: ruleOrConditions
        },
        orderBy: { priority: 'asc' }
      })
    : [];

  const now = new Date();
  const customDiscount = company?.customDiscountPercent ? Number(company.customDiscountPercent) : 0;

  // 3. Compute each item in memory with zero further DB calls
  for (const { index, item } of itemsToCompute) {
    const { productId, basePriceTRY, quantity } = item;
    const product = productMap.get(productId);

    let computed: PriceCalculationResult | null = null;

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
        computed = {
          basePriceTRY,
          finalPriceTRY: special,
          appliedDiscountPercent: discPct,
          discountAmountTRY: Number(discountAmt.toFixed(2)),
          discountSource: 'DEALER_PRODUCT',
          priceSourceLabel: `Bayiye Özel Fiyat (${rule.name || 'Özel Fiyat'})`,
          ruleAppliedName: rule.name,
          ruleType: rule.type
        };
        break;
      }
      if (rule.discountPercent) {
        const discPct = Number(rule.discountPercent);
        const discountAmt = Number(((basePriceTRY * discPct) / 100).toFixed(2));
        const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
        computed = {
          basePriceTRY,
          finalPriceTRY: finalPrice,
          appliedDiscountPercent: discPct,
          discountAmountTRY: discountAmt,
          discountSource: 'DEALER_PRODUCT',
          priceSourceLabel: `Bayiye Özel Ürün İskontosu (%${discPct})`,
          ruleAppliedName: rule.name,
          ruleType: rule.type
        };
        break;
      }
    }

    if (computed) {
      results[index] = computed;
      continue;
    }

    // Tier 2: Bayiye özel genel iskonto (Company.customDiscountPercent)
    if (customDiscount > 0) {
      const discountAmt = Number(((basePriceTRY * customDiscount) / 100).toFixed(2));
      const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
      results[index] = {
        basePriceTRY,
        finalPriceTRY: finalPrice,
        appliedDiscountPercent: customDiscount,
        discountAmountTRY: discountAmt,
        discountSource: 'DEALER_SPECIAL',
        priceSourceLabel: `Bayi Özel İskontosu (%${customDiscount})`
      };
      continue;
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
          computed = {
            basePriceTRY,
            finalPriceTRY: finalPrice,
            appliedDiscountPercent: discPct,
            discountAmountTRY: discountAmt,
            discountSource: 'TIER',
            priceSourceLabel: `${company?.customerGroup?.name || 'Kademe'} İskontosu (%${discPct})`,
            ruleAppliedName: rule.name,
            ruleType: rule.type
          };
          break;
        }
      }
    }

    if (computed) {
      results[index] = computed;
      continue;
    }

    // Tier 4: Kategori iskontosu (Category.discountPercent or direct product.discountPercent)
    const categoryDiscount = product?.category?.discountPercent ? Number(product.category.discountPercent) : 0;
    if (categoryDiscount > 0) {
      const discountAmt = Number(((basePriceTRY * categoryDiscount) / 100).toFixed(2));
      const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
      results[index] = {
        basePriceTRY,
        finalPriceTRY: finalPrice,
        appliedDiscountPercent: categoryDiscount,
        discountAmountTRY: discountAmt,
        discountSource: 'CATEGORY',
        priceSourceLabel: `Kategori İskontosu (%${categoryDiscount})`
      };
      continue;
    }

    // Also check product's own direct discount if present
    const productDiscount = product?.discountPercent ? Number(product.discountPercent) : 0;
    if (productDiscount > 0) {
      const discountAmt = Number(((basePriceTRY * productDiscount) / 100).toFixed(2));
      const finalPrice = Number((basePriceTRY - discountAmt).toFixed(2));
      results[index] = {
        basePriceTRY,
        finalPriceTRY: finalPrice,
        appliedDiscountPercent: productDiscount,
        discountAmountTRY: discountAmt,
        discountSource: 'STANDARD',
        priceSourceLabel: `Kampanya İndirimi (%${productDiscount})`
      };
      continue;
    }

    // Tier 5: Standart liste satış fiyatı
    results[index] = {
      basePriceTRY,
      finalPriceTRY: basePriceTRY,
      appliedDiscountPercent: 0,
      discountAmountTRY: 0,
      discountSource: 'STANDARD',
      priceSourceLabel: 'Standart Satış Fiyatı'
    };
  }

  return results;
}

/**
 * Server-side Unified Single Price Calculator following strict 5-tier business rules.
 * Uses calculateServerPriceBatch under the hood for 100% unified logic and full backward compatibility.
 */
export async function calculateServerPrice(params: {
  productId: string;
  basePriceTRY: number;
  quantity: number;
  companyId?: string | null;
}): Promise<PriceCalculationResult> {
  const [result] = await calculateServerPriceBatch([params], params.companyId);
  return result;
}

/**
 * Client-side sync Price Calculator
 */
export function calculateClientPrice(
  basePriceTRY: number,
  discountPercent: number = 0,
  _quantity: number = 1
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
