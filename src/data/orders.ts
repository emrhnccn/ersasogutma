import { Order } from '@/types';

export const ORDERS: Order[] = [
  {
    id: 'ord-28004',
    orderNumber: '28004',
    date: '20.08.2026 14:32',
    source: 'Web',
    orderType: 'Standart Sipariş',
    status: 'bekliyor',
    statusText: 'Bekliyor (Onay Sürecinde)',
    dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
    items: [
      {
        productId: 'ersa-701010001',
        productCode: '701010001',
        productName: 'Embraco NEK2134GK R404A 1/2 HP LBP Hermetik Kompresör',
        productImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        quantity: 3,
        shippedQuantity: 0,
        unitPriceTRY: 6850.00,
        totalTRY: 20550.00,
        pim: 1,
        status: 'Bekliyor'
      },
      {
        productId: 'ersa-704010001',
        productCode: '704010001',
        productName: 'Ersa R134a Saf Soğutucu Gaz Tüpü 13.6 Kg (Net)',
        productImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        quantity: 5,
        shippedQuantity: 0,
        unitPriceTRY: 4250.00,
        totalTRY: 21250.00,
        pim: 1,
        status: 'Bekliyor'
      },
      {
        productId: 'ersa-7011204205',
        productCode: '7011204205',
        productName: 'Ranco K59-L1102 Çift Kapılı Kısa Kuyruk Termostat',
        productImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        quantity: 30,
        shippedQuantity: 0,
        unitPriceTRY: 85.00,
        totalTRY: 2550.00,
        pim: 30,
        status: 'Bekliyor'
      }
    ],
    subtotalTRY: 44350.00,
    discountTRY: 8870.00, // %20 İskonto
    vatTRY: 7096.00,
    totalTRY: 42576.00,
    orderNote: 'Depo teslim alınacak, lütfen palet ambalaj yapılsın.',
    accountingNote: 'Cari hesaba virman edilecek, vade 60 gün.',
    shippingAddress: 'Kazım Karabekir Mah. İstasyon Cad. No:84 Darıca / Kocaeli',
    history: [
      {
        title: 'Sipariş Oluşturuldu',
        description: 'Bayi portalı üzerinden web siparişi verildi.',
        date: '20.08.2026 14:32',
        user: 'ERSA TİCARET (Affan Emirhan)',
        status: 'completed'
      },
      {
        title: 'Muhasebe Onayı',
        description: 'Risk ve limit kontrolü yapılıyor.',
        date: '20.08.2026 14:45',
        user: 'Ersa Muhasebe (Şevki Gürdal)',
        status: 'current'
      },
      {
        title: 'Depo & Hazırlık',
        description: 'Ürünlerin paketleme ve barkodlama aşaması.',
        date: 'Bekleniyor',
        user: 'Ersa Lojistik',
        status: 'pending'
      },
      {
        title: 'Sevkiyat & İrsaliye',
        description: 'Kargo / Kendi araç filomuzla teslimat.',
        date: 'Bekleniyor',
        user: 'Ersa Sevk Amiri',
        status: 'pending'
      }
    ]
  },
  {
    id: 'ord-27982',
    orderNumber: '27982',
    date: '15.08.2026 10:15',
    source: 'Web',
    orderType: 'Grup Siparişi',
    status: 'sevkiyatta',
    statusText: 'Sevkiyatta (Yolda)',
    dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
    items: [
      {
        productId: 'ersa-708010001',
        productCode: '708010001',
        productName: 'VALUE VDG-S1 Dijital Akıllı Manometre Seti',
        productImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
        quantity: 2,
        shippedQuantity: 2,
        unitPriceTRY: 6200.00,
        totalTRY: 12400.00,
        pim: 1,
        status: 'Sevkiyatta'
      },
      {
        productId: 'ersa-708010002',
        productCode: '708010002',
        productName: 'VALUE V-i220SV 2 CFM Manyetik Solenoidli Vakum Pompası',
        productImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
        quantity: 2,
        shippedQuantity: 2,
        unitPriceTRY: 7450.00,
        totalTRY: 14900.00,
        pim: 1,
        status: 'Sevkiyatta'
      }
    ],
    subtotalTRY: 27300.00,
    discountTRY: 5460.00,
    vatTRY: 4368.00,
    totalTRY: 26208.00,
    orderNote: 'Yurtiçi Kargo Takip No: 938271049281',
    accountingNote: 'Kredi kartı tek çekim tahsil edildi.',
    shippingAddress: 'Kazım Karabekir Mah. İstasyon Cad. No:84 Darıca / Kocaeli',
    history: [
      {
        title: 'Sipariş Oluşturuldu',
        description: 'Web üzerinden verildi.',
        date: '15.08.2026 10:15',
        user: 'ERSA TİCARET',
        status: 'completed'
      },
      {
        title: 'Muhasebe Onayı',
        description: 'Ödeme teyit edildi.',
        date: '15.08.2026 10:40',
        user: 'Halis Tosun',
        status: 'completed'
      },
      {
        title: 'Depo & Hazırlık',
        description: 'Ambalajlandı ve faturası kesildi.',
        date: '15.08.2026 14:10',
        user: 'Emre Kargı',
        status: 'completed'
      },
      {
        title: 'Kargoya Verildi',
        description: 'Yurtiçi Kargo kuryesine teslim edildi.',
        date: '16.08.2026 09:30',
        user: 'Kargo Servisi',
        status: 'completed'
      }
    ]
  },
  {
    id: 'ord-27610',
    orderNumber: '27610',
    date: '02.08.2026 16:50',
    source: 'Temsilci',
    orderType: 'Standart Sipariş',
    status: 'tamamlandi',
    statusText: 'Teslim Edildi (Tamamlandı)',
    dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
    items: [
      {
        productId: 'ersa-705010001',
        productCode: '705010001',
        productName: 'Ersa Soğuk Oda Tavan Tipi Evaporatör 2.5 kW',
        productImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        quantity: 2,
        shippedQuantity: 2,
        unitPriceTRY: 14500.00,
        totalTRY: 29000.00,
        pim: 1,
        status: 'Teslim Edildi'
      }
    ],
    subtotalTRY: 29000.00,
    discountTRY: 5800.00,
    vatTRY: 4640.00,
    totalTRY: 27840.00,
    orderNote: 'Ersa sevkiyat aracı ile adrese teslim edildi.',
    accountingNote: 'Cari hesaba işlendi.',
    shippingAddress: 'Kazım Karabekir Mah. İstasyon Cad. No:84 Darıca / Kocaeli',
    history: [
      {
        title: 'Sipariş Oluşturuldu',
        description: 'Bölge Satış Temsilcisi tarafından girildi.',
        date: '02.08.2026 16:50',
        user: 'Saha Satış (Emin Kargı)',
        status: 'completed'
      },
      {
        title: 'Teslim Edildi',
        description: 'İmzalı sevk irsaliyesi ile teslim tamamlandı.',
        date: '03.08.2026 11:20',
        user: 'Ersa Lojistik',
        status: 'completed'
      }
    ]
  }
];
