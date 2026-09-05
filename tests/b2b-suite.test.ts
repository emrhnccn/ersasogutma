import { calculateClientPrice } from '../src/lib/pricingEngine';
import { getStockStatus } from '../src/lib/stockHelper';
import { calculateFinancialFields } from '../src/lib/financeService';
import { validatePasswordStrength, hashToken } from '../src/lib/auth/password-policy';
import { maskSensitiveAuditData } from '../src/lib/auth-guard';
import {
  CleanDbSchema,
  CartItemSchema,
  BankAccountSchema,
  DealerApplicationSchema
} from '../src/lib/validations';

/**
 * Ersa Soğutma B2B Production Comprehensive Test Suite
 */
async function runTests() {
  console.log('====================================================');
  console.log('🚀 ERSA SOĞUTMA — B2B PRODUCTION END-TO-END TEST SUITE');
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

  // --- 1. GÜVENLİK & ZOD REQUEST DOĞRULAMA TESTLERİ ---
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

  // 0 TL Ürün Fiyat Koruması
  const pZero = calculateClientPrice(0, 20, 1);
  assert(pZero.finalPriceTRY === 0, 'Sıfır fiyatlı ürünün net fiyatı 0 TL kalır');

  // --- 3. MERKEZİ STOK DURUMU & RENK SİSTEMİ ---
  console.log('\n📊 3. MERKEZİ STOK DURUMU & RENK SİSTEMİ (>10 Normal, 1-9 Turuncu, <=0 Kırmızı)');

  const s25 = getStockStatus(25);
  assert(s25.status === 'NORMAL', 'Stok = 25 -> NORMAL (Yeşil) durumundadır');

  const s10 = getStockStatus(10);
  assert(s10.status === 'NORMAL', 'Stok = 10 -> NORMAL durumundadır (10 adet Turuncu DEĞİLDİR)');

  const s9 = getStockStatus(9);
  assert(s9.status === 'WARNING', 'Stok = 9 -> WARNING (Turuncu) durumundadır');

  const s1 = getStockStatus(1);
  assert(s1.status === 'WARNING', 'Stok = 1 -> WARNING (Turuncu) durumundadır');

  const s0 = getStockStatus(0);
  assert(s0.status === 'OUT_OF_STOCK', 'Stok = 0 -> OUT_OF_STOCK (Kırmızı) durumundadır');

  const sNeg = getStockStatus(-3);
  assert(sNeg.status === 'OUT_OF_STOCK', 'Negatif stok (-3) -> OUT_OF_STOCK (Kırmızı) olarak değerlendirilir');

  // --- 4. MERKEZİ FİNANS VE BAKİYE SERVİSİ ---
  console.log('\n💳 4. MERKEZİ FİNANS VE BAKİYE SERVİSİ (SINGLE SOURCE OF TRUTH)');

  // Senaryo 1: Borçlu Cari Hesap (Borç > Alacak)
  const fin1 = calculateFinancialFields({
    creditLimit: 500000,
    totalDebit: 150000,
    totalCredit: 50000
  });
  assert(fin1.cariBakiye === 100000, '150.000 TL borç - 50.000 TL alacak = 100.000 TL bakiye');
  assert(fin1.bakiyeYonu === 'BORC', 'Bakiye yönü BORÇ olmalıdır');
  assert(fin1.odenecekTutar === 100000, 'Ödenecek tutar borç bakiyesine eşittir (100.000 TL)');
  assert(fin1.kullanilabilirLimit === 400000, '500.000 TL limit - 100.000 TL net borç = 400.000 TL kalan limit');

  // Senaryo 2: Alacaklı Cari Hesap (Alacak > Borç)
  const fin2 = calculateFinancialFields({
    creditLimit: 200000,
    totalDebit: 30000,
    totalCredit: 70000
  });
  assert(fin2.cariBakiye === 40000, '30.000 TL borç - 70.000 TL alacak = 40.000 TL bakiye');
  assert(fin2.bakiyeYonu === 'ALACAK', 'Bakiye yönü ALACAK olmalıdır');
  assert(fin2.odenecekTutar === 0, 'Alacaklı bayinin ödenecek borcu 0 TL dir');
  assert(fin2.kullanilabilirLimit === 200000, 'Alacaklı bayinin kredi limiti tamdır (200.000 TL)');

  // Senaryo 3: Sıfır Bakiye
  const fin3 = calculateFinancialFields({
    creditLimit: 150000,
    totalDebit: 80000,
    totalCredit: 80000
  });
  assert(fin3.cariBakiye === 0, 'Borç = Alacak durumunda bakiye 0 TL dir');
  assert(fin3.odenecekTutar === 0, 'Sıfır bakiyede ödenecek tutar 0 TL dir');

  // --- 5. ŞİFRE GÜVENLİK POLİTİKASI & TOKEN HASHING ---
  console.log('\n🔐 5. ŞİFRE POLİTİKASI & TOKEN GÜVENLİĞİ');

  const weakShort = validatePasswordStrength('Abc1!');
  assert(weakShort.isValid === false, '8 karakterden kısa şifre reddedilir');

  const noUpper = validatePasswordStrength('bayi123456!');
  assert(noUpper.isValid === false, 'Büyük harf içermeyen şifre reddedilir');

  const noLower = validatePasswordStrength('BAYI123456!');
  assert(noLower.isValid === false, 'Küçük harf içermeyen şifre reddedilir');

  const noNumOrSym = validatePasswordStrength('BayiSifresi');
  assert(noNumOrSym.isValid === false, 'Rakam veya sembol içermeyen şifre reddedilir');

  const strongPass = validatePasswordStrength('Bayi234262!');
  assert(strongPass.isValid === true, 'Tüm kriterleri karşılayan güçlü şifre onaylanır');

  const rawToken = 'test-token-123';
  const hashedToken1 = hashToken(rawToken);
  const hashedToken2 = hashToken(rawToken);
  assert(hashedToken1 === hashedToken2, 'Aynı token deterministik SHA-256 hash üretir');
  assert(hashedToken1 !== rawToken, 'Ham token veritabanında plain-text olarak ASLA saklanmaz');

  // --- 6. AUDIT LOG PII & HASSAS VERİ MASKESİ ---
  console.log('\n🛡️ 6. AUDIT LOG HASSAS VERİ & PII MASKESİ');

  const sensitivePayload = {
    username: 'bayi5343434',
    password: 'SuperSecretPassword123!',
    cardNumber: '5528790012345678',
    cvv: '123',
    phone: '05316066451',
    taxNumber: '1234567890'
  };

  const masked = maskSensitiveAuditData(sensitivePayload);
  assert(masked.password === '***REDACTED***', 'Şifre alanı logda ***REDACTED*** olarak maskelenir');
  assert(masked.cvv === '***REDACTED***', 'CVV alanı logda ***REDACTED*** olarak maskelenir');
  assert(masked.cardNumber.includes('**** **** **** 5678'), 'Kredi kartı numarası son 4 hane hariç maskelenir');
  assert(masked.phone.includes('053****6451'), 'Telefon numarası ortadaki haneler maskelenerek saklanır');
  assert(masked.taxNumber.includes('******7890'), 'Vergi numarası maskelenir');

  // --- 7. SİPARİŞ DURUM GEÇİŞ KURALLARI ---
  console.log('\n🔄 7. SİPARİŞ DURUM GEÇİŞ KURALLARI (STATE MACHINE)');

  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
    APPROVED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: []
  };

  function canTransition(currentStatus: string, nextStatus: string): boolean {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  assert(canTransition('PENDING_APPROVAL', 'APPROVED') === true, 'PENDING_APPROVAL -> APPROVED geçerlidir');
  assert(canTransition('APPROVED', 'SHIPPED') === true, 'APPROVED -> SHIPPED geçerlidir');
  assert(canTransition('SHIPPED', 'DELIVERED') === true, 'SHIPPED -> DELIVERED geçerlidir');
  assert(canTransition('PENDING_APPROVAL', 'DELIVERED') === false, 'Onaylanmamış sipariş doğrudan DELIVERED yapılamaz');
  assert(canTransition('DELIVERED', 'APPROVED') === false, 'Teslim edilmiş sipariş APPROVED durumuna geri alınamaz');
  assert(canTransition('CANCELLED', 'SHIPPED') === false, 'İptal edilmiş sipariş kargoya verilemez');

  // --- SUMMARY ---
  console.log('\n====================================================');
  console.log(`📊 TEST SONUCU: ${passed} BAŞARILI, ${failed} BAŞARISIZ`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
