'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { BRANDS } from '@/data/categories';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { StockBadge } from '@/components/common/StockBadge';
import {
  FileSpreadsheet,
  Upload,
  Plus,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Download,
  Check,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BulkOrderPage() {
  const { products, addToCart, cartTotals, showToast, profile } = useStore();
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Matrix quantities
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>({});

  // Excel Paste / Upload states
  const [pasteText, setPasteText] = useState('');
  const [parsedRows, setParsedRows] = useState<Array<{ code: string; qty: number; product?: Product; status: 'found' | 'not_found' }>>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const filteredProducts = products.filter((p) => {
    if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  const handleQtyChange = (productId: string, val: number) => {
    setBulkQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, val)
    }));
  };

  const handleAddAllSelected = () => {
    let count = 0;
    Object.entries(bulkQuantities).forEach(([productId, qty]) => {
      if (qty > 0) {
        const prod = products.find((p) => p.id === productId);
        if (prod) {
          addToCart(prod, qty);
          count++;
        }
      }
    });

    if (count > 0) {
      showToast(`${count} farklı ürün toplam adetleriyle sepete eklendi!`, 'success');
      setBulkQuantities({});
    } else {
      showToast('Lütfen en az bir ürün için adet giriniz.', 'warning');
    }
  };

  // Parse Text or CSV/Excel
  const handleParsePaste = () => {
    const lines = pasteText.split('\n').filter((l) => l.trim().length > 0);
    const results = lines.map((line) => {
      // Split by comma, tab, semicolon or space
      const parts = line.split(/[,;\t\s]+/).filter(Boolean);
      const code = parts[0]?.trim();
      const qty = parseInt(parts[1]?.trim()) || 1;

      const product = products.find(
        (p) => p.code.toLowerCase() === code?.toLowerCase() || p.barcode === code
      );

      return {
        code: code || '',
        qty,
        product,
        status: (product ? 'found' : 'not_found') as 'found' | 'not_found'
      };
    });

    setParsedRows(results);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const results: typeof parsedRows = [];
        data.forEach((row, idx) => {
          if (idx === 0 && isNaN(Number(row[1]))) return; // skip header if non numeric
          const code = String(row[0] || '').trim();
          const qty = parseInt(String(row[1] || '1')) || 1;
          if (!code) return;

          const product = products.find(
            (p) => p.code.toLowerCase() === code.toLowerCase() || p.barcode === code
          );

          results.push({
            code,
            qty,
            product,
            status: product ? 'found' : 'not_found'
          });
        });

        setParsedRows(results);
        showToast(`${results.length} satır Excel'den okundu.`);
      } catch (err) {
        showToast('Excel dosyası okunamadı. Lütfen geçerli bir dosya yükleyin.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportParsedToCart = () => {
    let addedCount = 0;
    parsedRows.forEach((row) => {
      if (row.product && row.qty > 0) {
        addToCart(row.product, row.qty);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast(`${addedCount} adet ürün Excel listesinden sepete aktarıldı!`, 'success');
      setShowImportModal(false);
      setParsedRows([]);
      setPasteText('');
    } else {
      showToast('Eşleşen geçerli ürün bulunamadı.', 'warning');
    }
  };

  const downloadSampleTemplate = () => {
    const wsData = [
      ['UrunKodu', 'Adet'],
      ['701010001', 4],
      ['704010001', 3],
      ['703010001', 2],
      ['7011204205', 30]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ErsaSiparisSablonu');
    XLSX.writeFile(wb, 'Ersa_B2B_Siparis_Sablonu.xlsx');
  };

  const totalSelectedItems = Object.values(bulkQuantities).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Excel Import Trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/40 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ersa Soğutma Hızlı Toplu Sipariş Matrisi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Toplu Liste & Excel'den Tek Tıkla Sipariş
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Sık sipariş verdiğiniz soğutma ve servis parçalarını hızlıca adet belirleyerek veya kendi Excel listenizi yükleyerek anında sepete aktarabilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition transform active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Excel / Metin ile Yükle</span>
          </button>
          
          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Örnek Şablon (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Brand Tabs & Instant Filter */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-3xl scrollbar-thin">
            <button
              onClick={() => setSelectedBrand('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                selectedBrand === 'all'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Tüm Markalar
            </button>

            {BRANDS.slice(0, 10).map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex-shrink-0 ${
                  selectedBrand === b.name
                    ? 'bg-sky-600 text-white shadow-md font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Hızlı parça ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Quick Matrix Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Hızlı Sipariş Giriş Tablosu</span>
            <span className="text-slate-500 text-xs ml-2">({filteredProducts.length} Ürün Listeleniyor)</span>
          </div>

          <button
            onClick={handleAddAllSelected}
            disabled={totalSelectedItems === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 ${
              totalSelectedItems > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 cursor-pointer animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Girdiğim {totalSelectedItems} Adet Ürünü Sepete Ekle</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#0B1120] z-10">
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-14 text-center">Görsel</th>
                <th className="py-3 px-4 w-28">Ürün Kodu</th>
                <th className="py-3 px-4">Ürün Adı</th>
                <th className="py-3 px-4 w-28">Marka</th>
                <th className="py-3 px-4 w-16 text-center">PİM</th>
                <th className="py-3 px-4 w-28">Birim Fiyat</th>
                <th className="py-3 px-4 w-20 text-center">Stok</th>
                <th className="py-3 px-4 w-32 text-center bg-slate-100 dark:bg-slate-900 border-l border-r border-slate-200 dark:border-slate-800">
                  Sipariş Adedi
                </th>
                <th className="py-3 px-4 w-28 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-200">
              {filteredProducts.map((p) => {
                const qty = bulkQuantities[p.id] || 0;
                const discountedPrice = p.priceTRY * (1 - (profile.discountRate || 0.20));
                const lineTotal = qty * discountedPrice;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-800/60 transition ${
                      qty > 0 ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-2 px-4 text-center">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 mx-auto"
                      />
                    </td>
                    <td className="py-2 px-4 font-mono font-bold text-sky-400">
                      {p.code}
                    </td>
                    <td className="py-2 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">OEM: {p.oemCode || '-'}</div>
                    </td>
                    <td className="py-2 px-4 text-slate-300">{p.brand}</td>
                    <td className="py-2 px-4 text-center font-mono text-slate-400">{p.pim}</td>
                    <td className="py-2 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(discountedPrice)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <StockBadge stock={p.stock} unit={p.unit} size="sm" showIcon={false} />
                    </td>

                    {/* Fast Direct Number Input */}
                    <td className="py-2 px-4 text-center bg-slate-50 dark:bg-slate-950/60 border-l border-r border-slate-800">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(p.id, Math.max(0, qty - (p.pim || 1)))}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          step={p.pim || 1}
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={(e) => handleQtyChange(p.id, parseInt(e.target.value) || 0)}
                          className={`w-14 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded py-1 text-center font-mono font-bold text-xs text-slate-900 dark:text-white focus:outline-none transition ${
                            qty > 0 ? 'border-emerald-500 text-emerald-400 ring-1 ring-emerald-500' : 'border-slate-700 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyChange(p.id, qty + (p.pim || 1))}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="py-2 px-4 text-right font-mono font-bold text-slate-200">
                      {qty > 0 ? formatCurrency(lineTotal) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bottom Cart Bar (Screenshot 2 Toplu Liste reference) */}
      <div className="fixed bottom-4 right-4 sm:right-8 z-30 flex items-center gap-3">
        <Link
          href="/bayi/siparisler/sepet"
          className="bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-sky-500/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 transition transform hover:-translate-y-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 flex items-center justify-center relative">
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartTotals.itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-slate-900">
                {cartTotals.itemCount}
              </span>
            )}
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Toplam Sepet Tutarı</div>
            <div className="text-sm font-black font-mono text-emerald-400">
              {formatCurrency(cartTotals.grandTotalTRY)}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-sky-400 ml-1" />
        </Link>
      </div>

      {/* Excel / Paste Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-xs rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Excel veya Metin ile Toplu Sipariş Yükleme</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              
              {/* Option 1: File Upload */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-950/50 transition">
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Excel (.xlsx, .xls) veya CSV Dosyası Yükleyin
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Sütun 1: Ürün Kodu | Sütun 2: Sipariş Adedi
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[11px] text-slate-500 font-bold uppercase">VEYA METİN YAPIŞTIRIN</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              {/* Option 2: Paste Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ürün Kodu ve Adetleri Satır Satır Yapıştırın:
                </label>
                <textarea
                  rows={4}
                  placeholder={`701010001, 5\n704010001, 3\n703010001, 2`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
                <button
                  type="button"
                  onClick={handleParsePaste}
                  disabled={!pasteText.trim()}
                  className="mt-2 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  Listeyi Çözümle
                </button>
              </div>

              {/* Preview Table of Parsed Rows */}
              {parsedRows.length > 0 && (
                <div className="border border-slate-800 rounded-xl overflow-hidden mt-3">
                  <div className="bg-slate-100 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-300 flex justify-between border-b border-slate-200 dark:border-slate-800">
                    <span>Çözümlenen Kalemler ({parsedRows.length})</span>
                    <span className="text-emerald-400 font-mono">
                      {parsedRows.filter((r) => r.status === 'found').length} Eşleşti
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {parsedRows.map((row, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/50">
                        <div className="flex items-center gap-2">
                          {row.status === 'found' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-mono font-bold text-sky-400">{row.code}</span>
                            {row.product ? (
                              <span className="text-slate-300 ml-2 line-clamp-1">{row.product.name}</span>
                            ) : (
                              <span className="text-rose-400 ml-2">Ürün katalogda bulunamadı!</span>
                            )}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{row.qty} Adet</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedRows([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Kapat
              </button>

              <button
                type="button"
                onClick={handleImportParsedToCart}
                disabled={parsedRows.filter((r) => r.status === 'found').length === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 ${
                  parsedRows.filter((r) => r.status === 'found').length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Geçerli Ürünleri Sepete Aktar</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
