'use client';

import React, { useState } from 'react';
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
  Building,
  AlertCircle,
  HelpCircle,
  Truck
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
    completeOrder,
    profile
  } = useStore();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      // Trigger confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      const createdOrder = completeOrder();
      setShowConfirmModal(false);
      setIsSubmitting(false);
      router.push(`/bayi/siparisler/${createdOrder.orderNumber}`);
    }, 600);
  };

  if (cart.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-sky-400 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sepetiniz Boş</h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
          Sepetinizde henüz ürün bulunmuyor. Ersa Soğutma ürün kataloğundan veya toplu liste ekranından ürün ekleyebilirsiniz.
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
            Sepetinizdeki ürünleri kontrol edip bayi siparişinizi onaylayabilirsiniz.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Cart Items Table + Notes */}
        <div className="lg:col-span-8 space-y-6">
          
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
                            src={item.product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded bg-slate-950 border border-slate-800 mx-auto"
                            onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'; }}
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
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - minStep)}
                              className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={minStep}
                              step={minStep}
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value) || minStep)}
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

          {/* Notes Section (Matching Girdap Bayi Order Note & Accounting Note fields) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Sipariş & Muhasebe Notları</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sipariş / Sevkiyat Notunuz (Lojistik Ekibine):
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
                  placeholder="Örn: 60 gün vadeli cari hesaba virman edilsin, e-arşiv fatura muhasebe mailimize gönderilsin..."
                  value={accountingNote}
                  onChange={(e) => setAccountingNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary (Sipariş Özeti) */}
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
                    {formatCurrency(cartTotals.grandTotalTRY)}
                  </div>
                  <span className="text-[10px] text-slate-400">KDV Dahil Net Tutar</span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>Teslimat Adresi (Kayıtlı Bayi Adresi):</span>
              </div>
              <p className="text-slate-400 line-clamp-2">{profile.address}</p>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-xl shadow-emerald-900/40 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>SİPARİŞİ TAMAMLA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cari hesap veya Sanal POS ile güvenli B2B sipariş</span>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal (Matches Girdap Bayi: "Hayır, vazgeçtim / Evet, Onayla!") */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">
              Siparişi Onaylıyor musunuz?
            </h3>

            <p className="text-xs text-slate-300 mb-4">
              Toplam <strong className="text-emerald-400 font-mono">{formatCurrency(cartTotals.grandTotalTRY)}</strong> tutarındaki siparişiniz Ersa Soğutma Satış & Muhasebe birimine iletilecektir.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-1 mb-5">
              <div className="flex justify-between text-slate-400">
                <span>Bayi:</span>
                <span className="font-bold text-white">{profile.companyName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Ödeme Şekli:</span>
                <span className="font-bold text-sky-400">Cari Hesap Virman (60 Gün Vade)</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Hayır, vazgeçtim
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>İşleniyor...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Evet, Onayla!</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
