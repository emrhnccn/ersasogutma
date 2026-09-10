'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { X, ShoppingCart, Star, ShieldCheck, CheckCircle2, Copy, Check, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StockBadge } from '@/components/common/StockBadge';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addToCart, toggleFavorite, isFavorite, convertPrice, profile, showToast } = useStore();
  const [quantity, setQuantity] = useState(product ? (product.stock > 0 ? Math.min(product.stock, product.pim || 1) : (product.pim || 1)) : 1);
  const [copiedCode, setCopiedCode] = useState(false);

  // Quick PİM Edit
  const [currentPim, setCurrentPim] = useState(product?.pim || 1);
  const [isEditingPim, setIsEditingPim] = useState(false);
  const [tempPim, setTempPim] = useState((product?.pim || 1).toString());
  const [savingPim, setSavingPim] = useState(false);

  if (!product) return null;

  const handleSavePimModal = async () => {
    const parsed = parseInt(tempPim, 10);
    if (isNaN(parsed) || parsed < 1) return;
    setSavingPim(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minOrderQty: parsed })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPim(parsed);
        product.pim = parsed;
        setIsEditingPim(false);
        showToast(`PİM sayısı ${parsed} Adet olarak güncellendi!`, 'success');
      } else {
        showToast(data.error || 'PİM güncellenemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    } finally {
      setSavingPim(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(product.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  const discountedPriceTRY = product.priceTRY * (1 - (profile.discountRate || 0.20));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left: Big Product Image */}
        <div className="md:w-1/2 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'}
            alt={product.name}
            className="w-full max-h-72 object-contain rounded-xl shadow-md"
            onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'; }}
          />
          {product.isNew && (
            <span className="absolute top-4 left-4 bg-emerald-500 text-white dark:text-slate-950 font-black text-xs px-2.5 py-1 rounded-md shadow-xs">
              YENİ ÜRÜN
            </span>
          )}
          <button
            onClick={() => toggleFavorite(product.id)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/90 dark:bg-slate-800/80 text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs border border-slate-200 dark:border-slate-700 transition"
          >
            <Star className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Right: Technical Specs & Add to Cart */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-700 dark:text-sky-400 font-bold bg-blue-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-blue-200 dark:border-sky-800">
                  Kod: {product.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  title="Kodu Kopyala"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug mb-2">
              {product.name}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap">
              <span>Marka: <strong className="text-slate-800 dark:text-slate-200">{product.brand}</strong></span>
              <span>•</span>
              {isEditingPim ? (
                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-sky-500">
                  <span className="text-[10px] text-slate-400">PİM:</span>
                  <input
                    type="number"
                    min={1}
                    autoFocus
                    value={tempPim}
                    onChange={(e) => setTempPim(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePimModal();
                      if (e.key === 'Escape') setIsEditingPim(false);
                    }}
                    className="w-12 bg-transparent text-center font-mono font-bold text-xs text-sky-500 dark:text-sky-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">{product.unit}</span>
                  <button
                    type="button"
                    disabled={savingPim}
                    onClick={handleSavePimModal}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPim(false)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTempPim(currentPim.toString());
                    setIsEditingPim(true);
                  }}
                  className="inline-flex items-center gap-1 hover:text-sky-500 transition cursor-pointer group/pim"
                  title="PİM Sayısını Değiştir"
                >
                  <span>PİM: <strong className="text-blue-600 dark:text-sky-400">{currentPim} {product.unit}</strong></span>
                  <Edit className="w-3 h-3 opacity-60 group-hover/pim:opacity-100 text-sky-500" />
                </button>
              )}
              <span>•</span>
              <StockBadge stock={product.stock} unit={product.unit} />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {product.description}
            </p>

            {/* Specifications Table */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 mb-4 text-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Teknik Özellikler
              </div>
              <div className="space-y-1.5">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-0.5 border-b border-slate-200/60 dark:border-slate-900 last:border-0">
                    <span className="text-slate-500 dark:text-slate-400">{key}:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dealer Notice */}
            <div className="flex items-start gap-2 bg-blue-50/50 dark:bg-sky-950/30 p-3 rounded-xl border border-blue-100 dark:border-sky-900/50 text-slate-600 dark:text-slate-400 text-xs leading-normal mb-4">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <span>
                Ersa Soğutma kurumsal B2B bayi garantisi altındadır. Faturalı ve orijinal yedek parçadır.
              </span>
            </div>
          </div>

          {/* Pricing & Quantity Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {(!product.priceTRY || product.priceTRY <= 0) ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <div className="text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center gap-2">
                  <span>Fiyat Bekleniyor</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bu ürün için güncel tedarikçi ve bayi fiyatı belirlenme aşamasındadır. Sipariş için lütfen müşteri temsilcinizle iletişime geçiniz.
                </p>
                <div className="pt-2">
                  <button
                    disabled
                    className="w-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                  >
                    Fiyat İçin İletişime Geçiniz
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5 font-medium">B2B Net Bayi Fiyatı:</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrency(discountedPriceTRY)}
                      <span className="text-xs font-normal text-slate-400 ml-1.5">+ KDV</span>
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-500 dark:text-slate-400">
                    {convertPrice(discountedPriceTRY).formatted}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={product.stock > 0 ? product.stock : undefined}
                      step={1}
                      value={quantity}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        let val = isNaN(raw) ? 1 : raw;
                        if (val < 1) val = 1;
                        if (product.stock > 0 && val > product.stock) {
                          val = product.stock;
                        }
                        setQuantity(val);
                      }}
                      className="w-12 bg-transparent text-center font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => {
                        const next = q + 1;
                        return product.stock > 0 ? Math.min(product.stock, next) : next;
                      })}
                      className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition transform active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Sepete Ekle ({quantity} {product.unit})</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
