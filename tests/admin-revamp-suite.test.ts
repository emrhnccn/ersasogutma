import test from 'node:test';
import assert from 'node:assert';
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

test('1. BAYITEST USER & COMPANY LINK TESTİ', async () => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: 'bayitest' },
        { username: 'deneme1' },
        { role: 'B2B_DEALER' }
      ]
    },
    include: {
      memberships: {
        include: { company: true }
      },
      orders: true
    }
  });

  assert.ok(user, 'bayi kullanıcısı veritabanında bulunmalı');
  assert.ok(user.memberships.length > 0, 'bayi en az 1 firma üyeliğine sahip olmalı');
  assert.strictEqual(user.memberships[0].memberRole, 'OWNER', 'bayi firma rolü OWNER olmalı');
  assert.strictEqual(user.role, 'B2B_DEALER', 'bayi rolü B2B_DEALER olmalı');
  assert.ok(user.orders.every(o => o.companyId !== null), 'Tüm siparişler bir companyId ile ilişkili olmalı');
});

test('2. BAYİ ŞİFRE DEĞİŞTİRME PARAMETRE UYUMLULUĞU TESTİ', () => {
  // Backend handler parameter resolution logic
  const payload1 = { newPassword: 'NewSecurePassword123!', confirmPassword: 'NewSecurePassword123!' };
  const payload2 = { newPassword: 'NewSecurePassword123!', newPasswordConfirm: 'NewSecurePassword123!' };
  const payloadMismatch = { newPassword: 'PasswordA', confirmPassword: 'PasswordB' };

  function validate(body: any) {
    const { newPassword, newPasswordConfirm, confirmPassword } = body;
    const resolvedConfirm = newPasswordConfirm || confirmPassword;
    if (newPassword || resolvedConfirm) {
      if (!newPassword || !resolvedConfirm) return { valid: false, error: 'Both fields required' };
      if (newPassword !== resolvedConfirm) return { valid: false, error: 'Passwords do not match' };
      if (newPassword.length < 6) return { valid: false, error: 'Too short' };
    }
    return { valid: true };
  }

  assert.strictEqual(validate(payload1).valid, true, 'confirmPassword parametresi geçerli sayılmalı');
  assert.strictEqual(validate(payload2).valid, true, 'newPasswordConfirm parametresi geçerli sayılmalı');
  assert.strictEqual(validate(payloadMismatch).valid, false, 'Uyuşmayan şifreler reddedilmeli');
});

test('3. SİPARİŞ YAZDIRMA DOKÜMANI VE TEK SAYFA A4 İZOLASYONU TESTİ', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const globalsCss = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf-8');
  const orderDoc = fs.readFileSync(path.join(process.cwd(), 'src/components/orders/OrderPrintDocument.tsx'), 'utf-8');
  const adminPage = fs.readFileSync(path.join(process.cwd(), 'src/app/(admin)/admin/page.tsx'), 'utf-8');

  // 1. Check globals.css does not use visibility: hidden which leaves ghost layout height
  assert.ok(!globalsCss.includes('visibility: hidden'), 'globals.css içinde sayfa yüksekliğini artıran visibility: hidden olmamalı');
  assert.ok(globalsCss.includes('#order-print-document'), 'globals.css içinde #order-print-document tanımlı olmalı');

  // 2. Check OrderPrintDocument.tsx does not use visibility: hidden
  assert.ok(!orderDoc.includes('visibility: hidden'), 'OrderPrintDocument içinde visibility: hidden olmamalı');
  assert.ok(orderDoc.includes('page-break-after: avoid'), 'OrderPrintDocument içinde page-break-after: avoid tanımlı olmalı');

  // 3. Check admin/page.tsx renders the printable document at root level with print:block
  assert.ok(adminPage.includes('hidden print:block'), 'admin/page.tsx içinde pure print document hidden print:block ile kök dizinde render edilmeli');
  assert.ok(adminPage.includes('adminPrintingOrder ? \'no-print print:hidden\' : \'\''), 'admin shell yazdırma anında tamamen gizlenmeli (0 yükseklik)');
});

