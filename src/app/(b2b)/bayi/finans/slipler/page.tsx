'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import { PosSlip } from '@/types';
import {
  CreditCard,
  Search,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  Eye,
  Receipt
} from 'lucide-react';
import Link from 'next/link';

export default function PosSlipsPage() {
  const { posSlips } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<PosSlip | null>(null);

  const filteredSlips = posSlips.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.referenceCode.toLowerCase().includes(q) ||
      s.bankName.toLowerCase().includes(q) ||
      s.cardHolder.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Sanal POS İşlem Kayıtları</span>
          </div>
          <h1 className="text-2xl font-black text-white">Kredi Kartı Slipleri</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sanal POS üzerinden gerçekleştirdiğiniz başarılı tahsilat dekontları ve slip dökümleri
          </p>
        </div>

        <Link
          href="/finans/online-odeme"
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/30 transition self-start"
        >
          <CreditCard className="w-4 h-4" />
          <span>Yeni Kart Ödemesi Yap</span>
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Referans Kodu veya Banka arayın (Örn: SANPOS-5438)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Slips Table (Matching Girdap page=finans/kredi-karti-slipleri) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {filteredSlips.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Kredi kartı slip kaydı bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                  <th className="py-3.5 px-4">Tarih</th>
                  <th className="py-3.5 px-4">Referans Kodu</th>
                  <th className="py-3.5 px-4">Banka & Program</th>
                  <th className="py-3.5 px-4">Kart No</th>
                  <th className="py-3.5 px-4 text-center">Taksit</th>
                  <th className="py-3.5 px-4">Ödeme Tutarı</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredSlips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{slip.date}</td>
                    
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {slip.referenceCode}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {slip.bankName}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {slip.cardNumberMasked}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-300">
                        {slip.installmentCount === 1 ? 'Tek Çekim' : `${slip.installmentCount} Taksit`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(slip.amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{slip.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedSlip(slip)}
                        className="inline-flex items-center gap-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white px-2.5 py-1 rounded-lg font-semibold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Görüntüle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Slip Receipt Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>B2B Sanal POS Dekontu</span>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip Paper Body */}
            <div className="bg-slate-950 border border-dashed border-slate-700 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-3">
              <div className="text-center border-b border-slate-800 pb-2">
                <div className="font-bold text-white text-sm">ERSA SOĞUTMA ISITMA LTD. ŞTİ.</div>
                <div className="text-[10px] text-slate-500">Kazım Karabekir Mah. Darıca / Kocaeli</div>
                <div className="text-[10px] text-slate-500">Mersis: 0334059281700018</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">İŞLEM TARİHİ:</span>
                  <span className="text-white">{selectedSlip.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">REF / SİPARİŞ NO:</span>
                  <span className="text-sky-400 font-bold">{selectedSlip.referenceCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">POS BANKA:</span>
                  <span className="text-white">{selectedSlip.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">KART NUMARASI:</span>
                  <span className="text-white">{selectedSlip.cardNumberMasked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">KART SAHİBİ:</span>
                  <span className="text-white">{selectedSlip.cardHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ONAY / AUTH KODU:</span>
                  <span className="text-emerald-400 font-bold">{selectedSlip.authCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TERMİNAL NO:</span>
                  <span className="text-white">{selectedSlip.terminalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TAKSET SAYISI:</span>
                  <span className="text-white">{selectedSlip.installmentCount === 1 ? 'TEK ÇEKİM' : `${selectedSlip.installmentCount} TAKSİT`}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline font-black text-sm">
                <span className="text-white">TAHSİLAT TUTARI:</span>
                <span className="text-emerald-400 text-base">{formatCurrency(selectedSlip.amount)}</span>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                {selectedSlip.responseMessage} • 3D Secure Onaylı
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Kapat
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/30 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Dekontu Yazdır</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
