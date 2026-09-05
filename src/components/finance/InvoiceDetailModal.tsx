'use client';

import React from 'react';
import { InvoiceDetail } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { X, Printer, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: InvoiceDetail | null;
  onClose?: () => void;
  onCloseAction?: () => void;
}

export function InvoiceDetailModal({ invoice, onClose, onCloseAction }: InvoiceDetailModalProps) {
  const handleClose = onCloseAction || onClose;
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-sky-600/20 border border-blue-200 dark:border-sky-500/30 flex items-center justify-center text-blue-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Fatura Detayı</h3>
                <span className="font-mono font-bold text-blue-700 dark:text-sky-400 bg-blue-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-blue-200 dark:border-sky-800 text-xs">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                E-Arşiv Belge No: <span className="font-mono text-slate-700 dark:text-slate-300">{invoice.eArchiveId || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>Yazdır</span>
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Company & Dealer Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Satıcı (Ersa Soğutma) */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-blue-700 dark:text-sky-400 uppercase tracking-wider mb-1">
                Satıcı (Firma)
              </div>
              <div className="font-black text-slate-900 dark:text-white text-sm">
                ERSA SOĞUTMA ISITMA SAN. VE TİC. LTD. ŞTİ.
              </div>
              <div className="text-slate-500 dark:text-slate-400">Vergi Dairesi: Darıca V.D. / VKN: 3340592817</div>
              <div className="text-slate-500 dark:text-slate-400">Adres: Kazım Karabekir Mah. İstasyon Cad. No:84 Darıca / Kocaeli</div>
              <div className="text-slate-500 dark:text-slate-400">Tel: 0262 653 41 00 • Mersis: 0334059281700018</div>
            </div>

            {/* Alıcı (Bayi) */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                Alıcı (Bayi Cari Bilgileri)
              </div>
              <div className="font-black text-slate-900 dark:text-white text-sm">
                {invoice.dealerName}
              </div>
              <div className="text-slate-500 dark:text-slate-400">Vergi Dairesi: {invoice.taxOffice} / VKN: {invoice.taxNumber}</div>
              <div className="text-slate-500 dark:text-slate-400">Adres: {invoice.address}</div>
              <div className="text-slate-700 dark:text-slate-300 font-mono mt-1">
                Düzenleme Tarihi: <strong>{invoice.date}</strong> {invoice.dueDate && `• Vade: ${invoice.dueDate}`}
              </div>
            </div>

          </div>

          {/* Invoiced Products Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 w-28">Ürün Kodu</th>
                  <th className="py-2.5 px-3">Mal / Hizmet Açıklaması</th>
                  <th className="py-2.5 px-3 text-center">Miktar</th>
                  <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                  <th className="py-2.5 px-3 text-center">KDV %</th>
                  <th className="py-2.5 px-3 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-sky-400">{item.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">{item.quantity} {item.unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">%{item.vatRate}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>GİB E-Fatura standartlarına uygun olarak elektronik ortamda oluşturulmuştur.</span>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Mal Hizmet Toplamı:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>KDV Matrahı:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(invoice.vatMatrah)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hesaplanan KDV:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(invoice.vatTotal)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-emerald-600 dark:text-emerald-400">
                <span>Genel Toplam:</span>
                <span className="font-mono">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
}
