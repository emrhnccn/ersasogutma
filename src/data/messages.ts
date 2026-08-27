import { PortalMessage } from '@/types';

export const MESSAGES: PortalMessage[] = [
  {
    id: 'msg-01',
    code: 'MES-2026-089',
    sender: 'Şevki GÜRDAL (Finans Müdürü)',
    recipient: 'ERSA TİCARET',
    department: 'Finans & Muhasebe',
    subject: '2026 Yılı 1. Çeyrek Cari Bakiye ve Çek Mutabakatı',
    content: 'Sayın Yetkili, cari hesabınızdaki alacak bakiyeniz ve önümüzdeki vadedeki çekleriniz sistemimize işlenmiştir. Ekstrenizi Cari Hareketler modülünden PDF olarak indirebilirsiniz. İyi çalışmalar dileriz.',
    date: '24.08.2026 11:15',
    isRead: false,
    type: 'inbox'
  },
  {
    id: 'msg-02',
    code: 'MES-2026-074',
    sender: 'Emre KARGI (Satış & Operasyon)',
    recipient: 'ERSA TİCARET',
    department: 'Satış Operasyon',
    subject: 'Yeni R134a ve R404A Gaz Sevkiyatı Hakkında',
    content: 'Değerli Bayimiz, yeni ithal ettiğimiz yüksek saflıktaki Ersa Soğutucu Gaz tüpleri stoklarımıza girmiştir. Toplu alımlarda koli bazlı ekstra %5 iskonto tanımlanmıştır. Siparişinizi Toplu Liste ekranından iletebilirsiniz.',
    date: '18.08.2026 09:40',
    isRead: true,
    type: 'inbox'
  },
  {
    id: 'msg-03',
    code: 'MES-2026-052',
    sender: 'ERSA TİCARET',
    recipient: 'Halis TOSUN (Lojistik Amiri)',
    department: 'Depo & Sevkiyat',
    subject: 'Sipariş No: 28004 Özel Paletleme Talebi',
    content: 'Merhaba, 28004 numaralı siparişimizdeki evaporatör ve gaz tüplerinin Darıca şubemize ulaştırılmadan önce ahşap kafes korumasıyla sevk edilmesini rica ediyoruz.',
    date: '20.08.2026 15:00',
    isRead: true,
    type: 'sent'
  }
];

export const STAFF_RECIPIENTS = [
  { id: 'sevki-gurdal', name: 'Şevki GÜRDAL', role: 'Finans ve Muhasebe Müdürü' },
  { id: 'emre-kargi', name: 'Emre KARGI', role: 'Satış ve Pazarlama Müdürü' },
  { id: 'emin-kargi', name: 'Emin KARGI', role: 'Genel Müdür / Yönetim' },
  { id: 'halis-tosun', name: 'Halis TOSUN', role: 'Depo ve Lojistik Amiri' },
  { id: 'teknik-destek', name: 'Teknik Servis & Garanti Birimi', role: 'Teknik Destek' }
];
