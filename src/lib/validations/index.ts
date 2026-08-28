import { z } from 'zod';

export const CartItemSchema = z.object({
  productId: z.string().min(1, 'Ürün ID zorunludur'),
  quantity: z.number().positive('Miktar pozitif olmalıdır'),
});

export const OrderCreateSchema = z.object({
  paymentMethod: z.enum(['CURRENT_ACCOUNT', 'CREDIT_CARD', 'BANK_TRANSFER']).default('CURRENT_ACCOUNT'),
  orderNote: z.string().max(500, 'Sipariş notu en fazla 500 karakter olabilir').optional(),
  accountingNote: z.string().max(500, 'Muhasebe notu en fazla 500 karakter olabilir').optional(),
  addressId: z.string().optional(),
});

export const QuoteCreateSchema = z.object({
  validUntil: z.string().min(1, 'Geçerlilik tarihi zorunludur'),
  notes: z.string().max(1000).optional(),
});

export const BankAccountSchema = z.object({
  id: z.string().optional(),
  bankName: z.string().min(2, 'Banka adı en az 2 karakter olmalıdır'),
  accountHolder: z.string().min(2, 'Hesap sahibi zorunludur'),
  iban: z.string().min(15, 'Geçerli bir IBAN giriniz').regex(/^TR/i, 'IBAN TR ile başlamalıdır'),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  accountNumber: z.string().optional(),
  currency: z.enum(['TRY', 'USD', 'EUR']).default('TRY'),
  swiftCode: z.string().optional(),
  bankLogo: z.string().optional(),
});

export const DealerApplicationSchema = z.object({
  companyName: z.string().min(2, 'Firma ünvanı zorunludur'),
  contactPerson: z.string().min(2, 'Yetkili kişi zorunludur'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  city: z.string().min(2, 'İl / İlçe bilgisi zorunludur'),
  taxOffice: z.string().min(2, 'Vergi dairesi zorunludur'),
  taxNumber: z.string().min(10, 'Vergi numarası en az 10 hane olmalıdır'),
  notes: z.string().optional(),
});

export const CleanDbSchema = z.object({
  confirmPhrase: z.literal('ERSA_RESET_CONFIRM_2026', {
    message: 'Veritabanı sıfırlama için onay ifadesi hatalı: ERSA_RESET_CONFIRM_2026 bekleniyor.'
  }),
});

export const ScrapeJobSchema = z.object({
  action: z.enum(['start', 'stop', 'preview']).default('start'),
  providerId: z.enum(['ersaticaret', 'girdap']).default('ersaticaret'),
  options: z.object({
    targetUrl: z.string().url().optional(),
    maxProducts: z.number().int().positive().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
});

export const PriceRuleSchema = z.object({
  name: z.string().min(2, 'Kural adı zorunludur'),
  priority: z.number().int().min(1).max(10).default(5),
  type: z.enum(['CUSTOMER_PRODUCT', 'GROUP_PRODUCT', 'GROUP_BRAND', 'GROUP_CATEGORY', 'GROUP_PERCENT', 'QTY_TIER']),
  customerGroupId: z.string().optional(),
  companyId: z.string().optional(),
  productId: z.string().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  specialPrice: z.number().positive().optional(),
  minQty: z.number().int().positive().optional(),
  active: z.boolean().default(true),
});
