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
    image?: string | null;
    imageUrl?: string | null;
  }>;
}

interface OrderPrintDocumentProps {
  order: OrderPrintData;
  className?: string;
  isPreview?: boolean;
}

export function OrderPrintDocument({ order, className = '', isPreview = false }: OrderPrintDocumentProps) {
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
      {!isPreview && (
        <style jsx global>{`
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }

          @media print {
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              font-size: 8.5pt !important;
              line-height: 1.25 !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Completely collapse non-printable layout elements to 0 height */
            .no-print,
            .print\\:hidden,
            .print-hidden,
            header,
            nav,
            aside,
            footer,
            [role="navigation"],
            button,
            a[href^="/"] {
              display: none !important;
            }

            #order-print-document {
              display: block !important;
              position: relative !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
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

            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              max-width: 36px !important;
              max-height: 36px !important;
              object-fit: cover !important;
            }
          }
        `}</style>
      )}

      {/* Document Layout (A4 styled) */}
      <div
        id={isPreview ? 'order-print-preview' : 'order-print-document'}
        className={`ersa-print-wrapper bg-white text-slate-900 font-sans p-6 sm:p-8 print:p-0 max-w-4xl mx-auto border border-slate-200 print:border-none rounded-2xl print:rounded-none shadow-sm print:shadow-none ${className}`}
      >
        {/* 1. Header: Brand & Document Info */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo/brand-emblem-light.png"
              alt="Ersa Soğutma Logo"
              className="w-12 h-12 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  ERSA <span className="text-orange-600">SOĞUTMA</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                  B2B
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-700 mt-0.5 uppercase tracking-wider">
                ERSA SOĞUTMA ISITMA SAN. VE TİC. LTD. ŞTİ.
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Nenehatun Mah. Battal Gazi Cad. No:139/A • Darıca / KOCAELİ<br />
                Tel: 0262 653 41 00 • GSM: 0552 584 30 73 • E-posta: info@ersasogutma.com.tr
              </p>
            </div>
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
                <th className="py-2 px-2 w-7 text-center border-r border-slate-200">#</th>
                <th className="py-2 px-2 w-12 text-center border-r border-slate-200">Görsel</th>
                <th className="py-2 px-2.5 w-24 border-r border-slate-200">Ürün Kodu</th>
                <th className="py-2 px-3 border-r border-slate-200">Ürün Adı</th>
                <th className="py-2 px-2.5 w-14 text-center border-r border-slate-200">Miktar</th>
                <th className="py-2 px-2.5 w-24 text-right border-r border-slate-200">Birim Fiyat</th>
                <th className="py-2 px-2 w-16 text-right border-r border-slate-200">İskonto</th>
                <th className="py-2 px-2.5 w-24 text-right">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {order.items.map((item, idx) => {
                const qty = Number(item.quantity || 1);
                const unit = item.unit || 'ADET';
                const unitPrice = Number(item.unitNetExVat || 0);
                const discount = Number(item.discountAmt || 0);
                const lineGross = Number(item.lineGross || (unitPrice * qty * 1.2));
                const itemImg = item.image || item.imageUrl || '/placeholder.svg';

                return (
                  <tr key={item.id || idx} className="ersa-print-table-row hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center text-slate-500 font-mono border-r border-slate-200 text-[9px]">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2 text-center border-r border-slate-200">
                      <div className="w-8 h-8 mx-auto rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                        <img
                          src={itemImg}
                          alt={item.name}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 font-mono font-bold text-sky-700 border-r border-slate-200 text-[10px]">
                      {item.sku}
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-slate-900 border-r border-slate-200 text-[10px]">
                      {item.name}
                    </td>
                    <td className="py-1.5 px-2.5 text-center font-mono font-semibold border-r border-slate-200 text-[10px]">
                      {qty} {unit}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono border-r border-slate-200 text-[10px]">
                      {formatCurrency(unitPrice)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-emerald-700 border-r border-slate-200 text-[10px]">
                      {discount > 0 ? formatCurrency(discount) : '—'}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 text-[10px]">
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
        <div className="pt-3 border-t border-slate-200 ersa-print-page-break-avoid">
          <div className="grid grid-cols-2 gap-10 text-[10px] text-center mb-4 print:mb-2">
            <div className="space-y-8 print:space-y-6">
              <span className="font-bold text-slate-700 block uppercase tracking-wider">
                Teslim Eden (Ersa Soğutma Isıtma San. ve Tic. Ltd. Şti.)
              </span>
              <div className="border-t border-slate-300 w-48 mx-auto text-slate-400 text-[9px] pt-1">
                İmza / Kaşe
              </div>
            </div>

            <div className="space-y-8 print:space-y-6">
              <span className="font-bold text-slate-700 block uppercase tracking-wider">
                Teslim Alan (Bayi / Müşteri Yetkilisi)
              </span>
              <div className="border-t border-slate-300 w-48 mx-auto text-slate-400 text-[9px] pt-1">
                İmza / Kaşe
              </div>
            </div>
          </div>

          <div className="text-[9px] print:text-[8px] text-slate-400 text-center border-t border-slate-100 pt-2 leading-relaxed">
            Bu belge, Ersa Soğutma B2B Bayi Portalı üzerinden elektronik olarak üretilmiştir.<br />
            Ürün teslimatında koli/paket kontrolü yapılması, hasarlı veya eksik teslimatlarda kargo tutanağı tutulması zorunludur.
          </div>
        </div>
      </div>
    </>
  );
}
