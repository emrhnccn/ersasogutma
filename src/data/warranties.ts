import { WarrantyRecord } from '@/types';

export const WARRANTIES: WarrantyRecord[] = [
  {
    serialNumber: 'ERS-2025-78901',
    productCode: '705010001',
    productName: 'Ersa Soğuk Oda Tavan Tipi Evaporatör 2.5 kW',
    brand: 'Ersa OEM',
    model: 'ERS-EVAP-25-DEF',
    installDate: '15.03.2025',
    warrantyPeriodMonths: 24,
    warrantyEndDate: '15.03.2027',
    status: 'Aktif Garanti',
    dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
    customerName: 'Gültekin Et & Şarküteri Soğuk Hava Deposu',
    serviceHistory: [
      {
        date: '15.03.2025',
        description: 'İlk kurulum ve gaz şarjı devreye alma işlemi yapıldı.',
        technician: 'Ahmet Usta (Yetkili Servis)',
        partsReplaced: 'Yok (İlk Kurulum)'
      },
      {
        date: '10.01.2026',
        description: 'Periyodik 6 aylık bakım ve fan kanat temizliği yapıldı.',
        technician: 'Murat Şen',
        partsReplaced: 'Defrost sensörü yenilendi.'
      }
    ]
  },
  {
    serialNumber: 'DAN-SC18-44910',
    productCode: '701010002',
    productName: 'Danfoss SC18G R134a 5/8 HP HMBP Ticari Kompresör',
    brand: 'Danfoss',
    model: '104G8820',
    installDate: '10.06.2024',
    warrantyPeriodMonths: 24,
    warrantyEndDate: '10.06.2026',
    status: 'Aktif Garanti',
    dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
    customerName: 'Merkez Sütlük Reyon Projesi',
    serviceHistory: [
      {
        date: '10.06.2024',
        description: 'Kompresör montajı ve vakumlama yapıldı.',
        technician: 'Ersa Yetkili Montaj Ekibi'
      }
    ]
  },
  {
    serialNumber: 'VAL-VDG-99014',
    productCode: '708010001',
    productName: 'VALUE VDG-S1 Dijital Akıllı Manometre Seti',
    brand: 'VALUE Tools',
    model: 'VDG-S1-PRO',
    installDate: '01.02.2024',
    warrantyPeriodMonths: 12,
    warrantyEndDate: '01.02.2025',
    status: 'Süresi Doldu',
    dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
    customerName: 'Servis Ekipmanı - Atölye',
    serviceHistory: [
      {
        date: '01.02.2024',
        description: 'Fatura tarihiyle cihaz garantisi başlatıldı.',
        technician: 'Fabrika Kalibrasyonlu'
      }
    ]
  }
];
