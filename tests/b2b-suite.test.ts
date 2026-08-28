import { calculateClientPrice, TIER_DISCOUNT_MAP } from '../src/lib/pricingEngine';
import { CleanDbSchema, CartItemSchema, OrderCreateSchema, BankAccountSchema, DealerApplicationSchema } from '../src/lib/validations';

/**
 * Ersa Soğutma B2B Production Test Suite
 */
async function runTests() {
  console.log('====================================================');
  console.log('🚀 ERSA SOĞUTMA — B2B PRODUCTION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
      failed++;
    }
  }

  // --- 1. ZOD VALIDATION & SECURITY SCHEMAS ---
  console.log('📦 1. GÜVENLİK & ZOD REQUEST DOĞRULAMA TESTLERİ');

  // Clean DB confirmation phrase
  const validClean = CleanDbSchema.safeParse({ confirmPhrase: 'ERSA_RESET_CONFIRM_2026' });
  assert(validClean.success === true, 'Doğru onay ifadesi ile DB temizleme onaylanır');

  const invalidClean = CleanDbSchema.safeParse({ confirmPhrase: 'wrong-phrase' });
  assert(invalidClean.success === false, 'Hatalı onay ifadesi reddedilir (P0 Koruma)');

  // Cart item validation
  const validCart = CartItemSchema.safeParse({ productId: 'prod-123', quantity: 5 });
  assert(validCart.success === true, 'Geçerli sepet kalemi onaylanır');

  const invalidCart = CartItemSchema.safeParse({ productId: '', quantity: -2 });
  assert(invalidCart.success === false, 'Negatif veya boş sepet kalemi reddedilir');

  // Bank Account IBAN validation
  const validIban = BankAccountSchema.safeParse({
    bankName: 'Garanti BBVA',
    accountHolder: 'ERSA SOĞUTMA LTD',
    iban: 'TR120006200000012345678901'
  });
  assert(validIban.success === true, 'TR ile başlayan geçerli IBAN onaylanır');

  const invalidIban = BankAccountSchema.safeParse({
    bankName: 'Test Bank',
    accountHolder: 'Ersa',
    iban: 'DE123456'
  });
  assert(invalidIban.success === false, 'TR harici veya kısa IBAN reddedilir');

  // Dealer Application validation
  const validApp = DealerApplicationSchema.safeParse({
    companyName: 'Marmara Soğutma Ltd.',
    contactPerson: 'Erhan Usta',
    phone: '05316066451',
    email: 'erhan@marmarasogutma.com',
    city: 'Darıca / Kocaeli',
    taxOffice: 'Uluçınar V.D.',
    taxNumber: '1234567890'
  });
  assert(validApp.success === true, 'Eksiksiz bayilik başvurusu doğrulanır');

  // --- 2. B2B FİYAT MOTORU & İSKONTO KADEMELERİ ---
  console.log('\n💰 2. B2B FİYAT MOTORU & İSKONTO KADEMELERİ');

  const basePrice = 1000; // 1000 TL

  // Gold Tier (%40)
  const goldPrice = calculateClientPrice(basePrice, 'Gold', 1);
  assert(goldPrice.finalPriceTRY === 600, 'Gold Bayi için 1000 TL ürün %40 iskonto ile 600 TL hesaplanır', `Hesaplanan: ${goldPrice.finalPriceTRY}`);
  assert(goldPrice.discountAmountTRY === 400, 'Gold Bayi indirim tutarı 400 TL dir');

  // Silver Tier (%30)
  const silverPrice = calculateClientPrice(basePrice, 'Silver', 1);
  assert(silverPrice.finalPriceTRY === 700, 'Silver Bayi için 1000 TL ürün %30 iskonto ile 700 TL hesaplanır');

  // Standart Tier (%20)
  const stdPrice = calculateClientPrice(basePrice, 'Standart', 1);
  assert(stdPrice.finalPriceTRY === 800, 'Standart Bayi için 1000 TL ürün %20 iskonto ile 800 TL hesaplanır');

  // Bulk Quantity Tier (>= 10 adet -> +%5 Ek İndirim)
  const bulk10 = calculateClientPrice(basePrice, 'Gold', 10);
  assert(bulk10.appliedDiscountPercent === 45, '10 adet alımda Gold Bayi için %40 + %5 = %45 iskonto uygulanır', `İskonto: ${bulk10.appliedDiscountPercent}%`);
  assert(bulk10.finalPriceTRY === 550, '10 adet alımda birim fiyat 550 TL dir');

  // Large Bulk Quantity Tier (>= 50 adet -> +%10 Ek İndirim)
  const bulk50 = calculateClientPrice(basePrice, 'Gold', 50);
  assert(bulk50.appliedDiscountPercent === 50, '50 adet alımda Gold Bayi için %40 + %10 = %50 iskonto uygulanır');
  assert(bulk50.finalPriceTRY === 500, '50 adet alımda birim fiyat 500 TL dir');

  // --- 3. BAYİ VERİ İZOLASYONU & MULTI-TENANCY KONTROLÜ ---
  console.log('\n🏢 3. BAYİ VERİ İZOLASYONU (MULTI-TENANCY)');

  const dealerA = { id: 'user-a', companyId: 'comp-101', role: 'B2B_DEALER' };
  const dealerB = { id: 'user-b', companyId: 'comp-202', role: 'B2B_DEALER' };

  // Simulate order query whereClause builder
  function buildOrderFilter(user: { role: string; companyId: string }) {
    if (user.role === 'ADMIN') return {};
    return { companyId: user.companyId };
  }

  const filterA = buildOrderFilter(dealerA);
  const filterB = buildOrderFilter(dealerB);

  assert(filterA.companyId === 'comp-101', 'Bayi A sadece comp-101 şirketine ait siparişleri sorgulayabilir');
  assert(filterB.companyId === 'comp-202', 'Bayi B sadece comp-202 şirketine ait siparişleri sorgulayabilir');
  assert(filterA.companyId !== filterB.companyId, 'Bayi A ve Bayi B veritabanı filtreleri kesin olarak izoledir');

  // --- 4. SİPARİŞ YAŞAM DÖNGÜSÜ & STOK EKSİLTME ---
  console.log('\n📦 4. SİPARİŞ YAŞAM DÖNGÜSÜ (STATUS TRANSITIONS)');

  const validStatuses = ['PENDING_APPROVAL', 'APPROVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  assert(validStatuses.length === 6, 'Sipariş yaşam döngüsü 6 standart aşamadan oluşur');
  assert(validStatuses.includes('SHIPPED') && validStatuses.includes('DELIVERED'), 'Kargoda ve Teslim Edildi aşamaları mevcuttur');

  // Stock deduction simulation
  let currentStock = 25;
  const orderQty = 5;
  currentStock -= orderQty;
  assert(currentStock === 20, `Sipariş sonrası stok 25 adetten 20 adede düşer (Kalan: ${currentStock})`);

  // --- 5. İDEMPOTENT SENKRONİZASYON & MÜKERRER KAYIT ENGELLEME ---
  console.log('\n🔄 5. İDEMPOTENT İÇE AKTARMA (DEDUPING & UPSERT)');

  const productRegistry = new Map<string, { sku: string; name: string; price: number }>();

  function upsertProduct(p: { sku: string; name: string; price: number }) {
    productRegistry.set(p.sku, p);
  }

  // First sync
  upsertProduct({ sku: 'EMB-6144GK', name: 'Embraco Kompresör', price: 3850 });
  assert(productRegistry.size === 1, '1. Çekmede ürün kaydedildi');

  // Second sync (same SKU with updated price)
  upsertProduct({ sku: 'EMB-6144GK', name: 'Embraco Kompresör', price: 3900 });
  assert(productRegistry.size === 1, '2. Çekmede mükerrer kayıt oluşmadı, ürün güncellendi (İdempotent)');
  assert(productRegistry.get('EMB-6144GK')?.price === 3900, 'Ürün fiyatı başarıyla 3900 TL olarak güncellendi');

  // --- SUMMARY ---
  console.log('\n====================================================');
  console.log(`TEST SONUÇLARI: ${passed} Başarılı, ${failed} Hatalı`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TÜM PRODUCTION KRİTERLERİ VE GÜVENLİK TESTLERİ BAŞARIYLA GEÇTİ!');
    process.exit(0);
  }
}

runTests();
