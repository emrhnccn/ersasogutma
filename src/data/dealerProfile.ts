import { DealerProfile } from '@/types';

export const INITIAL_DEALER_PROFILE: DealerProfile = {
  id: 'dealer-162',
  companyName: 'ERSA TİCARET & SOĞUTMA ISITMA LTD. ŞTİ.',
  dealerCode: 'BAYI-41008',
  contactPerson: 'Affan Emirhan',
  phoneGsm: '0532 555 41 41',
  phoneLandline: '0262 653 41 00',
  email: 'emirhan@ersasogutma.com.tr',
  eArchiveEmail: 'fatura@ersasogutma.com.tr',
  taxOffice: 'Darıca Vergi Dairesi',
  taxNumber: '3340592817',
  city: 'Kocaeli',
  district: 'Darıca',
  address: 'Kazım Karabekir Mah. İstasyon Cad. No:84 Darıca / Kocaeli',
  tier: 'Gold',
  discountRate: 0.20, // %20 İskonto
  creditLimit: 750000.00,
  riskLimit: 500000.00,
  currentBalance: 26233.61,
  balanceType: 'A', // Alacaklı
  lastLogin: '27.08.2026 15:10'
};
