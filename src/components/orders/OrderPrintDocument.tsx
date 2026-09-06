'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { translateOrderStatus } from '@/lib/export/orderExport';

export interface OrderPrintData {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  orderNote?: string;
  currency?: string;
  companyName?: string;
  userName?: string;
  taxOffice?: string;
  taxNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  subtotalExVat: number;
  vatTotal: number;
  grandTotal: number;
  items: Array<{
    id?: string;
    name: string;
    sku: string;
    quantity: number;
    unit?: string;
    unitNetExVat: number;
    discountAmt?: number;
    lineGross?: number;
    vatRate?: number;
  }>;
}

interface OrderPrintDocumentProps {
  order: OrderPrintData;
  className?: string;
}

export function OrderPrintDocument({ order, className = '' }: OrderPrintDocumentProps) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const printTime = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const paymentMethodLabel =
    order.paymentMethod === 'SANAL_POS' || order.paymentMethod === 'CREDIT_CARD'
      ? 'Kredi Kartı / Sanal POS (Peşin)'
      : order.paymentMethod === 'HAVALE_EFT'
      ? 'Banka Havalesi / EFT'
      : 'Cari Hesap (Açık Hesap)';

  // Calculate total discount from items
  const totalDiscount = order.items.reduce(
    (sum, item) => sum + Number(item.discountAmt || 0) * Number(item.quantity || 1),
    0
  );

  return (
    <>
      {/* Embedded Print CSS for strict A4 page geometry */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 10mm 10mm;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 9pt !important;
            line-height: 1.3 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide ALL other elements in body during print */
          body * {
            visibility: hidden !important;
          }

          /* Show ONLY the order print document and its descendants */
          #order-print-document,
          #order-print-document * {
            visibility: visible !important;
          }

          #order-print-document {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Hide global navigation, modals chrome, and controls */
          header, nav, aside, footer, .no-print, [role="navigation"], button, a[href^="/"] {
            display: none !important;
          }

          .ersa-print-page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .ersa-print-table-header {
            display: table-header-group !important;
          }

          .ersa-print-table-row {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Document Layout (A4 styled) */}
      <div
        id="order-print-document"
        className={`ersa-print-wrapper bg-white text-slate-900 font-sans p-6 sm:p-8 max-w-4xl mx-auto border border-slate-200 rounded-2xl shadow-sm ${className}`}
      >
        {/* 1. Header: Brand & Document Info */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                ERSA <span className="text-sky-600">SOĞUTMA</span>
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-700 mt-1 uppercase tracking-wider">
              ERSA SOĞUTMA ISITMA SAN. VE TİC. LTD. ŞTİ.
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              Nenehatun Mah. Battal Gazi Cad. No:139/A • Darıca / KOCAELİ<br />
              Tel: 0262 653 41 00 • GSM: 0552 584 30 73 • E-posta: info@ersasogutma.com.tr
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded">
              SİPARİŞ FORMU
            </div>
            <div className="mt-2 text-xs">
              <span className="text-slate-500 font-medium">Sipariş No: </span>
              <strong className="font-mono text-slate-900 text-sm font-bold">#{order.orderNumber}</strong>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
              Tarih: {formattedDate}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
              Yazdırma: {printTime}
            </div>
          </div>
        </div>

        {/* 2. Customer / Dealer Information & Order Details */}
        <div className="grid grid-cols-2 gap-4 mb-5 ersa-print-page-break-avoid">
          {/* Bayi / Firma Bilgileri */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-[10px] space-y-1">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between">
              <span>Bayi / Müşteri Bilgileri</span>
              <span className="text-sky-600 font-normal">B2B Müşteri</span>
            </h3>
            <div>
              <span className="text-slate-500 font-medium">Firma Ünvanı: </span>
              <strong className="text-slate-900 text-[11px] font-bold">{order.companyName || '—'}</strong>
            </div>
            {order.userName && (
              <div>
                <span className="text-slate-500">Yetkili Kişi: </span>
                <span className="text-slate-800 font-semibold">{order.userName}</span>
              </div>
            )}
            {(order.taxOffice || order.taxNumber) && (
              <div>
                <span className="text-slate-500">Vergi Dairesi / No: </span>
                <span className="font-mono text-slate-800">
                  {order.taxOffice || '—'} / {order.taxNumber || '—'}
                </span>
              </div>
            )}
            {order.address && (
              <div>
                <span className="text-slate-500">Adres: </span>
                <span className="text-slate-700">{order.address}</span>
              </div>
            )}
            {(order.phone || order.email) && (
              <div>
                <span className="text-slate-500">İletişim: </span>
                <span className="font-mono text-slate-700">{order.phone || ''} {order.email ? `• ${order.email}` : ''}</span>
              </div>
            )}
          </div>

          {/* Sipariş & Sevkiyat Bilgileri */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-[10px] space-y-1">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between">
              <span>Sipariş & Ödeme Bilgileri</span>
              <span className="text-emerald-700 font-normal">{translateOrderStatus(order.status)}</span>
            </h3>
            <div>
              <span className="text-slate-500">Ödeme Şekli: </span>
              <strong className="text-slate-900 font-semibold">{paymentMethodLabel}</strong>
            </div>
            <div>
              <span className="text-slate-500">Sipariş Durumu: </span>
              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200 font-bold text-slate-800 text-[9px]">
                {translateOrderStatus(order.status)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Para Birimi: </span>
              <span className="font-bold text-slate-900">{order.currency || 'TRY (Türk Lirası)'}</span>
            </div>
            <div>
              <span className="text-slate-500">Toplam Kalem: </span>
              <span className="font-bold text-slate-900">{order.items.length} Ürün Kalemi</span>
            </div>
            {order.orderNote && (
              <div className="pt-1 border-t border-slate-200 text-slate-600 italic">
                <span className="text-slate-500 font-not-italic font-bold">Not: </span>
                {order.orderNote}
              </div>
            )}
          </div>
        </div>

        {/* 3. Product Items Table */}
        <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead className="ersa-print-table-header bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center border-r border-slate-200">#</th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200">Ürün Kodu</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Ürün Adı</th>
                <th className="py-2.5 px-3 w-16 text-center border-r border-slate-200">Miktar</th>
                <th className="py-2.5 px-3 w-24 text-right border-r border-slate-200">Birim Fiyat (KDV Hariç)</th>
                <th className="py-2.5 px-3 w-20 text-right border-r border-slate-200">İskonto</th>
                <th className="py-2.5 px-3 w-24 text-right">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {order.items.map((item, idx) => {
                const qty = Number(item.quantity || 1);
                const unit = item.unit || 'ADET';
                const unitPrice = Number(item.unitNetExVat || 0);
                const discount = Number(item.discountAmt || 0);
                const lineGross = Number(item.lineGross || (unitPrice * qty * 1.2));

                return (
                  <tr key={item.id || idx} className="ersa-print-table-row hover:bg-slate-50">
                    <td className="py-2 px-3 text-center text-slate-500 font-mono border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-sky-700 border-r border-slate-200">
                      {item.sku}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {item.name}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-semibold border-r border-slate-200">
                      {qty} {unit}
                    </td>
                    <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                      {formatCurrency(unitPrice)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700 border-r border-slate-200">
                      {discount > 0 ? formatCurrency(discount) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(lineGross)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Summary Breakdown */}
        <div className="flex justify-end mb-6 ersa-print-page-break-avoid">
          <div className="w-72 bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Ara Toplam (KDV Hariç):</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(order.subtotalExVat)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Toplam Bayi İskontosu:</span>
                <span className="font-mono font-bold">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Hesaplanan KDV (%20):</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(order.vatTotal)}</span>
            </div>

            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
              <span className="font-black text-slate-900 text-xs uppercase">Genel Toplam:</span>
              <span className="font-mono font-black text-sm text-slate-900">{formatCurrency(order.grandTotal)}</span>
            </div>
            <div className="text-[9px] text-slate-400 text-right">KDV Dahil Net Ödenecek / Borç</div>
          </div>
        </div>

        {/* 5. Signature / Stamp & Legal Disclaimer */}
        <div className="pt-4 border-t border-slate-200 ersa-print-page-break-avoid">
          <div className="grid grid-cols-2 gap-10 text-[10px] text-center mb-6">
            <div className="space-y-12">
              <span className="font-bold text-slate-700 block uppercase tracking-wider">
                Teslim Eden (Ersa Soğutma Isıtma San. ve Tic. Ltd. Şti.)
              </span>
              <div className="border-t border-slate-300 w-48 mx-auto text-slate-400 text-[9px] pt-1">
                İmza / Kaşe
              </div>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-700 block uppercase tracking-wider">
                Teslim Alan (Bayi / Müşteri Yetkilisi)
              </span>
              <div className="border-t border-slate-300 w-48 mx-auto text-slate-400 text-[9px] pt-1">
                İmza / Kaşe
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 text-center border-t border-slate-100 pt-3 leading-relaxed">
            Bu belge, Ersa Soğutma B2B Bayi Portalı üzerinden elektronik olarak üretilmiştir.<br />
            Ürün teslimatında koli/paket kontrolü yapılması, hasarlı veya eksik teslimatlarda kargo tutanağı tutulması zorunludur.
          </div>
        </div>
      </div>
    </>
  );
}
