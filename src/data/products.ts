import { Product } from '@/types';

export const INITIAL_EXCHANGE_RATES = {
  USD_TRY: 38.45,
  EUR_TRY: 42.10,
  GBP_TRY: 48.90,
  lastUpdated: ''
};

// Initial base products (fallback when DB is empty, automatically synced with DB via /api/products)
export const PRODUCTS: Product[] = [
  {
    id: 'prod-emb-6144',
    code: 'EMB-6144GK',
    name: 'Embraco Aspera EMT6144GK R134a 1/5 HP HMBP Hermetik Kompresör',
    category: 'Kompresörler',
    brand: 'Embraco',
    pim: 1,
    priceTRY: 3850,
    priceUSD: 100.13,
    priceEUR: 91.45,
    originalCurrency: 'TRY',
    stock: 45,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    unit: 'Adet',
    description: 'Ticari soğutucular ve tezgah tipi buzdolapları için yüksek verimli R134a gazlı orijinal Embraco hermetik soğutma kompresörü.',
    specifications: {
      'Gaz Tipi': 'R134a',
      'Motor Gücü': '1/5 HP',
      'Voltaj': '220-240V / 50Hz',
      'Uygulama': 'HMBP (Orta/Yüksek Basınç)',
      'Menşei': 'Brezilya / Slovakya'
    },
    barcode: '869001014401',
    isNew: true
  },
  {
    id: 'prod-dan-sc15g',
    code: 'DAN-SC15G',
    name: 'Secop (Danfoss) SC15G R134a 3/8 HP Üniversal Soğutma Kompresörü',
    category: 'Kompresörler',
    brand: 'Danfoss',
    pim: 1,
    priceTRY: 6200,
    priceUSD: 161.25,
    priceEUR: 147.27,
    originalCurrency: 'TRY',
    stock: 28,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
    unit: 'Adet',
    description: 'Şişe soğutucular, market reyonları ve endüstriyel soğutma dolapları için dayanıklı Danfoss/Secop kompresör.',
    specifications: {
      'Gaz Tipi': 'R134a',
      'Motor Gücü': '3/8 HP',
      'Silindir Hacmi': '15.28 cm³',
      'Voltaj': '220-240V 50Hz'
    },
    barcode: '869001014402',
    isOpportunity: true
  },
  {
    id: 'prod-gaz-r134a',
    code: 'DUP-R134A',
    name: 'DuPont / Chemours R134a Orijinal Soğutucu Gaz Tüpü (13.6 Kg Net)',
    category: 'Soğutucu Gazlar',
    brand: 'DuPont',
    pim: 1,
    priceTRY: 4950,
    priceUSD: 128.74,
    priceEUR: 117.58,
    originalCurrency: 'TRY',
    stock: 120,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop&q=80',
    unit: 'Tüp',
    description: '%99.99 safiyette orijinal Chemours R134a gaz tüpü. Emniyet ventilli, güvenlik hologramlı kapak.',
    specifications: {
      'Net Ağırlık': '13.6 Kg',
      'Saflık': '%99.99',
      'Kullanım Alanı': 'Oto Klima & Ev/Ticari Soğutma'
    },
    barcode: '869001014403',
    isNew: true
  },
  {
    id: 'prod-gaz-r404a',
    code: 'DUP-R404A',
    name: 'DuPont / Chemours R404A Soğutucu Gaz Tüpü (10.9 Kg Net)',
    category: 'Soğutucu Gazlar',
    brand: 'DuPont',
    pim: 1,
    priceTRY: 5600,
    priceUSD: 145.64,
    priceEUR: 133.02,
    originalCurrency: 'TRY',
    stock: 65,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop&q=80',
    unit: 'Tüp',
    description: 'Düşük ve orta sıcaklık ticari soğutma sistemleri (derin dondurucu, soğuk oda) için R404A gaz tüpü.',
    specifications: {
      'Net Ağırlık': '10.9 Kg',
      'Uygulama': 'Soğuk Hava Depoları & Reyonlar'
    },
    barcode: '869001014404'
  },
  {
    id: 'prod-ebm-fan16',
    code: 'EBM-M4Q045',
    name: 'Ebm-papst M4Q045-BD01-01 16W / 70W Üniversal Aksiyel Fan Motoru',
    category: 'Fan Motorları',
    brand: 'Ebm-papst',
    pim: 1,
    priceTRY: 1150,
    priceUSD: 29.91,
    priceEUR: 27.32,
    originalCurrency: 'TRY',
    stock: 90,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    unit: 'Adet',
    description: 'Kondenser ve evaporatör üniteleri için 5 ayaklı alüminyum gövde üniversal fan motoru.',
    specifications: {
      'Çıkış Gücü': '16 Watt',
      'Giriş Gücü': '70 Watt',
      'Devir': '1300 RPM',
      'Gerilim': '230V / 50Hz'
    },
    barcode: '869001014405'
  },
  {
    id: 'prod-eli-961',
    code: 'ELI-IDPLUS961',
    name: 'Eliwell IDPlus 961 220V Dijital Sıcaklık Kontrol Cihazı (NTC/PTC)',
    category: 'Termostatlar & Kontrol',
    brand: 'Eliwell',
    pim: 1,
    priceTRY: 1650,
    priceUSD: 42.91,
    priceEUR: 39.19,
    originalCurrency: 'TRY',
    stock: 55,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
    unit: 'Adet',
    description: 'Statik soğutma üniteleri için tek röleli dijital termostat. 1 adet NTC prob dahildir.',
    specifications: {
      'Röle Çıkışı': '1x 2HP Röle',
      'Besleme': '230V AC',
      'Sensör Girişi': '1x NTC / PTC Girişi'
    },
    barcode: '869001014406'
  },
  {
    id: 'prod-cas-drayer',
    code: 'CAS-DB083S',
    name: 'Castel 083S 3/8 Kaynaklı Moleküler Elek Filtre Drayer',
    category: 'Drayer & Filtreler',
    brand: 'Castel',
    pim: 5,
    priceTRY: 420,
    priceUSD: 10.92,
    priceEUR: 9.98,
    originalCurrency: 'TRY',
    stock: 180,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop&q=80',
    unit: 'Adet',
    description: 'Sıvı hattındaki nemi ve asidi tutmak için 100% moleküler elekli İtalyan Castel kaynaklı drayer filtre.',
    specifications: {
      'Bağlantı Çapı': '3/8 İnç (Kaynaklı ODF)',
      'Gövde': 'Katı Çekirdek (Solid Core)',
      'Menşei': 'İtalya'
    },
    barcode: '869001014407'
  },
  {
    id: 'prod-val-vakum',
    code: 'VAL-VE115N',
    name: 'Value VE115N 51 Lt/Dk Tek Kademeli Profesyonel Vakum Pompası',
    category: 'Servis Ekipmanları',
    brand: 'Value',
    pim: 1,
    priceTRY: 4250,
    priceUSD: 110.53,
    priceEUR: 100.95,
    originalCurrency: 'TRY',
    stock: 22,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    unit: 'Adet',
    description: 'R134a, R410A, R404A sistemleri için taşınabilir, yüksek vakum güçlü hafif servis pompası.',
    specifications: {
      'Debi': '51 L/dk (1.8 CFM)',
      'Vakum Gücü': '150 Micron',
      'Motor Gücü': '1/4 HP',
      'Yağ Kapasitesi': '250 ml'
    },
    barcode: '869001014408',
    isNew: true
  }
];
