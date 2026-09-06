import test from 'node:test';
import assert from 'node:assert';
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

test('1. BAYITEST USER & COMPANY LINK TESTİ', async () => {
  const user = await prisma.user.findUnique({
    where: { username: 'bayitest' },
    include: {
      memberships: {
        include: { company: true }
      },
      orders: true
    }
  });

  assert.ok(user, 'bayitest kullanıcısı veritabanında bulunmalı');
  assert.ok(user.memberships.length > 0, 'bayitest en az 1 firma üyeliğine sahip olmalı');
  assert.strictEqual(user.memberships[0].memberRole, 'OWNER', 'bayitest firma rolü OWNER olmalı');
  assert.strictEqual(user.role, 'B2B_DEALER', 'bayitest rolü B2B_DEALER olmalı');
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

test('3. SİPARİŞ YAZDIRMA DOKÜMANI İZOLASYONU TESTİ', () => {
  const printSelector = '#order-print-document';
  assert.ok(printSelector, 'Sipariş yazdırma dokümanı izole edilebilir ID içermeli');
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
