# Ersa Soğutma B2B Portalı & Yönetim Sistemi

Ersa Soğutma kurumsal B2B bayi portalı, online sipariş, cari hesap takibi, POS tahsilat ve entegre yönetim paneli.

---

## 🛠️ Mimari ve Veri Akışı (Data Flow)

### 1. Tek Doğruluk Kaynağı (Single Source of Truth) — Finans Servisi
- Tüm cari bakiye, kredi limiti ve tahsilat hesaplamaları `@/lib/financeService.ts` üzerinden yürütülür.
- Endpoint: `/api/b2b/finance/summary`
- Atomik Çıktı Parametreleri:
  - `cariBakiye`: Net bakiye tutarı
  - `bakiyeYonu`: `'BORC' | 'ALACAK' | 'SIFIR'`
  - `krediLimiti`: Tanımlı toplam risk / kredi limiti
  - `kullanilabilirLimit`: `Math.max(0, krediLimiti - (bakiyeYonu === 'BORC' ? cariBakiye : 0))`
  - `gecikenBorc`: Vadesi geçmiş borç tutarı
  - `odenecekTutar`: Bakiye borç ise net borç tutarı, alacak ise `0.00 TL`
- **Tüketici Ekranlar:**
  - Bayi Dashboard (`/bayi`)
  - Cari Ekstre (`/bayi/cari`)
  - Sepet Özeti (`/bayi/siparisler/sepet`) -> *Mevcut Cari Borç* ve *Sipariş Sonrası Tahmini Borç* açıkça ayrılmıştır.
  - Online POS Ekranı (`/bayi/finans/online-odeme`) -> Doğrudan tek doğruluk kaynağından beslenir ve net borcu tek tıkla kapatma imkanı sunar.

### 2. B2B Fiyatlandırma Önceliği (Pricing Hierarchy)
Tüm ürün fiyatlamaları `@/lib/pricingEngine.ts` ve backend API'leri üzerinden aşağıdaki 5 seviyeli kesin öncelik sırasına göre hesaplanır:

1. **Bayiye Özel Net Fiyat** (`DealerProductPrice` / `customPrice`): Varsa doğrudan geçerli fiyattır.
2. **Bayiye Özel İskonto Oranı** (`User.discountRate`): Bayi hesabında tanımlı özel iskonto oranı (`0.00 - 1.00`).
3. **Bayi Kademe İskontosu** (`DealerTier.discountPercentage`): Bayinin bulunduğu kurumsal kademenin (Platin, Altın, Gümüş vb.) iskontosu.
4. **Kategori İskontosu** (`CategoryDiscount`): Ürünün ait olduğu ana/alt kategoriye tanımlı genel iskonto.
5. **Standart Liste Satış Fiyatı** (`Product.salePrice` / `priceTRY`): Taban katalog liste fiyatı.

> **Önemli Güvenlik Kuralı:** Liste fiyatı veya bayi fiyatı `<= 0` veya `null` olan hiçbir ürün sepete eklenemez ve sipariş satırına dönüştürülemez. Frontend'de *"Fiyat Bekleniyor / İletişime Geçin"* rozeti görüntülenir.

---

## 🔄 Sipariş Yaşam Döngüsü (Order State Machine)

Sipariş durumları katı bir geçiş matrisi ile korunur (`/api/b2b/orders/[id]`):
```
PENDING_APPROVAL (Onay Bekliyor)
       ↓
   APPROVED (Onaylandı / Hazırlanıyor)
       ↓
    SHIPPED (Kargoya Verildi)
       ↓
   DELIVERED (Teslim Edildi)

* CANCELLED (İptal Edildi) durumuna yalnızca SHIPPED öncesi geçilebilir.
* Teslim edilen veya iptal edilen sipariş geriye dönük değiştirilemez.
```

- **İdempotency:** Çift sipariş oluşturulmasını engellemek amacıyla `X-Idempotency-Key` veya `idempotencyKey` hash kontrolü uygulanır.

---

## 🔐 Güvenlik, Parola Politikası ve Audit Log

1. **Şifre Sıfırlama Akışı:**
   - `/bayi/sifremi-unuttum` -> `/api/auth/forgot-password` (Rate-limited, max 3 istek / 15 dk)
   - 64 karakterlik kriptografik rastgele token oluşturulur; veritabanında sadece **SHA-256 hash**'i saklanır (`PasswordResetToken`). Token ömrü 1 saattir.
   - `/bayi/sifre-sifirla?token=...` -> `/api/auth/reset-password` (Şifre politikası doğrulaması ve tek kullanımlık tüketim).
2. **Güvenli Parola Politikası:**
   - En az 8 karakter, en az 1 büyük harf, en az 1 küçük harf, en az 1 rakam veya özel karakter.
3. **Audit Log Maskeleme & Deduplikasyon:**
   - Hassas PII verileri (şifre, kredi kartı, CVV, TCKN/VKN, telefon) otomatik olarak maskelenir/redakte edilir (`maskSensitiveAuditData`).
   - Tekrarlanan sepet hareketleri 4 saniyelik bellek içi dedup filtresiyle engellenir.
4. **Yıkıcı İşlem Koruması (DB Clean Guard):**
   - Production ortamında tehlikeli DB temizleme API'si (`/api/admin/clean-db`) `NODE_ENV === 'production'` kilidiyle engellenir.
   - Sadece ADMIN rolü ve tam onay ifadesi (`VERITABANINI-TEMIZLE-ONAYLIYORUM`) ile çalışabilir.

---

## 🧪 Test ve Doğrulama Komutları

```bash
# Otomatik birim ve entegrasyon testleri (49 test)
npm test

# TypeScript tip kontrolü
npx tsc --noEmit

# Production Build
npm run build
```
