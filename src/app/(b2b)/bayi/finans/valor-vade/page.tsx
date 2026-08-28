'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { ChequeItem } from '@/types';
import { formatCurrency, calculateAverageMaturity, formatDate } from '@/lib/utils';
import {
  Calculator,
  Plus,
  Trash2,
  Calendar,
  RotateCcw,
  Printer,
  CheckCircle2,
  Sparkles,
  Info,
  CalendarDays
} from 'lucide-react';

export default function MaturityCalculatorPage() {
  const { showToast } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];

  // Base setup
  const [startDate, setStartDate] = useState<string>(todayStr);

  // Single Cheque Form
  const [singleDate, setSingleDate] = useState<string>('');
  const [singleAmount, setSingleAmount] = useState<string>('');
  const [singleBank, setSingleBank] = useState<string>('');

  // Sequential Cheques Form
  const [seqDay, setSeqDay] = useState<number>(20);
  const [seqAmount, setSeqAmount] = useState<string>('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Cheque list
  const [cheques, setCheques] = useState<ChequeItem[]>([
    {
      id: 'chk-1',
      maturityDate: '2026-09-20',
      amount: 45000,
      valueDays: 24,
      bankName: 'Garanti BBVA'
    },
    {
      id: 'chk-2',
      maturityDate: '2026-10-20',
      amount: 45000,
      valueDays: 54,
      bankName: 'Yapı Kredi'
    },
    {
      id: 'chk-3',
      maturityDate: '2026-11-20',
      amount: 45000,
      valueDays: 85,
      bankName: 'İş Bankası'
    }
  ]);

  // Generate next 18 months for sequential cheque matrix
  const availableMonths = React.useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 1; i <= 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label, val });
    }
    return months;
  }, []);

  const toggleMonth = (mVal: string) => {
    setSelectedMonths((prev) =>
      prev.includes(mVal) ? prev.filter((m) => m !== mVal) : [...prev, mVal]
    );
  };

  const handleAddSingleCheque = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(singleAmount);
    if (!singleDate || isNaN(amountNum) || amountNum <= 0) {
      showToast('Lütfen geçerli bir vade tarihi ve tutar giriniz.', 'warning');
      return;
    }

    const newCheque: ChequeItem = {
      id: `chk-${Date.now()}`,
      maturityDate: singleDate,
      amount: amountNum,
      valueDays: 0,
      bankName: singleBank || 'Tanımsız Banka'
    };

    setCheques((prev) => [...prev, newCheque]);
    setSingleDate('');
    setSingleAmount('');
    setSingleBank('');
    showToast('Çek hesaplama tablosuna eklendi.');
  };

  const handleAddSequentialCheques = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(seqAmount);
    if (selectedMonths.length === 0 || isNaN(amountNum) || amountNum <= 0) {
      showToast('Lütfen en az bir ay seçiniz ve çek tutarı giriniz.', 'warning');
      return;
    }

    const newItems: ChequeItem[] = selectedMonths.map((mVal) => {
      const [year, month] = mVal.split('-');
      const formattedDate = `${year}-${month}-${String(seqDay).padStart(2, '0')}`;
      return {
        id: `chk-seq-${mVal}-${Date.now()}`,
        maturityDate: formattedDate,
        amount: amountNum,
        valueDays: 0,
        bankName: 'Sıralı Bayi Çeki'
      };
    });

    setCheques((prev) => [...prev, ...newItems]);
    setSelectedMonths([]);
    setSeqAmount('');
    showToast(`${newItems.length} adet sıralı çek tabloya eklendi!`, 'success');
  };

  const handleDeleteCheque = (id: string) => {
    setCheques((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAll = () => {
    setCheques([]);
    showToast('Tüm çekler temizlendi.', 'info');
  };

  const result = calculateAverageMaturity(cheques, startDate);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Finans & Muhasebe Araçları</span>
          </div>
          <h1 className="text-2xl font-black text-white">Ortalama Vade & Valör Hesaplama</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Müşteri veya bayi çeklerinizin vadelerini, tutarlarını ve ortalama valör gününü anında hesaplayın
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 shadow-md transition self-start"
        >
          <Printer className="w-4 h-4 text-sky-400" />
          <span>Valör Bordrosunu Yazdır</span>
        </button>
      </div>

      {/* Main Grid: Left Forms | Right Calculation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Base Setup: Vade Başlangıç Tarihi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-sky-400" />
                <span>Vade Başlangıç Tarihi</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Valör Referans Tarihi</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Form 1: Yeni Tekil Çek Tanımla (Matching Girdap) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>Yeni Çek Tanımla (Tekil Çek)</span>
            </h3>

            <form onSubmit={handleAddSingleCheque} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Vade Tarihi:</label>
                <input
                  type="date"
                  required
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tutar (TL):</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Örn: 25000"
                  value={singleAmount}
                  onChange={(e) => setSingleAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Banka Adı (Opsiyonel):</label>
                <input
                  type="text"
                  placeholder="Örn: Garanti BBVA"
                  value={singleBank}
                  onChange={(e) => setSingleBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-sky-600/30 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>KAYDET (Listeye Ekle)</span>
              </button>
            </form>
          </div>

          {/* Form 2: Sıralı Çek Tanımla (Matching Girdap sequential matrix) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Sıralı Çek Tanımla (Çoklu Ay Seçimi)</span>
            </h3>

            <form onSubmit={handleAddSequentialCheques} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Ayın Kaçıncı Günü:</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={seqDay}
                    onChange={(e) => setSeqDay(parseInt(e.target.value) || 20)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Her Çekin Tutarı (TL):</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Örn: 15000"
                    value={seqAmount}
                    onChange={(e) => setSeqAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Month Selector Grid */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Vade Ayları Seçiniz ({selectedMonths.length} Ay Seçildi):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {availableMonths.map((m) => {
                    const isSelected = selectedMonths.includes(m.val);
                    return (
                      <button
                        type="button"
                        key={m.val}
                        onClick={() => toggleMonth(m.val)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition text-center truncate ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={selectedMonths.length === 0 || !seqAmount}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  selectedMonths.length > 0 && seqAmount
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ÖNİZLEME & SIRALI ÇEKLERİ EKLE ({selectedMonths.length} Adet)</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Calculation Result Table (Matching Girdap Table) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Toplam Tutar</div>
              <div className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5 truncate">
                {formatCurrency(result.totalAmount)}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Çek Adedi</div>
              <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                {result.chequeCount} Adet
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Ortalama Valör</div>
              <div className="text-base sm:text-lg font-black font-mono text-sky-400 mt-0.5">
                {result.averageValueDays} Gün
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Ortalama Vade</div>
              <div className="text-base sm:text-lg font-black font-mono text-amber-400 mt-0.5">
                {result.averageMaturityDate}
              </div>
            </div>

          </div>

          {/* Cheques Calculation Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="font-bold text-xs text-white flex items-center gap-2">
                <span>Eklenen Çekler & Valör Listesi</span>
                <span className="text-[11px] text-slate-500 font-mono">({cheques.length} Kalem)</span>
              </div>

              {cheques.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Listeyi Temizle</span>
                </button>
              )}
            </div>

            {cheques.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Tabloda henüz çek bulunmuyor. Soldaki formdan çek ekleyiniz.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-950 z-10">
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-10 text-center">#</th>
                      <th className="py-3 px-4">Vade Tarihi</th>
                      <th className="py-3 px-4">Banka Bilgisi</th>
                      <th className="py-3 px-4 text-right">Tutar (TL)</th>
                      <th className="py-3 px-4 text-center">Valör (Gün)</th>
                      <th className="py-3 px-4 text-center w-12">Sil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {cheques.map((chk, idx) => (
                      <tr key={chk.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-sky-400">
                          {formatDate(chk.maturityDate)}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {chk.bankName || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(chk.amount)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {chk.valueDays} Gün
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteCheque(chk.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Çeki Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Formula Explanation Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Valör Hesaplama Mantığı:</strong> ∑(Çek Tutarı × Valör Günü) / ∑(Toplam Tutar) formülü ile ağırlıklı ortalama gün hesaplanır ve referans başlangıç tarihine eklenir.
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
