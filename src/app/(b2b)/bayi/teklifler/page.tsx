'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import {
  FileText,
  Plus,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  Calendar,
  AlertCircle,
  Building,
  User,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Quote } from '@/types';

export default function QuotesPage() {
  const { quotes, cart, cartTotals, createQuote, convertQuoteToOrder, profile, showToast } = useStore();

  const [showNewModal, setShowNewModal] = useState(false);
  const [validDays, setValidDays] = useState('15');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const handleCreateNewQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Teklif oluşturmak için önce sepetinize ürün ekleyiniz.', 'warning');
      return;
    }

    const now = new Date();
    const days = parseInt(validDays, 10) || 15;
    now.setDate(now.getDate() + days);
    const validUntilFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

    const newQuote = createQuote({
      validUntil: validUntilFormatted,
      notes: quoteNotes || undefined
    });

    setShowNewModal(false);
    setQuoteNotes('');
    setSelectedQuote(newQuote);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>B2B Fiyat Teklif & Proforma Yönetimi</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Tekliflerim & Proformalar</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Müşterileriniz ve projeleriniz için hazırladığınız teklifleri yönetin ve tek tıkla siparişe dönüştürün.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Sepetten Yeni Teklif Oluştur</span>
        </button>
      </div>

      {/* Quotes List & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quotes List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Kayıtlı Teklifler ({quotes.length})
          </h3>

          {quotes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <FileText className="w-10 h-10 text-slate-700 mx-auto" />
              <p>Kayıtlı teklifiniz bulunmamaktadır.</p>
              <p className="text-[11px]">Sepetinizdeki ürünlerle anında resmi proforma teklif üretebilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuote(q)}
                  className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl cursor-pointer transition text-xs space-y-2 ${
                    selectedQuote?.id === q.id ? 'border-purple-500 bg-purple-950/20 shadow-md' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-400">#{q.quoteNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      q.status === 'Aktif' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {q.status}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Tarih: {q.date}</span>
                    <span>Vade: {q.validUntil}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 font-bold">
                    <span className="text-slate-400">{q.items.length} Kalem</span>
                    <span className="font-mono text-white text-sm">{formatCurrency(q.totalTRY)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Selected Quote Detail & Print Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-6">
          {selectedQuote ? (
            <div className="space-y-6">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="text-[10px] text-purple-400 font-bold uppercase">Proforma Teklif Belgesi</div>
                  <h2 className="text-lg font-black font-mono text-white">#{selectedQuote.quoteNumber}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition"
                    title="Yazdır / PDF Olarak Kaydet"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => convertQuoteToOrder(selectedQuote.id)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Siparişe Dönüştür</span>
                  </button>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-[#0B1120] p-4 rounded-xl border border-slate-200 dark:border-slate-800 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Teklifi Veren</span>
                  <strong className="text-white block mt-0.5">ERSA SOĞUTMA ISITMA SAN. TİC. LTD. ŞTİ.</strong>
                  <span className="text-slate-400 text-[11px]">Darıca / Kocaeli • V.D: 345091827</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Teklif Verilen Bayi</span>
                  <strong className="text-white block mt-0.5">{selectedQuote.dealerName}</strong>
                  <span className="text-slate-400 text-[11px]">Bayi Kodu: {selectedQuote.dealerCode}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Stok Kodu & Ürün</th>
                      <th className="p-3 text-center">Miktar</th>
                      <th className="p-3">Birim Fiyat</th>
                      <th className="p-3 text-right">Toplam (TL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60 font-medium">
                    {selectedQuote.items.map((i, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{i.productName}</div>
                          <span className="font-mono text-sky-400 text-[10px]">{i.productCode}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold">{i.quantity}</td>
                        <td className="p-3 font-mono text-slate-400">{formatCurrency(i.unitPriceTRY)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(i.totalTRY)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 dark:bg-[#0B1120] p-4 rounded-xl border border-slate-200 dark:border-slate-800 border border-slate-800 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Ara Toplam:</span>
                    <span className="font-mono text-slate-300">{formatCurrency(selectedQuote.subtotalTRY)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Bayi İskontosu:</span>
                    <span className="font-mono text-emerald-400">-{formatCurrency(selectedQuote.discountTRY)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>KDV (%20):</span>
                    <span className="font-mono text-slate-300">{formatCurrency(selectedQuote.vatTRY)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
                    <span className="text-white">Genel Toplam:</span>
                    <span className="font-mono text-base text-emerald-400 font-black">{formatCurrency(selectedQuote.totalTRY)}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs">
              Detaylarını ve yazdırma önizlemesini görmek için sol taraftan bir teklif seçiniz.
            </div>
          )}
        </div>

      </div>

      {/* Modal: New Quote from Cart */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Sepetten Proforma Teklif Oluştur</h3>
            <p className="text-xs text-slate-400">
              Sepetinizde bulunan <strong className="text-sky-300">{cart.length} kalem</strong> ürün için resmi geçerlilik tarihli teklif belgesi hazırlanacaktır.
            </p>

            <form onSubmit={handleCreateNewQuote} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Teklif Geçerlilik Süresi:</label>
                <select
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                >
                  <option value="7">7 Gün Geçerli</option>
                  <option value="15">15 Gün Geçerli (Önerilen)</option>
                  <option value="30">30 Gün Geçerli</option>
                  <option value="60">60 Gün Geçerli</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Müşteri / Proje Notu (Opsiyonel):</label>
                <textarea
                  rows={3}
                  placeholder="Örn: Gültekin Şarküteri Soğuk Oda Montaj Projesi Teklifidir..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition"
                >
                  Teklifi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
