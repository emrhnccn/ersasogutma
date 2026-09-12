import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('KATEGORİ AĞACI, SİPARİŞ RESİMLİ YAZDIRMA VE PDF İNDİRME TESTLERİ', async (t) => {
  const root = process.cwd();

  await t.test('1. OrderPrintDocument - Ürün küçük resmi (thumbnail) ve print CSS kontrolü', () => {
    const docPath = path.join(root, 'src/components/orders/OrderPrintDocument.tsx');
    const content = fs.readFileSync(docPath, 'utf-8');

    // Kontrol: Görsel sütunu tanımlı mı?
    assert.ok(content.includes('<th className="py-2 px-2 w-12 text-center border-r border-slate-200">Görsel</th>'), 'Tablo başlığında Görsel sütunu olmalı');
    
    // Kontrol: Ürün thumbnail img etiketi var mı?
    assert.ok(content.includes('crossOrigin="anonymous"'), 'Görselde crossOrigin="anonymous" olmalı');
    assert.ok(content.includes('itemImg'), 'Satırlarda ürün görseli işlenmeli');
    assert.ok(content.includes('/placeholder.svg'), 'Görsel yoksa placeholder fallback olmalı');

    // Kontrol: Print CSS kuralları
    assert.ok(content.includes('print-color-adjust: exact'), 'Yazıcı çıktısı için print-color-adjust tanımlı olmalı');
  });

  await t.test('2. PDF İndirme Servisi (pdfExport.ts) kontrolü', () => {
    const servicePath = path.join(root, 'src/lib/export/pdfExport.ts');
    assert.ok(fs.existsSync(servicePath), 'pdfExport.ts dosyası mevcut olmalı');
    const content = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(content.includes('downloadElementAsPdf'), 'downloadElementAsPdf fonksiyonu dışa aktarılmalı');
    assert.ok(content.includes('html2canvas'), 'html2canvas dinamik yükleme içermeli');
    assert.ok(content.includes('jsPDF'), 'jsPDF dinamik yükleme içermeli');
    assert.ok(content.includes('scale: 2'), 'Yüksek çözünürlüklü A4 için scale: 2 olmalı');
  });

  await t.test('3. Bayi Sipariş Detay Sayfası - PDF İndir & Yazdır Buton Grubu', () => {
    const pagePath = path.join(root, 'src/app/(b2b)/bayi/siparisler/[id]/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    assert.ok(content.includes('PDF İndir'), 'Sipariş detayında PDF İndir butonu olmalı');
    assert.ok(content.includes('handleDownloadPdf'), 'handleDownloadPdf fonksiyonu tanımlı olmalı');
    assert.ok(content.includes('order-pdf-export'), 'PDF export için hazır DOM konteyneri olmalı');
    assert.ok(content.includes('<Printer'), 'Yazdır butonu korunmalı');
  });

  await t.test('4. Admin Sipariş Önizleme Modalında PDF İndir Butonu', () => {
    const adminPath = path.join(root, 'src/app/(admin)/admin/page.tsx');
    const content = fs.readFileSync(adminPath, 'utf-8');

    assert.ok(content.includes('isAdminDownloadingPdf'), 'Admin sipariş önizlemesinde PDF indirme durumu olmalı');
    assert.ok(content.includes('PDF İndir'), 'Admin sipariş önizleme modalında PDF İndir butonu olmalı');
    assert.ok(content.includes('Hemen Yazdır'), 'Hemen Yazdır butonu korunmalı');
  });

  await t.test('5. Ürün Kataloğu - Görseldeki Tarzda Akordeon Kategori Ağacı', () => {
    const catalogPath = path.join(root, 'src/app/(b2b)/bayi/urunler/page.tsx');
    const content = fs.readFileSync(catalogPath, 'utf-8');

    // Kontrol: Sol sütun kategori ağacı
    assert.ok(content.includes('renderCategoryTree'), 'renderCategoryTree fonksiyonu tanımlı olmalı');
    assert.ok(content.includes('bg-blue-600 text-white shadow-xs'), 'Açık/aktif ana kategori mavi arka plana ve beyaz metne sahip olmalı');
    assert.ok(content.includes('ChevronUp'), 'Açık kategori ChevronUp simgesi içermeli');
    assert.ok(content.includes('ChevronDown'), 'Kapalı kategori ChevronDown simgesi içermeli');
    assert.ok(content.includes('categorySearchQuery'), 'Kategori içi anlık arama desteği olmalı');
    assert.ok(content.includes('mobileCategoryDrawerOpen'), 'Mobil kategori çekmecesi desteği olmalı');

    // Kontrol: Tablo No ve Durum sütunları
    assert.ok(content.includes('>No</th>'), 'Tabloda No sütunu olmalı');
    assert.ok(content.includes('>Durum</th>'), 'Tabloda Durum sütunu olmalı');
    assert.ok(content.includes('rounded-full bg-slate-800') && content.includes('text-[10px] font-bold'), 'No sütununda fotoğraftaki gibi dairesel rozet olmalı');
    assert.ok(content.includes('bg-emerald-500'), 'Stokta olan ürün yeşil durum simgesine sahip olmalı');
  });
});
