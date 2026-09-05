'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { WarrantyRecord } from '@/types';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Wrench,
  Calendar,
  Building,
  Plus,
  FileText,
  X,
  Sparkles
} from 'lucide-react';

export default function WarrantyPage() {
  const { warrantyClaims, createWarrantyClaim, showToast } = useStore();

  const [searchSerial, setSearchSerial] = useState('');
  const [queriedRecord, setQueriedRecord] = useState<WarrantyRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimSerial, setClaimSerial] = useState('');
  const [claimProdName, setClaimProdName] = useState('');
  const [claimDesc, setClaimDesc] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSerial.trim()) return;

    const serialClean = searchSerial.trim().toUpperCase();

    // Standard simulated lookup for commercial equipment
    const record: WarrantyRecord = {
      serialNumber: serialClean,
      productCode: 'ERS-701010009',
      productName: 'Embraco Aspera 1.5 HP Soğutma Kompresörü (R134a)',
      brand: 'Embraco Aspera',
      model: 'NJ9238GK',
      installDate: '15.01.2025',
      warrantyPeriodMonths: 24,
      warrantyEndDate: '15.01.2027',
      status: 'Aktif Garanti',
      dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
      serviceHistory: [
        {
          date: '15.01.2025',
          description: 'Sistem montajı ve ilk devreye alma yapıldı.',
          technician: 'Ersa Yetkili Servis'
        }
      ]
    };

    setQueriedRecord(record);
    setHasSearched(true);
    showToast(`Seri no #${serialClean} doğrulandı!`, 'success');
  };

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimSerial || !claimDesc) {
      showToast('Lütfen seri no ve arıza açıklamasını giriniz.', 'warning');
      return;
    }

    createWarrantyClaim({
      serialNumber: claimSerial,
      productName: claimProdName || 'Soğutma Ekipmanı',
      issueDescription: claimDesc
    });

    setShowClaimModal(false);
    setClaimSerial('');
    setClaimProdName('');
    setClaimDesc('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Ersa Soğutma Yetkili Servis & Garanti Portalı</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Garanti Sorgulama & Destek Talebi</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kompresör veya soğutma cihazınızın seri numarasını girerek garanti durumunu kontrol edin ve servis talebi oluşturun.
          </p>
        </div>

        <button
          onClick={() => {
            if (queriedRecord) {
              setClaimSerial(queriedRecord.serialNumber);
              setClaimProdName(queriedRecord.productName);
            }
            setShowClaimModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Garanti Talebi Oluştur</span>
        </button>
      </div>

      {/* Query Form Box */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="Cihaz seri numarasını veya barkodunu giriniz (Örn: ERS-2025-78901)..."
              value={searchSerial}
              onChange={(e) => setSearchSerial(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>SORGULA</span>
          </button>
        </form>
      </div>

      {/* Query Result View */}
      {hasSearched && queriedRecord && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in transition-colors">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Sorgulanan Cihaz</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{queriedRecord.productName}</h2>
              <span className="font-mono text-xs text-sky-600 dark:text-sky-400">Seri No: {queriedRecord.serialNumber}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>GARANTİ AKTİF (Kalan: 512 Gün)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-[#0B1120] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Marka / Model</span>
              <span className="font-bold text-slate-900 dark:text-white mt-1 block">{queriedRecord.brand}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{queriedRecord.model}</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0B1120] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Montaj Tarihi</span>
              <span className="font-bold text-slate-900 dark:text-white mt-1 block">{queriedRecord.installDate}</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0B1120] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Garanti Bitişi</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{queriedRecord.warrantyEndDate}</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0B1120] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Sorumlu Bayi</span>
              <span className="font-bold text-slate-900 dark:text-white mt-1 block line-clamp-1">{queriedRecord.dealerName}</span>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={() => {
                setClaimSerial(queriedRecord.serialNumber);
                setClaimProdName(queriedRecord.productName);
                setShowClaimModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>Bu Cihaz İçin Garanti / Arıza Servisi İste</span>
            </button>
          </div>

        </div>
      )}

      {/* Existing Claims List */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-500" />
          <span>Açılmış Garanti & Servis Talepleriniz ({warrantyClaims.length})</span>
        </h3>

        {warrantyClaims.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            Henüz oluşturulmuş bir garanti destek talebiniz bulunmamaktadır.
          </div>
        ) : (
          <div className="space-y-3">
            {warrantyClaims.map((claim) => (
              <div key={claim.id} className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">#{claim.claimNumber}</span>
                    <span className="text-slate-500 dark:text-slate-400">({claim.date})</span>
                  </div>
                  <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {claim.status}
                  </span>
                </div>

                <div className="text-slate-900 dark:text-slate-100 font-bold">{claim.productName}</div>
                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">Seri No: {claim.serialNumber}</div>
                <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-[11px]">
                  <strong>Arıza Tanımı:</strong> {claim.issueDescription}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: New Warranty Claim */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Garanti / Servis Talebi Oluştur</h3>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Cihaz Seri Numarası:</label>
                <input
                  type="text"
                  required
                  placeholder="ERS-2025-..."
                  value={claimSerial}
                  onChange={(e) => setClaimSerial(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Ürün / Model Adı:</label>
                <input
                  type="text"
                  placeholder="Embraco Kompresör..."
                  value={claimProdName}
                  onChange={(e) => setClaimProdName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Arıza / Sorun Açıklaması:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Cihazın çalışmama durumu, ses veya gaz kaçağı detayını belirtiniz..."
                  value={claimDesc}
                  onChange={(e) => setClaimDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-xs transition"
                >
                  Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
