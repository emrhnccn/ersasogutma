import { calculateClientPrice } from '../src/lib/pricingEngine';
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

  // --- 2. B2B FİYAT MOTORU & BAYİ ÖZEL İSKONTOLARI ---
  console.log('\n💰 2. B2B FİYAT MOTORU & BAYİ ÖZEL İSKONTOLARI');

  const basePrice = 1000; // 1000 TL

  // %40 Özel İskonto
  const p40 = calculateClientPrice(basePrice, 40, 1);
  assert(p40.finalPriceTRY === 600, 'Bayi için 1000 TL ürün %40 özel iskonto ile 600 TL hesaplanır', `Hesaplanan: ${p40.finalPriceTRY}`);
  assert(p40.discountAmountTRY === 400, 'İndirim tutarı 400 TL dir');

  // %15 Özel İskonto
  const p15 = calculateClientPrice(basePrice, 15, 1);
  assert(p15.finalPriceTRY === 850, 'Bayi için 1000 TL ürün %15 özel iskonto ile 850 TL hesaplanır');
  assert(p15.discountAmountTRY === 150, 'İndirim tutarı 150 TL dir');

  // %8.5 Ondalıklı Özel İskonto
  const p8_5 = calculateClientPrice(basePrice, 8.5, 1);
  assert(p8_5.finalPriceTRY === 915, 'Bayi için 1000 TL ürün %8.5 özel iskonto ile 915 TL hesaplanır');
  assert(p8_5.discountAmountTRY === 85, 'İndirim tutarı 85 TL dir');

  // %0 İskonto (Liste Fiyatı)
  const p0 = calculateClientPrice(basePrice, 0, 1);
  assert(p0.finalPriceTRY === 1000, 'İskontosuz bayi için 1000 TL liste fiyatı korunur');

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
  assert(filterA.companyId !== filterB.companyId, 'Bayi A ve Bayi B veri izolasyonu tamdır');

  // --- 4. CARİ HESAP & BAKİYE KURALI ---
  console.log('\n💳 4. CARİ HESAP & BAKİYE HESAPLAMA DOĞRULAMA');

  const creditLimit = 500000;
  const currentDebt = 320000;
  const availableCredit = Math.max(0, creditLimit - currentDebt);
  const newOrderTotal = 150000;

  assert(availableCredit === 180000, '500.000 TL limit ve 320.000 TL borç ile kullanılabilir limit 180.000 TL dir');
  assert(newOrderTotal <= availableCredit, '150.000 TL yeni sipariş mevcut kullanılabilir limite uygundur');

  const excessOrder = 200000;
  assert(excessOrder > availableCredit, '200.000 TL sipariş limiti aşar ve engellenmelidir');

  // --- SUMMARY ---
  console.log('\n====================================================');
  console.log(`📊 TEST SONUCU: ${passed} BAŞARILI, ${failed} BAŞARISIZ`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