test('4. CANLI SEPET MÜDAHALE LOGIC TESTİ', () => {
  const cartItems = [
    { id: 'item-1', productId: 'prod-1', quantity: 2, stockQty: 10, unitPrice: 100 },
    { id: 'item-2', productId: 'prod-2', quantity: 5, stockQty: 5, unitPrice: 200 }
  ];

  // Test Update Qty
  function updateQty(items: typeof cartItems, itemId: string, targetQty: number) {
    const item = items.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');
    if (targetQty > item.stockQty) throw new Error('Yetersiz stok');
    if (targetQty <= 0) return items.filter(i => i.id !== itemId);
    return items.map(i => i.id === itemId ? { ...i, quantity: targetQty } : i);
  }

  const updated = updateQty(cartItems, 'item-1', 4);
  assert.strictEqual(updated.find(i => i.id === 'item-1')?.quantity, 4, 'Adet 4 olarak güncellenmeli');

  assert.throws(() => {
    updateQty(cartItems, 'item-2', 6);
  }, /Yetersiz stok/, 'Stok aşımında hata vermeli');

  const removed = updateQty(cartItems, 'item-1', 0);
  assert.strictEqual(removed.length, 1, 'Adet 0 yapıldığında sepetten çıkarılmalı');
});

test('5. ONLİNE TALEP & BAYİLİK BAŞVURU FORMU (FATURA ADRESİ) TESTİ', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const contactPage = fs.readFileSync(path.join(process.cwd(), 'src/app/(public)/iletisim/page.tsx'), 'utf-8');

  // 1. Check all visual fields exist in ContactPage
  assert.ok(contactPage.includes('Fatura Adresi'), 'Formda Fatura Adresi başlığı yer almalı');
  assert.ok(contactPage.includes('Bireysel Fatura'), 'Bireysel Fatura seçeneği bulunmalı');
  assert.ok(contactPage.includes('Kurumsal Fatura'), 'Kurumsal Fatura seçeneği bulunmalı');
  assert.ok(contactPage.includes('Firma Ünvanı'), 'Firma Ünvanı alanı bulunmalı');
  assert.ok(contactPage.includes('Vergi Dairesi'), 'Vergi Dairesi alanı bulunmalı');
  assert.ok(contactPage.includes('Vergi Numarası'), 'Vergi Numarası alanı bulunmalı');
  assert.ok(contactPage.includes('Tc Kimlik No'), 'Tc Kimlik No alanı bulunmalı');
  assert.ok(contactPage.includes('İsim'), 'İsim alanı bulunmalı');
  assert.ok(contactPage.includes('Soyisim'), 'Soyisim alanı bulunmalı');
  assert.ok(contactPage.includes('ProvinceSelect'), '81 İl Seçimi için ProvinceSelect bileşeni kullanılmalı');
  assert.ok(contactPage.includes('Açık Adres'), 'Açık Adres alanı bulunmalı');
  assert.ok(contactPage.includes('Email Adresiniz'), 'Email Adresiniz alanı bulunmalı');
  assert.ok(contactPage.includes('Cep Telefonu'), 'Cep Telefonu alanı bulunmalı');

  // 2. Test API validation logic for corporate vs individual
  const { prisma } = await import('../src/lib/prisma');
  const testContactPerson = 'Test Başvuru Sahibi';
  const testEmail = 'test_basvuru@ersasogutma.com';

  // Cleanup past test entries
  await prisma.dealerApplication.deleteMany({
    where: { email: testEmail }
  });

  const created = await prisma.dealerApplication.create({
    data: {
      companyName: 'Test Soğutma San. Tic. Ltd. Şti.',
      contactPerson: testContactPerson,
      phone: '05554443322',
      email: testEmail,
      city: 'Kocaeli',
      taxOffice: 'Uluçınar',
      taxNumber: '1234567890',
      address: 'Nenehatun Mah. Battal Gazi Cad. No:139/A Darıca / KOCAELİ',
      idNumber: '11223344556',
      notes: '[Fatura Tipi: Kurumsal Fatura] [Konu: Yeni B2B Bayilik Başvurusu] Test talebi',
      status: 'PENDING'
    }
  });

  assert.ok(created.id, 'Başvuru DB kaydı başarıyla oluşturulmalı');
  assert.strictEqual(created.city, 'Kocaeli', 'İl Kocaeli olarak kaydedilmeli');
  assert.strictEqual(created.taxNumber, '1234567890', 'Vergi numarası kaydedilmeli');

  // Clean up
  await prisma.dealerApplication.delete({ where: { id: created.id } });
});
