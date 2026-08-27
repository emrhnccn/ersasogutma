'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { X, ShoppingCart, Star, ShieldCheck, CheckCircle2, Copy, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addToCart, toggleFavorite, isFavorite, convertPrice, profile } = useStore();
  const [quantity, setQuantity] = useState(product ? product.pim || 1 : 1);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!product) return null;

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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left: Big Product Image */}
        <div className="md:w-1/2 bg-slate-950 p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-800">
          <img
            src={product.image}
            alt={product.name}
            className="w-full max-h-72 object-contain rounded-xl shadow-lg"
          />
          {product.isNew && (
            <span className="absolute top-4 left-4 bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-md shadow">
              YENİ ÜRÜN
            </span>
          )}
          <button
            onClick={() => toggleFavorite(product.id)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-amber-400 hover:bg-slate-700 transition"
          >
            <Star className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Right: Technical Specs & Add to Cart */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-sky-400 font-bold bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  Kod: {product.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-slate-400 hover:text-white"
                  title="Kodu Kopyala"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-black text-white leading-snug mb-2">
              {product.name}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
              <span>Marka: <strong className="text-slate-200">{product.brand}</strong></span>
              <span>•</span>
              <span>PİM: <strong className="text-sky-400">{product.pim} {product.unit}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Stokta {product.stock} {product.unit}</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {product.description}
            </p>

            {/* Specifications Table */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 mb-4 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Teknik Özellikler
              </div>
              <div className="space-y-1.5">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-0.5 border-b border-slate-900 last:border-0">
                    <span className="text-slate-400">{key}:</span>
                    <span className="text-slate-200 font-medium text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Quantity Actions */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-[11px] text-slate-400 line-through mr-2">
                  Liste: {formatCurrency(product.priceTRY)}
                </span>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {formatCurrency(discountedPriceTRY)}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  %{profile.discountRate * 100} Bayi İskontolu Fiyat
                </span>
              </div>
              <div className="text-right text-xs font-mono text-slate-400">
                {convertPrice(discountedPriceTRY).formatted}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(product.pim || 1, q - (product.pim || 1)))}
                  className="px-2.5 py-1 text-slate-300 hover:text-white font-bold text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  min={product.pim || 1}
                  step={product.pim || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.pim || 1, parseInt(e.target.value) || (product.pim || 1)))}
                  className="w-12 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + (product.pim || 1))}
                  className="px-2.5 py-1 text-slate-300 hover:text-white font-bold text-sm"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Sepete Ekle ({quantity} {product.unit})</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
