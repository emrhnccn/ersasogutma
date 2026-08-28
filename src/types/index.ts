export type Currency = 'TRY' | 'USD' | 'EUR';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  pim: number; // Paket İçi Miktar / Minimum Sipariş Koli Adedi
  priceTRY: number;
  priceUSD: number;
  priceEUR: number;
  originalCurrency: Currency;
  stock: number;
  inStock: boolean;
  image: string;
  isNew?: boolean;
  isOpportunity?: boolean;
  isDiscounted?: boolean;
  discountRate?: number;
  unit: string; // Adet, Metre, Kg, Takım, Koli
  description: string;
  specifications: Record<string, string>;
  barcode?: string;
  oemCode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPriceTRY: number;
  totalTRY: number;
  appliedDiscountRate: number;
}

export type OrderStatus = 'onaysiz' | 'bekliyor' | 'sevkiyatta' | 'parcali' | 'tamamlandi' | 'iptal';

export interface OrderHistoryStep {
  title: string;
  description: string;
  date: string;
  user: string;
  status: 'completed' | 'current' | 'pending';
}

export interface OrderLineItem {
  productId: string;
  productCode: string;
  productName: string;
  productImage: string;
  quantity: number;
  shippedQuantity: number;
  unitPriceTRY: number;
  totalTRY: number;
  pim: number;
  status: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  source: 'Web' | 'Temsilci' | 'Mobil' | 'Excel';
  orderType: 'Standart Sipariş' | 'Grup Siparişi' | 'Walton Bağlantı' | 'Acil Sevk';
  status: OrderStatus;
  statusText: string;
  items: OrderLineItem[];
  subtotalTRY: number;
  discountTRY: number;
  vatTRY: number;
  totalTRY: number;
  orderNote?: string;
  accountingNote?: string;
  shippingAddress?: string;
  history: OrderHistoryStep[];
  dealerName: string;
}

export interface InvoiceLineItem {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface InvoiceDetail {
  invoiceNumber: string;
  eArchiveId?: string;
  date: string;
  dueDate?: string;
  dealerName: string;
  taxOffice: string;
  taxNumber: string;
  address: string;
  items: InvoiceLineItem[];
  subtotal: number;
  vatMatrah: number;
  vatTotal: number;
  grandTotal: number;
}

export interface CariTransaction {
  id: string;
  date: string;
  documentNo: string;
  documentType: 'Açılış Fişi' | 'Satış Faturası' | 'Tahsilat Makbuzu' | 'İade Faturası' | 'Çek/Senet Girişi' | 'Kredi Kartı Ödemesi' | 'Havale/EFT';
  debt: number; // Borç
  credit: number; // Alacak
  balance: number; // Bakiye
  balanceType: 'B' | 'A'; // B = Borçlu (Dealer owes Ersa), A = Alacaklı (Dealer has credit)
  description?: string;
  invoiceDetail?: InvoiceDetail;
}

export interface ChequeItem {
  id: string;
  maturityDate: string; // Vade Tarihi (YYYY-MM-DD)
  amount: number; // Tutar
  valueDays: number; // Valör (Gün farkı)
  bankName?: string;
  chequeNumber?: string;
}

export interface MaturityResult {
  totalAmount: number;
  chequeCount: number;
  averageValueDays: number; // Ortalama Valör
  averageMaturityDate: string; // Ortalama Vade Tarihi
  startDate: string; // Vade Başlangıç Tarihi
}

export interface PosInstallmentRate {
  installment: number;
  rate: number; // 0 for no commission, 0.05 for 5% etc.
  monthlyAmount: number;
  totalAmount: number;
}

export interface PosBank {
  id: string;
  name: string;
  cardBrand: 'Bonus' | 'World' | 'Maximum' | 'Axess' | 'Paraf' | 'CardFinans' | 'Bankkart' | 'Diğer';
  logo: string;
  installments: PosInstallmentRate[];
}

export interface PosSlip {
  id: string;
  date: string;
  referenceCode: string;
  cardNumberMasked: string;
  cardHolder: string;
  bankName: string;
  installmentCount: number;
  amount: number;
  status: 'Başarılı' | 'Başarısız' | 'Beklemede';
  authCode: string;
  terminalId: string;
  responseMessage: string;
  dealerName: string;
}

export interface WarrantyRecord {
  serialNumber: string;
  productCode: string;
  productName: string;
  brand: string;
  model: string;
  installDate: string;
  warrantyPeriodMonths: number;
  warrantyEndDate: string;
  status: 'Aktif Garanti' | 'Süresi Doldu' | 'Kayıtsız';
  dealerName: string;
  customerName?: string;
  serviceHistory: {
    date: string;
    description: string;
    technician: string;
    partsReplaced?: string;
  }[];
}

export interface BankAccount {
  id: string;
  bankName: string;
  bankLogo: string;
  accountHolder: string;
  branchName: string;
  branchCode: string;
  accountNumber: string;
  iban: string;
  currency: 'TRY' | 'USD' | 'EUR';
  swiftCode?: string;
}

export interface UserNote {
  id: string;
  title: string;
  description: string;
  date: string;
  color?: string;
}

export interface UserReminder {
  id: string;
  title: string;
  description: string;
  reminderDate: string;
  days: string[];
  isCompleted: boolean;
}

export interface PortalMessage {
  id: string;
  code: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  date: string;
  isRead: boolean;
  type: 'inbox' | 'sent';
  department?: string;
}

export interface DealerProfile {
  id: string;
  companyName: string;
  dealerCode: string;
  contactPerson: string;
  phoneGsm: string;
  phoneLandline: string;
  email: string;
  eArchiveEmail: string;
  taxOffice: string;
  taxNumber: string;
  city: string;
  district: string;
  address: string;
  tier: 'Standart' | 'Silver' | 'Gold';
  discountRate: number; // e.g. 0.20, 0.30, 0.40
  creditLimit: number;
  riskLimit: number;
  currentBalance: number;
  balanceType: 'B' | 'A';
  lastLogin: string;
  avatarUrl?: string;
}

export interface ExchangeRates {
  USD_TRY: number;
  EUR_TRY: number;
  GBP_TRY: number;
  lastUpdated: string;
}

export interface QuoteItem {
  productId: string;
  productCode: string;
  productName: string;
  unitPriceTRY: number;
  quantity: number;
  discountRate: number;
  totalTRY: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  date: string;
  validUntil: string;
  dealerName: string;
  dealerCode: string;
  items: QuoteItem[];
  subtotalTRY: number;
  discountTRY: number;
  vatTRY: number;
  totalTRY: number;
  status: 'Aktif' | 'Sipariş Edildi' | 'Süresi Doldu';
  notes?: string;
}

export interface B2BNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'finance' | 'stock' | 'system';
  date: string;
  isRead: boolean;
  link?: string;
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  serialNumber: string;
  productName: string;
  dealerName: string;
  date: string;
  issueDescription: string;
  status: 'İnceleniyor' | 'Onaylandı' | 'Parça Bekleniyor' | 'Tamamlandı' | 'Reddedildi';
  technicianNotes?: string;
}
