'use client';

import React, { useState } from 'react';
import { WARRANTIES } from '@/data/warranties';
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
  Sparkles,
  Info
} from 'lucide-react';

export default function WarrantyPage() {
  const [searchSerial, setSearchSerial] = useState('ERS-2025-78901');
  const [queriedRecord, setQueriedRecord] = useState<WarrantyRecord | null>(WARRANTIES[0]);
  const [hasSearched, setHasSearched] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSerial.trim()) return;

    const record = WARRANTIES.find(
      (w) =>
        w.serialNumber.toLowerCase() === searchSerial.toLowerCase().trim() ||
        w.productCode.toLowerCase() === searchSerial.toLowerCase().trim()
    );

    setQueriedRecord(record || null);
    setHasSearched(true);
  };

  const handleSelectSample = (serial: string) => {
    setSearchSerial(serial);
    const record = WARRANTIES.find((w) => w.serialNumber === serial);
    setQueriedRecord(record || null);
    setHasSearched(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Ersa Soğutma Yetkili Servis & Garanti Portalı</span>
        </div>
        <h1 className="text-2xl font-black text-white">Garanti & Seri No Sorgulama</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Kompresör, soğuk oda ünitesi veya servis aletinizin seri numarasını girerek garanti durumunu kontrol edin
        </p>
      </div>

      {/* Query Form Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="Cihaz seri numarasını veya barkodunu giriniz (Örn: ERS-2025-78901)..."
              value={searchSerial}
              onChange={(e) => setSearchSerial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>SORGULA</span>
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap pt-2">
          <span className="font-semibold">Örnek Seri Numaraları:</span>
          {WARRANTIES.map((w) => (
            <button
              key={w.serialNumber}
              onClick={() => handleSelectSample(w.serialNumber)}
              className="bg-slate-800 hover:bg-slate-700 text-sky-300 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 transition"
            >
              {w.serialNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Query Result View */}
      {hasSearched && (
        queriedRecord ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-6 p-6 animate-in fade-in">
            
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    queriedRecord.status === 'Aktif Garanti'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">{queriedRecord.productName}</h2>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Seri No: <strong className="text-sky-400">{queriedRecord.serialNumber}</strong> • Model: {queriedRecord.model}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    queriedRecord.status === 'Aktif Garanti'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {queriedRecord.status}
                </span>

                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Garanti Belgesini Yazdır"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">İlk Montaj / Fatura</div>
                <div className="text-sm font-black font-mono text-white mt-1">
                  {queriedRecord.installDate}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Garanti Bitiş Tarihi</div>
                <div className="text-sm font-black font-mono text-emerald-400 mt-1">
                  {queriedRecord.warrantyEndDate}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Garanti Süresi</div>
                <div className="text-sm font-black font-mono text-white mt-1">
                  {queriedRecord.warrantyPeriodMonths} Ay (2 Yıl)
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Yetkili Bayi</div>
                <div className="text-xs font-bold text-sky-400 mt-1 truncate">
                  {queriedRecord.dealerName}
                </div>
              </div>

            </div>

            {/* Service & Maintenance History */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Servis ve Müdahale Geçmişi ({queriedRecord.serviceHistory.length} Kayıt)</span>
              </h3>

              <div className="space-y-2.5">
                {queriedRecord.serviceHistory.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-white mb-0.5">
                        <span className="font-mono text-sky-400">{s.date}</span>
                        <span>•</span>
                        <span>{s.description}</span>
                      </div>
                      {s.partsReplaced && (
                        <div className="text-[11px] text-amber-400">
                          Değişen Parça / Not: {s.partsReplaced}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Teknisyen: {s.technician}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Seri Numarası Bulunamadı</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Girilen &quot;<span className="font-mono text-white">{searchSerial}</span>&quot; seri numarasına ait kayıt bulunamamıştır. Lütfen cihaz etiketindeki numarayı kontrol ediniz veya teknik destek birimimizle iletişime geçiniz.
            </p>
          </div>
        )
      )}

    </div>
  );
}
