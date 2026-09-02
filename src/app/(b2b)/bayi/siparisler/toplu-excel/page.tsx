'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';

interface ParsedBatchRow {
  rawCode: string;
  rawQty: number;
  product: Product | null;
  status: 'READY' | 'LOW_STOCK' | 'NOT_FOUND';
  errorMsg?: string;
}

export default function ExcelBatchOrderPage() {
  const router = useRouter();
  const { products, addToCart, profile, showToast } = useStore();

  const [parsedRows, setParsedRows] = useState<ParsedBatchRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // 1. Download CSV / Excel Template
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,stok_kodu,adet\nersa-701010009,10\nersa-7011204205,5\nersa-701010001,2\nersa-70105001,1";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ersa_toplu_siparis_sablonu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Excel/CSV şablonu indirildi.', 'info');
  };

  // 2. Parse uploaded file with security sanitation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Dosya boyutu 5 MB üzerinde olamaz.', 'error');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).map((l) => l.trim()).filter(Boolean);

        const rows: ParsedBatchRow[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip header row if matches stok / code
          if (i === 0 && (line.toLowerCase().includes('stok') || line.toLowerCase().includes('code'))) {
            continue;
          }

          // Split by comma, semicolon or tab
          const parts = line.split(/[,;\t]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
          if (parts.length < 1) continue;

          // Sanitation against CSV Formula Injection
          let rawCode = parts[0] || '';
          if (/^[=+\-@]/.test(rawCode)) {
            rawCode = rawCode.substring(1).trim();
          }

          let rawQty = parts[1] ? parseInt(parts[1], 10) : 1;
          if (isNaN(rawQty) || rawQty <= 0) rawQty = 1;

          // Match in products catalog
          const cleanCode = rawCode.toLowerCase();
          const prod = products.find(
            (p) =>
              p.code.toLowerCase() === cleanCode ||
              p.id.toLowerCase() === cleanCode ||
              (p.barcode && p.barcode.toLowerCase() === cleanCode) ||
              p.name.toLowerCase().includes(cleanCode)
          );

          if (!prod) {
            rows.push({
              rawCode,
              rawQty,
              product: null,
              status: 'NOT_FOUND',
              errorMsg: 'Ürün katalogda bulunamadı'
            });
          } else if (!prod.inStock) {
            rows.push({
              rawCode,
              rawQty,
              product: prod,
              status: 'LOW_STOCK',
              errorMsg: 'Tükendi / Stok Yetersiz'
            });
          } else {
            rows.push({
              rawCode,
              rawQty,
              product: prod,
              status: 'READY'
            });
          }
        }

        setParsedRows(rows);
        showToast(`${rows.length} satır başarıyla işlendi.`);
      } catch {
        showToast('Dosya okunurken format hatası oluştu.', 'error');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
  };

  // 3. Batch Add Ready Products to Cart
  const handleTransferToCart = () => {
    const readyItems = parsedRows.filter((r) => r.status === 'READY' && r.product !== null);
    if (readyItems.length === 0) {
      showToast('Sepete eklenecek hazır ürün bulunamadı.', 'warning');
      return;
    }

    readyItems.forEach((r) => {
      if (r.product) {
        addToCart(r.product, r.rawQty);
      }
    });

    showToast(`${readyItems.length} kalem ürün başarıyla sepete aktarıldı!`, 'success');
    router.push('/bayi/siparisler/sepet');
  };

  const readyCount = parsedRows.filter((r) => r.status === 'READY').length;
  const lowStockCount = parsedRows.filter((r) => r.status === 'LOW_STOCK').length;
  const notFoundCount = parsedRows.filter((r) => r.status === 'NOT_FOUND').length;

  const totalCalculatedNet = parsedRows
    .filter((r) => r.product !== null)
    .reduce((sum, r) => sum + (r.product?.priceTRY || 0) * (1 - profile.discountRate) * r.rawQty, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / CSV Toplu İçe Aktarma</span>
          </div>
          <h1 className="text-2xl font-black text-white">Excel ile Toplu Sipariş Oluşturma</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ERP veya muhasebe programınızdan aldığınız ürün kodu ve adet listesini yükleyerek tek seferde sipariş verin.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Örnek Şablonu İndir (.CSV)</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition">
        <UploadCloud className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">Excel veya CSV Dosyanızı Yükleyin</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          Format: <code className="bg-slate-950 px-2 py-0.5 rounded text-sky-300 font-mono">stok_kodu, adet</code> (Sütun başlıkları desteklenir)
        </p>

        <label className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-950/40 transition">
          <span>Dosya Seçin</span>
          <input
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        {fileName && <span className="block text-xs font-mono text-emerald-400 mt-2">{fileName}</span>}
      </div>

      {/* Preview Section */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
          
          {/* Status Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Toplam Satır</span>
              <span className="text-lg font-black text-white font-mono">{parsedRows.length} Kalem</span>
            </div>
            <div className="bg-slate-950 border border-emerald-900/40 p-3 rounded-xl">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Siparişe Hazır</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{readyCount} Kalem</span>
            </div>
            <div className="bg-slate-950 border border-amber-900/40 p-3 rounded-xl">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Sınırlı / Tükendi</span>
              <span className="text-lg font-black text-amber-400 font-mono">{lowStockCount} Kalem</span>
            </div>
            <div className="bg-slate-950 border border-rose-900/40 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-rose-400 uppercase font-bold block">Bulunamayan Kod</span>
                <span className="text-lg font-black text-rose-400 font-mono">{notFoundCount} Kalem</span>
              </div>
              {notFoundCount > 0 && (
                <button
                  onClick={() => {
                    const failed = parsedRows.filter(r => r.status === 'NOT_FOUND' || r.status === 'LOW_STOCK');
                    const csv = "data:text/csv;charset=utf-8,stok_kodu,adet,hata\n" + failed.map(f => `${f.rawCode},${f.rawQty},"${f.errorMsg}"`).join("\n");
                    const link = document.createElement("a");
                    link.href = encodeURI(csv);
                    link.download = "hatali_stok_kodlari.csv";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-bold rounded-lg transition"
                >
                  Hatalıları İndir
                </button>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3 w-12">#</th>
                  <th className="p-3 w-44">Yüklenen Kod</th>
                  <th className="p-3">Eşleşen Ürün</th>
                  <th className="p-3 w-28 text-center">Durum</th>
                  <th className="p-3 w-24 text-center">Adet</th>
                  <th className="p-3 w-32 text-right">Net Fiyat (TL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {parsedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-sky-300">{r.rawCode}</td>
                    <td className="p-3">
                      {r.product ? (
                        <div>
                          <div className="font-bold text-white line-clamp-1">{r.product.name}</div>
                          <span className="text-[10px] text-slate-400">{r.product.brand}</span>
                        </div>
                      ) : (
                        <span className="text-rose-400 font-semibold">{r.errorMsg}</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'READY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        r.status === 'LOW_STOCK' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {r.status === 'READY' ? 'Hazır' : r.status === 'LOW_STOCK' ? 'Tükendi' : 'Bulunamadı'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{r.rawQty}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {r.product ? formatCurrency(r.product.priceTRY * (1 - profile.discountRate) * r.rawQty) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs">
              <span className="text-slate-400">Toplam Hazır Tutar (KDV Hariç): </span>
              <span className="text-xl font-black font-mono text-emerald-400">{formatCurrency(totalCalculatedNet)}</span>
            </div>

            <button
              onClick={handleTransferToCart}
              disabled={readyCount === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Hazır Olan {readyCount} Kalemi Sepete Aktar</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
