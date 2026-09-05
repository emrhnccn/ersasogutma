'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  CreditCard,
  Filter,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function CariPage() {
  const { showToast, profile } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [liveCariData, setLiveCariData] = useState<{
    companyName?: string;
    taxNo?: string;
    creditLimit?: number;
    currentBalance?: number;
    availableCredit?: number;
    totalDebit?: number;
    totalCredit?: number;
    balance?: number;
    balanceType?: string;
    transactions?: CariTransaction[];
  } | null>(null);

  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'debt_only' | 'credit_only'>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'last30' | 'last90' | 'thisYear'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);

  const fetchCariData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/b2b/cari');
      const json = await res.json();
      if (json.success && json.data) {
        setLiveCariData(json.data);
      }
    } catch (err) {
      console.error('Failed to load cari statement:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCariData();
  }, [fetchCariData]);

  const transactionsList = liveCariData?.transactions || [];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((tx) => {
      if (docTypeFilter !== 'all' && tx.documentType !== docTypeFilter) {
        return false;
      }
      if (balanceFilter === 'debt_only' && tx.debt <= 0) return false;
      if (balanceFilter === 'credit_only' && tx.credit <= 0) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesDoc = tx.documentNo.toLowerCase().includes(q);
        const matchesType = tx.documentType.toLowerCase().includes(q);
        const matchesDesc = tx.description?.toLowerCase().includes(q) || false;
        if (!matchesDoc && !matchesType && !matchesDesc) return false;
      }
      return true;
    });
  }, [transactionsList, docTypeFilter, balanceFilter, searchQuery]);

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
    } catch {
      showToast('Excel dışa aktarılırken bir hata oluştu.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const availableCredit = (liveCariData?.creditLimit ?? profile.creditLimit) - (liveCariData?.currentBalance ?? profile.currentBalance);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cari Hesap Hareketleri</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Faturalarınız, tahsilat makbuzlarınız, çek ve banka hareketlerinizin güncel ERP dökümü
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start">
          <Link
            href="/bayi/finans/online-odeme"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>Bakiye Öde (POS)</span>
          </Link>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-xs transition"
            title="Excel Olarak İndir"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Ekstre</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-xs transition"
            title="Yazdır / PDF"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>PDF / Yazdır</span>
          </button>
        </div>
      </div>

      {/* 5 Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Cari Bakiye */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Cari Bakiye
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatCurrency(liveCariData?.currentBalance ?? profile.currentBalance)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Durum: <span className={(liveCariData?.currentBalance ?? 0) > 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
              {liveCariData?.balanceType === 'A' ? 'Alacaklı (A)' : 'Borçlu (B)'}
            </span>
          </div>
        </div>

        {/* Card 2: Kredi Limiti */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Kredi Limiti
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatCurrency(liveCariData?.creditLimit ?? profile.creditLimit)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tanımlı açık hesap</span>
          </div>
        </div>

        {/* Card 3: Kullanılabilir Limit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Kullanılabilir Limit
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">
            {formatCurrency(Math.max(0, availableCredit))}
          </div>
          <div className="text-[11px] text-slate-500">
            Sipariş verilebilir limit
          </div>
        </div>

        {/* Card 4: Geciken Borç */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Geciken Borç
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            0,00 TL
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Vadesi geçen borç yok
          </div>
        </div>

        {/* Card 5: Son Ödeme / Alacak */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Son Ödeme
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatCurrency(liveCariData?.totalCredit ?? 0)}
          </div>
          <div className="text-[11px] text-slate-500">
            Toplam tahsilat tutarı
          </div>
        </div>

      </div>

      {/* Date & Type Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* Preset Date Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'all', label: 'Tüm Zamanlar' },
            { id: 'today', label: 'Bugün' },
            { id: 'last30', label: 'Son 30 Gün' },
            { id: 'last90', label: 'Son 3 Ay' },
            { id: 'thisYear', label: 'Bu Yıl (2026)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDatePreset(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                datePreset === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Evrak Cinsi:</label>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
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

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Bakiye Yönü:</label>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="all">Tüm Hareketler</option>
              <option value="debt_only">Sadece Borç (Faturalar)</option>
              <option value="credit_only">Sadece Alacak (Ödemeler)</option>
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Evrak No / Açıklama Ara:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Evrak no veya açıklama arayın..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="sm:col-span-1 pt-4 flex justify-end">
            {(docTypeFilter !== 'all' || balanceFilter !== 'all' || searchQuery || datePreset !== 'all') && (
              <button
                onClick={() => {
                  setDocTypeFilter('all');
                  setBalanceFilter('all');
                  setDatePreset('all');
                  setSearchQuery('');
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition"
                title="Filtreleri Sıfırla"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
          <span>Toplam <strong>{filteredTransactions.length}</strong> hareket listeleniyor.</span>
          <span className="text-[11px] text-slate-400 font-mono">B: Borçlu | A: Alacaklı</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4 w-28">Tarih</th>
                <th className="py-3 px-4 w-36">Evrak Numarası</th>
                <th className="py-3 px-4 w-36">Evrak Cinsi</th>
                <th className="py-3 px-4">Açıklama</th>
                <th className="py-3 px-4 text-right w-32">Borç</th>
                <th className="py-3 px-4 text-right w-32">Alacak</th>
                <th className="py-3 px-4 text-right w-36">Bakiye</th>
                <th className="py-3 px-4 text-right w-24">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    Kriterlere uygun cari hareket kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-xs">{tx.date}</td>
                    
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {tx.documentNo}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium border border-slate-200">
                        {tx.documentType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {tx.description || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-red-600">
                      {tx.debt > 0 ? formatCurrency(tx.debt) : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                      {tx.credit > 0 ? formatCurrency(tx.credit) : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(tx.balance)} ({tx.balanceType})
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {tx.invoiceDetail ? (
                        <button
                          onClick={() => setSelectedInvoice(tx.invoiceDetail!)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg font-semibold text-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>İncele</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onCloseAction={() => setSelectedInvoice(null)}
      />

    </div>
  );
}
