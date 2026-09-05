'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Truck,
  CreditCard,
  Building2,
  Landmark,
  Copy,
  Check,
  Loader2,
  Lock,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotals,
    orderNote,
    setOrderNote,
    accountingNote,
    setAccountingNote,
    profile,
    showToast
  } = useStore();

  // Payment Method State: 'CARI' | 'SANAL_POS' | 'HAVALE_EFT'
  const [paymentMethod, setPaymentMethod] = useState<'CARI' | 'SANAL_POS' | 'HAVALE_EFT'>('CARI');

  // Live Cari Limit & Balance from DB
  const [liveCreditLimit, setLiveCreditLimit] = useState(150000);
  const [liveCurrentBalance, setLiveCurrentBalance] = useState(0);
  const [loadingCari, setLoadingCari] = useState(true);

  // Bank Accounts State (EFT / Havale)
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  // Sanal POS Card Form State
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Fetch live cari limit & active bank accounts on mount
  useEffect(() => {
    async function fetchLiveCari() {
      try {
        setLoadingCari(true);
        const res = await fetch('/api/b2b/cari');
        const json = await res.json();
        if (json?.success && json?.data) {
          setLiveCreditLimit(Number(json.data.krediLimiti ?? json.data.creditLimit ?? 150000));
          setLiveCurrentBalance(Number(json.data.cariBakiye ?? json.data.currentBalance ?? 0));
        }
      } catch (err) {
        console.error('Failed to fetch live cari balance:', err);
      } finally {
        setLoadingCari(false);
      }
    }

    async function fetchBankAccounts() {
      try {
        const res = await fetch('/api/bank-accounts?currency=TRY');
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setBankAccounts(json.data);
          if (json.data.length > 0) {
            setSelectedBankId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch bank accounts:', err);
      }
    }

    fetchLiveCari();
    fetchBankAccounts();
  }, []);

  const availableLimit = Math.max(0, liveCreditLimit - liveCurrentBalance);
  const grandTotal = cartTotals.grandTotalTRY;
  const estimatedPostOrderDebt = liveCurrentBalance + grandTotal;
  const remainingLimitAfterOrder = Math.max(0, liveCreditLimit - estimatedPostOrderDebt);
  const isCariLimitInsufficient = paymentMethod === 'CARI' && liveCreditLimit > 0 && grandTotal > availableLimit;

  // Handle Order Submit via POST /api/b2b/orders
  const handleConfirmOrder = async () => {
    setErrorMessage(null);

    // Validate POS fields if Sanal POS selected
    if (paymentMethod === 'SANAL_POS') {
      if (!cardHolder.trim() || cardNumber.replace(/\s/g, '').length < 15 || !cardExpiry.trim() || cardCvv.length < 3) {
        setErrorMessage('Lütfen kart üzerindeki isim, geçerli kart numarası, son kullanma tarihi ve CVV alanlarını eksiksiz doldurunuz.');
        return;
      }
    }

    // Validate Cari limit
    if (isCariLimitInsufficient) {
      setErrorMessage(`Bu sipariş için kullanılabilir cari limitiniz yetersizdir. (Kullanılabilir: ${formatCurrency(availableLimit)}, Sipariş: ${formatCurrency(grandTotal)})`);
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = `ORD-IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const payload = {
        idempotencyKey,
        paymentMethod,
        orderNote,
        accountingNote,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity
        })),
        paymentData: paymentMethod === 'SANAL_POS' ? {
          cardHolder,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardExpiry,
          cardCvv
        } : undefined
      };

      const res = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.success && json.data) {
        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {}

        clearCart();
        setSuccessOrder(json.data);
        showToast(json.message || 'Siparişiniz başarıyla alındı!', 'success');
      } else {
        setErrorMessage(json.error || 'Sipariş oluşturulamadı. Lütfen bilgilerinizi kontrol ediniz.');
        showToast(json.error || 'Sipariş oluşturulamadı', 'error');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMessage('Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (successOrder) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Siparişiniz Başarıyla Alındı!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Sipariş kaydınız oluşturulmuş ve sevkiyat planlamasına dahil edilmiştir.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs text-left space-y-3 font-mono">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Sipariş Numarası:</span>
            <span className="text-sky-400 font-bold text-sm">#{successOrder.orderNo}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Ödeme Yöntemi:</span>
            <span className="text-white font-bold">
              {successOrder.paymentMethod === 'SANAL_POS'
                ? 'Kredi Kartı / Sanal POS (Peşin)'
                : successOrder.paymentMethod === 'HAVALE_EFT'
                ? 'Banka Havalesi / EFT (Onay Bekleniyor)'
                : 'Cari Hesap Virman (Açık Hesap)'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Toplam Tutar:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {formatCurrency(Number(successOrder.grandTotal))}
            </span>
          </div>
          {successOrder.paymentMethod === 'CARI' && (
            <div className="flex justify-between text-cyan-400">
              <span>Güncel Cari Bakiye (Borç):</span>
              <span className="font-bold">
                {formatCurrency(liveCurrentBalance + Number(successOrder.grandTotal))}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => router.push(`/bayi/siparisler/${successOrder.orderNo}`)}
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Sipariş Detayını Görüntüle</span>
          </button>
          <Link
            href="/bayi/urunler"
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <span>Alışverişe Devam Et</span>
          </Link>
        </div>
      </div>
    );
  }

  // EMPTY CART
  if (cart.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-sky-400 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sepetiniz Boş</h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
          Sepetinizde henüz ürün bulunmuyor. Ersa Soğutma ürün kataloğundan ürün ekleyebilirsiniz.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/bayi/urunler"
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-sky-600/30 transition"
          >
            Ürün Kataloğuna Git
          </Link>
          <Link
            href="/bayi/urunler/toplu"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-5 py-2.5 rounded-xl border border-slate-700 transition"
          >
            Hızlı Toplu Sipariş
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Sepetim & Sipariş Tamamla</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sepetinizdeki ürünleri kontrol edip ödeme yönteminizi seçerek siparişinizi onaylayabilirsiniz.
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 p-2 rounded-lg hover:bg-rose-950/30 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>Sepeti Temizle</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-800 p-4 rounded-2xl text-xs text-rose-300 flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-white mb-0.5">Sipariş Onaylanamadı:</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Cart Items Table + Payment Options + Notes */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Cart Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                    <th className="py-3.5 px-4 w-16 text-center">Görsel</th>
                    <th className="py-3.5 px-4 w-28">Ürün Kodu</th>
                    <th className="py-3.5 px-4">Ürün Adı</th>
                    <th className="py-3.5 px-4 w-24">Birim Fiyat</th>
                    <th className="py-3.5 px-4 w-28 text-center">Adet</th>
                    <th className="py-3.5 px-4 w-28 text-right">Toplam</th>
                    <th className="py-3.5 px-4 w-12 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {cart.map((item) => {
                    const minStep = item.product.pim || 1;
                    return (
                      <tr key={item.product.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 text-center">
                          <img
                            src={item.product.image || '/placeholder.svg'}
                            alt={item.product.name}
                            loading="lazy"
                            className="w-12 h-12 object-cover rounded bg-slate-950 border border-slate-800 mx-auto"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-sky-400">
                          {item.product.code}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-white line-clamp-1">{item.product.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Marka: {item.product.brand} • PİM: {item.product.pim} Adet
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-slate-200">
                            {formatCurrency(item.unitPriceTRY)}
                          </div>
                          <div className="text-[10px] text-slate-400 line-through">
                            {formatCurrency(item.product.priceTRY)}
                          </div>
                        </td>

                        {/* Stepper */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, Math.max(minStep, item.quantity - minStep))}
                              className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={minStep}
                              step={minStep}
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.product.id, Math.max(minStep, parseInt(e.target.value) || minStep))}
                              className="w-10 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + minStep)}
                              className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrency(item.totalTRY)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 transition rounded-lg hover:bg-rose-950/30"
                            title="Ürünü Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. PAYMENT METHOD SELECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span>Ödeme Yöntemi Seçimi</span>
              </h3>
              <span className="text-[11px] text-slate-400">Lütfen ödeme şeklini belirleyiniz</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* OPTION A: CARI HESAP */}
              <div
                onClick={() => setPaymentMethod('CARI')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  paymentMethod === 'CARI'
                    ? 'border-sky-500 bg-sky-950/30 shadow-lg shadow-sky-950/50'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentMethod === 'CARI' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Cari Hesaptan Öde</h4>
                      <span className="text-[10px] text-slate-400">Açık Hesap / Vadeli Cari Borç</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'CARI' ? 'border-sky-400 bg-sky-400' : 'border-slate-600'}`}>
                    {paymentMethod === 'CARI' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Tanımlı Limit:</span>
                    <span className="text-slate-200">{formatCurrency(liveCreditLimit)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Mevcut Cari Borç:</span>
                    <span className="text-rose-400 font-bold">{formatCurrency(liveCurrentBalance)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sipariş Tutarı:</span>
                    <span className="text-amber-400 font-semibold">{formatCurrency(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-850">
                    <span className="text-slate-300">Sipariş Sonrası Borç:</span>
                    <span className="text-rose-300 font-bold">{formatCurrency(estimatedPostOrderDebt)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-300 font-semibold">Kullanılabilir Kalan Limit:</span>
                    <span className={`font-bold ${isCariLimitInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(availableLimit)}
                    </span>
                  </div>
                </div>

                {isCariLimitInsufficient && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Cari limitiniz bu sipariş tutarını karşılamıyor.</span>
                  </div>
                )}
              </div>

              {/* OPTION B: SANAL POS / KREDI KARTI */}
              <div
                onClick={() => setPaymentMethod('SANAL_POS')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  paymentMethod === 'SANAL_POS'
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/50'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentMethod === 'SANAL_POS' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Kredi Kartı / Sanal POS</h4>
                      <span className="text-[10px] text-slate-400">3D Secure ile Peşin Tahsilat</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'SANAL_POS' ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'}`}>
                    {paymentMethod === 'SANAL_POS' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1 text-slate-300">
                  <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cari Borç Yansıtılmaz (Peşin Ödeme)</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Tüm ticari ve şahsi kredi kartlarıyla anında güvenli ödeme.
                  </p>
                </div>
              </div>

              {/* OPTION C: HAVALE / EFT */}
              <div
                onClick={() => {
                  if (bankAccounts.length > 0) setPaymentMethod('HAVALE_EFT');
                }}
                className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between space-y-3 ${
                  bankAccounts.length === 0
                    ? 'opacity-60 cursor-not-allowed border-slate-800 bg-slate-950'
                    : paymentMethod === 'HAVALE_EFT'
                    ? 'border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-950/50 cursor-pointer'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentMethod === 'HAVALE_EFT' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Havale / EFT</h4>
                      <span className="text-[10px] text-slate-400">Banka Hesabına Transfer</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'HAVALE_EFT' ? 'border-indigo-400 bg-indigo-400' : 'border-slate-600'}`}>
                    {paymentMethod === 'HAVALE_EFT' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1 text-slate-300">
                  {bankAccounts.length === 0 ? (
                    <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Banka hesabı tanımlı değil (Yakında)</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-indigo-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{bankAccounts.length} Aktif Şirket Hesabı</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Sipariş sonrası dekont ile muhasebe onayı.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sanal POS Card Form (Shown when SANAL_POS is active) */}
            {paymentMethod === 'SANAL_POS' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in-50 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800 pb-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Güvenli Kart Bilgileri (256-Bit SSL)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Kart Üzerindeki İsim:</label>
                    <input
                      type="text"
                      placeholder="AD SOYAD VEYA FİRMA UNVANI"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Kart Numarası:</label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setCardNumber(v.replace(/(\d{4})/g, '$1 ').trim());
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Son Kullanma Tarihi (AA/YY):</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length >= 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                        setCardExpiry(v);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">CVC / CVV:</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="***"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Havale / EFT Bank Accounts Details (Shown when HAVALE_EFT is active) */}
            {paymentMethod === 'HAVALE_EFT' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in-50 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <Landmark className="w-4 h-4" />
                    <span>Şirket Banka Hesaplarımız</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Açıklamaya Sipariş Numaranızı yazınız</span>
                </div>

                <div className="space-y-2.5">
                  {bankAccounts.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBankId(b.id)}
                      className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer ${
                        selectedBankId === b.id
                          ? 'bg-indigo-950/40 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{b.bankName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 uppercase font-mono">
                            {b.currency || 'TRY'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Hesap Sahibi: <span className="text-slate-200 font-medium">{b.accountHolder}</span>
                        </div>
                        <div className="font-mono text-xs text-sky-400 select-all font-semibold">
                          {b.iban}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(b.iban);
                          setCopiedIban(b.id);
                          setTimeout(() => setCopiedIban(null), 2000);
                        }}
                        className="self-start sm:self-center px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition shrink-0"
                      >
                        {copiedIban === b.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Kopyalandı!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>IBAN Kopyala</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Notes Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Sipariş & Muhasebe Notları</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sipariş / Sevkiyat Notunuz:
                </label>
                <textarea
                  rows={3}
                  placeholder="Örn: Hafta içi saat 17:00'den önce depoya teslim edilsin, paletli ambalaj yapılsın..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Muhasebe & Finans Notunuz:
                </label>
                <textarea
                  rows={3}
                  placeholder="Örn: Cari hesap faturası muhasebe mailimize iletilsin..."
                  value={accountingNote}
                  onChange={(e) => setAccountingNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl sticky top-24 space-y-5">
            <h3 className="text-base font-black text-white border-b border-slate-800 pb-3">
              Sipariş Özeti
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Toplam Kalem:</span>
                <span className="font-mono font-semibold text-white">{cart.length} Kalem ({cartTotals.itemCount} Adet)</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Liste Fiyatı Tutarı:</span>
                <span className="font-mono text-slate-300">{formatCurrency(cartTotals.subtotalTRY)}</span>
              </div>

              <div className="flex justify-between text-emerald-400">
                <span>Bayi İskontosu (%{profile.discountRate * 100}):</span>
                <span className="font-mono font-bold">-{formatCurrency(cartTotals.discountTRY)}</span>
              </div>

              <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                <span>Ara Toplam (KDV Hariç):</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(cartTotals.grandTotalTRY - cartTotals.vatTRY)}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Hesaplanan KDV (%20):</span>
                <span className="font-mono">{formatCurrency(cartTotals.vatTRY)}</span>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Genel Toplam:</span>
                <div className="text-right">
                  <div className="text-xl font-black font-mono text-emerald-400">
                    {formatCurrency(grandTotal)}
                  </div>
                  <span className="text-[10px] text-slate-400">KDV Dahil Net Tutar</span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>Teslimat Adresi:</span>
              </div>
              <p className="text-slate-400 line-clamp-2">{profile.address || 'Kayıtlı Bayi Merkezi Teslimatı'}</p>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmitting || isCariLimitInsufficient}
              onClick={handleConfirmOrder}
              className={`w-full font-black text-sm py-3.5 px-4 rounded-xl shadow-xl transition flex items-center justify-center gap-2 ${
                isCariLimitInsufficient
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sipariş İşleniyor...</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'SANAL_POS' ? 'KARTLA GÜVENLİ ÖDE' : 'SİPARİŞİ CARİYE YANSIT'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gerçek zamanlı stok kontrolü ve ERP cari hareket entegrasyonu</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
