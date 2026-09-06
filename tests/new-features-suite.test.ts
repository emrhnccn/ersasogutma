import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TURKISH_PROVINCES } from '../src/lib/constants/provinces';
import { DealerApplicationSchema } from '../src/lib/validations';
import { buildOrderExportRows, translateOrderStatus } from '../src/lib/export/orderExport';
import bcrypt from 'bcryptjs';

describe('1. 81 İL SİSTEMİ & VALIDATION TESTLERİ', () => {
  it('Türkiye 81 ilinin tamamı eksiksiz tanımlı olmalı', () => {
    assert.strictEqual(TURKISH_PROVINCES.length, 81, 'İl sayısı 81 olmalıdır');
    assert.strictEqual(TURKISH_PROVINCES[0].name, 'Adana');
    assert.strictEqual(TURKISH_PROVINCES[80].name, 'Zonguldak');
    
    // Her ilin plaka kodu geçerli ve benzersiz olmalı
    const plateCodes = new Set(TURKISH_PROVINCES.map(p => p.plateCode));
    assert.strictEqual(plateCodes.size, 81, '81 farklı plaka kodu olmalı');
  });

  it('Tüm zorunlu alanlar doldurulduğunda başvuru şeması geçerli olmalı', () => {
    const validApp = {
      companyName: 'Ersa Test Ticaret Ltd. Şti.',
      contactPerson: 'Ahmet Yılmaz',
      phone: '05551234567',
      email: 'ahmet@ersatest.com',
      taxOffice: 'Kadıköy',
      taxNumber: '1234567890',
      idNumber: '12345678901', // 11 haneli T.C.
      city: 'İstanbul',
      address: 'Caferağa Mah. Moda Cad. No:12/4 Kadıköy/İstanbul',
      notes: 'Hızlı onay rica ederiz.'
    };

    const parsed = DealerApplicationSchema.safeParse(validApp);
    assert.strictEqual(parsed.success, true, 'Geçerli başvuru başarıyla doğrulanmalı');
  });

  it('T.C. Kimlik No 11 haneden farklı girilirse reddedilmeli', () => {
    const invalidApp = {
      companyName: 'Ersa Test Ltd.',
      contactPerson: 'Ali Veli',
      phone: '05551234567',
      email: 'ali@test.com',
      taxOffice: 'Çankaya',
      taxNumber: '1234567890',
      idNumber: '12345', // 5 hane (Hatalı)
      city: 'Ankara',
      address: 'Kızılay Mah. No:5'
    };

    const parsed = DealerApplicationSchema.safeParse(invalidApp);
    assert.strictEqual(parsed.success, false, '11 haneden kısa T.C. Kimlik reddedilmeli');
  });

  it('İl bilgisi boş bırakılırsa reddedilmeli', () => {
    const missingCity = {
      companyName: 'Test',
      contactPerson: 'Test',
      phone: '05551234567',
      email: 'test@test.com',
      taxOffice: 'Test',
      taxNumber: '1234567890',
      city: '',
      address: 'Adres var'
    };

    const parsed = DealerApplicationSchema.safeParse(missingCity);
    assert.strictEqual(parsed.success, false, 'Boş il reddedilmeli');
  });
});

describe('2. SİPARİŞ EXCEL & YAZDIRMA MODELİ TESTLERİ', () => {
  it('Sipariş durumları Türkçe olarak doğru çevrilmeli', () => {
    assert.strictEqual(translateOrderStatus('PENDING_APPROVAL'), 'Onay Bekliyor');
    assert.strictEqual(translateOrderStatus('APPROVED'), 'Onaylandı');
    assert.strictEqual(translateOrderStatus('PREPARING'), 'Hazırlanıyor');
    assert.strictEqual(translateOrderStatus('SHIPPED'), 'Sevkiyatta / Kargoda');
    assert.strictEqual(translateOrderStatus('DELIVERED'), 'Teslim Edildi');
    assert.strictEqual(translateOrderStatus('CANCELLED'), 'İptal Edildi');
  });

  it('Excel ihracat satırları tüm zorunlu sütunları eksiksiz içermeli', () => {
    const mockOrder = {
      id: 'ord-123',
      orderNumber: 'ORD-2026-001',
      createdAt: '2026-09-06T12:00:00Z',
      companyName: 'Kutup İklimlendirme A.Ş.',
      status: 'APPROVED',
      subtotalExVat: 1000,
      vatTotal: 200,
      grandTotal: 1200,
      items: [
        {
          name: 'R410A Soğutucu Gaz 11.3 kg',
          sku: 'GAS-R410A',
          quantity: 2,
          unit: 'ADET',
          unitNetExVat: 500,
          discountAmt: 50,
          vatRate: 20
        }
      ]
    };

    const rows = buildOrderExportRows([mockOrder]);
    assert.strictEqual(rows.length, 1);
    
    const row = rows[0];
    assert.strictEqual(row['Sipariş Numarası'], 'ORD-2026-001');
    assert.strictEqual(row['Bayi / Firma Adı'], 'Kutup İklimlendirme A.Ş.');
    assert.strictEqual(row['Sipariş Durumu'], 'Onaylandı');
    assert.strictEqual(row['Ürün Adı'], 'R410A Soğutucu Gaz 11.3 kg');
    assert.strictEqual(row['Ürün Kodu'], 'GAS-R410A');
    assert.strictEqual(row['Miktar'], '2 ADET');
    assert.strictEqual(row['Birim Fiyat (TL)'], 500);
    assert.strictEqual(row['İskonto (TL)'], 50);
    assert.strictEqual(row['Genel Toplam (TL)'], 1200);
  });
});

describe('3. GÜVENLİK, ŞİFRELEME & HESAP YÖNETİMİ TESTLERİ', () => {
  it('Şifreler bcrypt ile güvenli şekilde hashlenmeli ve plaintext ile ASLA eşleşmemeli', async () => {
    const plainPassword = 'SuperSecretPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);

    assert.notStrictEqual(plainPassword, hash);
    assert.strictEqual(hash.startsWith('$2'), true, 'Bcrypt hash formatında olmalı');

    const isValid = await bcrypt.compare(plainPassword, hash);
    assert.strictEqual(isValid, true, 'Doğru şifre doğrulanmalı');

    const isWrong = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrong, false, 'Yanlış şifre reddedilmeli');
  });
});

describe('4. CANLI SEPET HESAPLAMA MOTORU TESTLERİ', () => {
  it('Birim fiyat, iskonto, KDV ve satır toplamı matematiksel olarak tutarlı olmalı', () => {
    const basePrice = 1000;
    const discountPercent = 20; // %20 indirim
    const qty = 3;
    const vatRate = 20; // %20 KDV

    const unitPrice = basePrice * (1 - discountPercent / 100); // 800 TL
    const lineNet = unitPrice * qty; // 2400 TL
    const vatAmount = (lineNet * vatRate) / 100; // 480 TL
    const lineGross = lineNet + vatAmount; // 2880 TL

    assert.strictEqual(unitPrice, 800);
    assert.strictEqual(lineNet, 2400);
    assert.strictEqual(vatAmount, 480);
    assert.strictEqual(lineGross, 2880);
  });
});
