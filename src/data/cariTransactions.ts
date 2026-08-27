import { CariTransaction } from '@/types';

export const CARI_TRANSACTIONS: CariTransaction[] = [
  {
    id: 'cari-01',
    date: '31.12.2025',
    documentNo: 'D-2',
    documentType: 'Açılış Fişi',
    debt: 310658.38,
    credit: 0,
    balance: 310658.38,
    balanceType: 'B',
    description: '2025 Yılı Devir Bakiyesi'
  },
  {
    id: 'cari-02',
    date: '04.01.2026',
    documentNo: 'SANPOS-5175',
    documentType: 'Tahsilat Makbuzu',
    debt: 0,
    credit: 1040.00,
    balance: 309618.38,
    balanceType: 'B',
    description: 'Sanal POS Kredi Kartı Tahsilatı'
  },
  {
    id: 'cari-03',
    date: '08.01.2026',
    documentNo: 'SANPOS-5216',
    documentType: 'Tahsilat Makbuzu',
    debt: 0,
    credit: 1200.00,
    balance: 308418.38,
    balanceType: 'B',
    description: 'Online Kredi Kartı Tahsilat'
  },
  {
    id: 'cari-04',
    date: '08.01.2026',
    documentNo: 'SANPOS-5217',
    documentType: 'Tahsilat Makbuzu',
    debt: 0,
    credit: 1500.00,
    balance: 306918.38,
    balanceType: 'B',
    description: 'Online Kredi Kartı Tahsilat'
  },
  {
    id: 'cari-05',
    date: '09.01.2026',
    documentNo: 'ERS-202600034',
    documentType: 'Satış Faturası',
    debt: 48439.00,
    credit: 0,
    balance: 355357.38,
    balanceType: 'B',
    description: 'Ticari Soğutma Kompresör ve Gaz Sevkiyatı',
    invoiceDetail: {
      invoiceNumber: 'ERS-202600034',
      eArchiveId: 'GIB2026000000034',
      date: '09.01.2026',
      dueDate: '09.03.2026',
      dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
      taxOffice: 'Darıca Vergi Dairesi',
      taxNumber: '3340592817',
      address: 'Kazım Karabekir Mah. İstasyon Cad. No:84 Darıca / Kocaeli',
      items: [
        { code: '701010001', name: 'Embraco NEK2134GK R404A 1/2 HP LBP Kompresör', quantity: 4, unit: 'Adet', unitPrice: 6850.00, vatRate: 20, total: 27400.00 },
        { code: '704010001', name: 'Ersa R134a Saf Soğutucu Gaz Tüpü 13.6 Kg', quantity: 3, unit: 'Tüp', unitPrice: 4250.00, vatRate: 20, total: 12750.00 },
        { code: '703010001', name: 'Halcor 1/4" x 0.70 mm Kangal Bakır Boru (15m)', quantity: 2, unit: 'Top', unitPrice: 1120.00, vatRate: 20, total: 2240.00 }
      ],
      subtotal: 42390.00,
      vatMatrah: 42390.00,
      vatTotal: 6049.00,
      grandTotal: 48439.00
    }
  },
  {
    id: 'cari-06',
    date: '11.01.2026',
    documentNo: 'SANPOS-5257',
    documentType: 'Tahsilat Makbuzu',
    debt: 0,
    credit: 50000.00,
    balance: 305357.38,
    balanceType: 'B',
    description: 'Kuveyt Türk Sanal POS 3 Taksit Tahsilatı'
  },
  {
    id: 'cari-07',
    date: '19.01.2026',
    documentNo: 'G-2215',
    documentType: 'Havale/EFT',
    debt: 0,
    credit: 10000.00,
    balance: 295357.38,
    balanceType: 'B',
    description: 'Garanti BBVA Banka Havalesi'
  },
  {
    id: 'cari-08',
    date: '20.01.2026',
    documentNo: 'SANPOS-5382',
    documentType: 'Tahsilat Makbuzu',
    debt: 0,
    credit: 1950.00,
    balance: 293407.38,
    balanceType: 'B',
    description: 'Online Kredi Kartı Tek Çekim'
  },
  {
    id: 'cari-09',
    date: '25.01.2026',
    documentNo: 'ERS-202600190',
    documentType: 'Satış Faturası',
    debt: 118624.55,
    credit: 0,
    balance: 412031.93,
    balanceType: 'B',
    description: 'Soğuk Oda Evaporatör & Kondenser Paketi',
    invoiceDetail: {
      invoiceNumber: 'ERS-202600190',
      eArchiveId: 'GIB2026000000190',
      date: '25.01.2026',
      dueDate: '25.03.2026',
      dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
      taxOffice: 'Darıca Vergi Dairesi',
      taxNumber: '3340592817',
      address: 'Kazım Karabekir Mah. İstasyon Cad. No:84 Darıca / Kocaeli',
      items: [
        { code: '705010001', name: 'Ersa Soğuk Oda Tavan Tipi Evaporatör 2.5 kW', quantity: 4, unit: 'Adet', unitPrice: 14500.00, vatRate: 20, total: 58000.00 },
        { code: '705010002', name: 'Ersa Hava Soğutmalı Kondenser Ünitesi 4.2 kW', quantity: 3, unit: 'Adet', unitPrice: 11800.00, vatRate: 20, total: 35400.00 },
        { code: '7011228203', name: 'Carel Easy PJEZS00000 Dijital Termostat', quantity: 4, unit: 'Adet', unitPrice: 1480.00, vatRate: 20, total: 5920.00 }
      ],
      subtotal: 99320.00,
      vatMatrah: 99320.00,
      vatTotal: 19304.55,
      grandTotal: 118624.55
    }
  },
  {
    id: 'cari-10',
    date: '25.01.2026',
    documentNo: 'SANPOS-5434',
    documentType: 'Tahsilat Makbuzu',
    debt: 0,
    credit: 6000.00,
    balance: 406031.93,
    balanceType: 'B',
    description: 'Bonus Card Sanal POS Tahsilatı'
  },
  {
    id: 'cari-11',
    date: '26.01.2026',
    documentNo: 'SANPOS-5438',
    documentType: 'Tahsilat Makbuzu',
    debt: 0,
    credit: 35000.00,
    balance: 371031.93,
    balanceType: 'B',
    description: 'World Card 6 Taksit Tahsilatı'
  },
  {
    id: 'cari-12',
    date: '27.01.2026',
    documentNo: '16950',
    documentType: 'Satış Faturası',
    debt: 19000.00,
    credit: 0,
    balance: 390031.93,
    balanceType: 'B',
    description: 'VALUE Servis El Aletleri & Vakum Pompası',
    invoiceDetail: {
      invoiceNumber: '16950',
      eArchiveId: 'GIB2026000001695',
      date: '27.01.2026',
      dueDate: '27.02.2026',
      dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
      taxOffice: 'Darıca Vergi Dairesi',
      taxNumber: '3340592817',
      address: 'Kazım Karabekir Mah. İstasyon Cad. No:84 Darıca / Kocaeli',
      items: [
        { code: '708010001', name: 'VALUE VDG-S1 Dijital Akıllı Manometre Seti', quantity: 1, unit: 'Takım', unitPrice: 6200.00, vatRate: 20, total: 6200.00 },
        { code: '708010002', name: 'VALUE V-i220SV 2 CFM Vakum Pompası', quantity: 1, unit: 'Adet', unitPrice: 7450.00, vatRate: 20, total: 7450.00 },
        { code: '708010003', name: 'VALUE VFT-808-MIS Havşa Takımı', quantity: 1, unit: 'Takım', unitPrice: 2850.00, vatRate: 20, total: 2850.00 }
      ],
      subtotal: 16500.00,
      vatMatrah: 16500.00,
      vatTotal: 2500.00,
      grandTotal: 19000.00
    }
  },
  {
    id: 'cari-13',
    date: '20.02.2026',
    documentNo: 'CHK-88390',
    documentType: 'Çek/Senet Girişi',
    debt: 0,
    credit: 363798.32,
    balance: 26233.61,
    balanceType: 'A',
    description: 'Vadesi 25.04.2026 Müşteri Çeki Bordrosu'
  }
];

export const CARI_SUMMARY = {
  totalOrders: 5354113.59,
  totalDebt: 6621656.70,
  totalCredit: 6647890.31,
  balance: 26233.61,
  balanceType: 'A' as const, // Alacaklı
  currency: 'TL'
};
