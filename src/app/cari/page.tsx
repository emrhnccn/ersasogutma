'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import { InvoiceDetailModal } from '@/components/finance/InvoiceDetailModal';
import { InvoiceDetail, CariTransaction } from '@/types';
import {
  Layers,
  Search,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function CariPage() {
  const { cariTransactions, cariSummary, showToast, profile } = useStore();
  
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return cariTransactions.filter((tx) => {
      if (docTypeFilter !== 'all' && tx.documentType !== docTypeFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesDoc = tx.documentNo.toLowerCase().includes(q);
        const matchesType = tx.documentType.toLowerCase().includes(q);
        const matchesDesc = tx.description?.toLowerCase().includes(q) || false;
        if (!matchesDoc && !matchesType && !matchesDesc) return false;
      }
      return true;
    });
  }, [cariTransactions, docTypeFilter, searchQuery]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataRows = filteredTransactions.map((tx, idx) => ({
        'Sıra': idx + 1,
        'Tarih': tx.date,
        'Evrak No': tx.documentNo,
        'Evrak Cinsi': tx.documentType,
        'Açıklama': tx.description || '',
        'Borç (TL)': tx.debt,
        'Alacak (TL)': tx.credit,
        'Bakiye (TL)': tx.balance,
        'Durum': tx.balanceType === 'B' ? 'Borçlu (B)' : 'Alacaklı (A)'
      }));

      const ws = XLSX.utils.json_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Cari_Ekstre');
      XLSX.writeFile(wb, `Ersa_Cari_Ekstre_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Cari ekstre Excel dosyası başarıyla indirildi!');
    } catch (err) {
      showToast('Excel dışa aktarılırken bir hata oluştu.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Mali Hareketler & Hesap Ekstresi</span>
          </div>
          <h1 className="text-2xl font-black text-white">Cari Hesap Hareketleri</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Faturalarınız, tahsilat makbuzlarınız, çek ve banka hareketlerinizin güncel dökümü
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start">
          <Link
            href="/finans/online-odeme"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>Bakiye Öde (POS)</span>
          </Link>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
            title="Excel Olarak İndir"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel İndir</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
            title="Yazdır / PDF"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Yazdır</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Summary KPI Cards (Exact replica of Girdap screenshot 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Box 1: Sipariş Toplamı */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-100 mb-1">
            SİPARİŞ TOPLAMI
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {formatCurrency(cariSummary.totalOrders)}
          </div>
          <div className="mt-3 text-[11px] text-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tüm onaylanan siparişler</span>
          </div>
        </div>

        {/* Box 2: Borç (Debit) */}
        <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-100 mb-1">
            BORÇ TOPLAMI (ALINAN MALLAR)
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {formatCurrency(cariSummary.totalDebt)}
          </div>
          <div className="mt-3 text-[11px] text-sky-200 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Faturalar ve borç fişleri</span>
          </div>
        </div>

        {/* Box 3: Alacak (Credit) */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-100 mb-1">
            ALACAK TOPLAMI (YAPILAN ÖDEMELER)
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {formatCurrency(cariSummary.totalCredit)}
          </div>
          <div className="mt-3 text-[11px] text-amber-200 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Havale, Çek & POS ödemeleri</span>
          </div>
        </div>

        {/* Box 4: Güncel Bakiye */}
        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-100 mb-1">
            NET CARİ BAKİYE
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {formatCurrency(cariSummary.balance)} ({cariSummary.balanceType})
          </div>
          <div className="mt-3 text-[11px] text-emerald-200 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>Alacaklı Durumdasınız (A)</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar (Matching screenshot 3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Evrak Cinsi Dropdown */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Evrak Cinsi:</label>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tüm Evrak Cinsleri</option>
              <option value="Satış Faturası">Satış Faturası</option>
              <option value="Tahsilat Makbuzu">Tahsilat Makbuzu</option>
              <option value="Açılış Fişi">Açılış Fişi</option>
              <option value="Çek/Senet Girişi">Çek/Senet Girişi</option>
              <option value="Kredi Kartı Ödemesi">Kredi Kartı Ödemesi</option>
              <option value="Havale/EFT">Havale/EFT</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Evrak No / Açıklama:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Evrak no veya açıklama arayın (Örn: SANPOS, ERS-2026, Fiş...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Reset Button */}
          <div className="sm:col-span-2 pt-5 flex justify-end">
            {(docTypeFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setDocTypeFilter('all');
                  setSearchQuery('');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
            )}
          </div>

        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex justify-between items-center">
          <span>Toplam <strong>{filteredTransactions.length}</strong> hareket listeleniyor.</span>
          <span className="text-[11px] text-slate-500">B: Borçlu | A: Alacaklı</span>
        </div>
      </div>

      {/* Transactions Table (Matching Screenshot 3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                <th className="py-3.5 px-4 w-28">Tarih</th>
                <th className="py-3.5 px-4 w-36">Evrak Numarası</th>
                <th className="py-3.5 px-4 w-36">Evrak Cinsi</th>
                <th className="py-3.5 px-4">Açıklama</th>
                <th className="py-3.5 px-4 text-right w-32">Borç</th>
                <th className="py-3.5 px-4 text-right w-32">Alacak</th>
                <th className="py-3.5 px-4 text-right w-36">Bakiye</th>
                <th className="py-3.5 px-4 text-right w-24">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/50 transition group">
                  <td className="py-3.5 px-4 font-mono text-slate-400">{tx.date}</td>
                  
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                    {tx.documentNo}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                      {tx.documentType}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    {tx.description || '-'}
                  </td>

                  {/* Borç */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                    {tx.debt > 0 ? formatCurrency(tx.debt) : '-'}
                  </td>

                  {/* Alacak */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                    {tx.credit > 0 ? formatCurrency(tx.credit) : '-'}
                  </td>

                  {/* Running Balance */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-white">
                    {formatCurrency(tx.balance)} ({tx.balanceType})
                  </td>

                  {/* Action (İncele Modal) */}
                  <td className="py-3.5 px-4 text-right">
                    {tx.invoiceDetail ? (
                      <button
                        onClick={() => setSelectedInvoice(tx.invoiceDetail!)}
                        className="inline-flex items-center gap-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white px-2.5 py-1 rounded-lg font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>İncele</span>
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

    </div>
  );
}
