import * as XLSX from 'xlsx';

export interface ExportOrderItem {
  id?: string;
  name?: string;
  sku?: string;
  quantity?: number;
  unit?: string;
  unitNetExVat?: number;
  discountAmt?: number;
  lineGross?: number;
  vatRate?: number;
}

export interface ExportOrder {
  id: string;
  orderNumber?: string;
  orderNo?: string;
  createdAt: string;
  companyName?: string;
  userName?: string;
  status: string;
  subtotalExVat?: number;
  vatTotal?: number;
  grandTotal: number;
  currency?: string;
  paymentMethod?: string;
  orderNote?: string;
  items?: ExportOrderItem[];
}

export function translateOrderStatus(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'Onaylandı';
    case 'PREPARING':
      return 'Hazırlanıyor';
    case 'SHIPPED':
      return 'Sevkiyatta / Kargoda';
    case 'DELIVERED':
      return 'Teslim Edildi';
    case 'CANCELLED':
      return 'İptal Edildi';
    case 'PENDING_APPROVAL':
    case 'PENDING':
      return 'Onay Bekliyor';
    case 'PENDING_LIMIT_APPROVAL':
      return 'Limit Onayı Bekliyor';
    default:
      return status;
  }
}

export function buildOrderExportRows(orders: ExportOrder[]): any[] {
  const exportRows: any[] = [];

  for (const order of orders) {
    const orderNum = order.orderNumber || order.orderNo || order.id;
    const orderDate = new Date(order.createdAt).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const company = order.companyName || 'Belirtilmedi';
    const statusText = translateOrderStatus(order.status);
    const grandTotalTRY = Number(order.grandTotal || 0);
    const subtotalTRY = Number(order.subtotalExVat || 0);
    const vatTRY = Number(order.vatTotal || 0);

    // If order has line items, export each product line with order details
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const qty = Number(item.quantity || 1);
        const unit = item.unit || 'ADET';
        const unitPrice = Number(item.unitNetExVat || 0);
        const discount = Number(item.discountAmt || 0);
        const itemLineNet = Number((unitPrice * qty).toFixed(2));
        const itemLineGross = Number(item.lineGross || (itemLineNet * 1.2).toFixed(2));
        const itemVat = Number((itemLineGross - itemLineNet).toFixed(2));

        exportRows.push({
          'Sipariş Numarası': orderNum,
          'Sipariş Tarihi': orderDate,
          'Bayi / Firma Adı': company,
          'Sipariş Durumu': statusText,
          'Ürün Adı': item.name || '—',
          'Ürün Kodu': item.sku || '—',
          'Miktar': `${qty} ${unit}`,
          'Birim Fiyat (TL)': unitPrice,
          'İskonto (TL)': discount,
          'Ara Toplam (TL)': itemLineNet,
          'KDV (TL)': itemVat,
          'Genel Toplam (TL)': itemLineGross
        });
      }
    } else {
      // Order without loaded line items
      exportRows.push({
        'Sipariş Numarası': orderNum,
        'Sipariş Tarihi': orderDate,
        'Bayi / Firma Adı': company,
        'Sipariş Durumu': statusText,
        'Ürün Adı': 'Toplu Sipariş',
        'Ürün Kodu': '—',
        'Miktar': '1 Paket',
        'Birim Fiyat (TL)': subtotalTRY,
        'İskonto (TL)': 0,
        'Ara Toplam (TL)': subtotalTRY,
        'KDV (TL)': vatTRY,
        'Genel Toplam (TL)': grandTotalTRY
      });
    }
  }

  return exportRows;
}

export function exportOrdersToExcel(
  orders: ExportOrder[],
  customFilename?: string
): boolean {
  if (!orders || orders.length === 0) {
    throw new Error('Dışa aktarılacak sipariş bulunamadı.');
  }

  const exportRows = buildOrderExportRows(orders);

  // Create worksheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Set column widths for optimal reading
  worksheet['!cols'] = [
    { wch: 18 }, // Sipariş Numarası
    { wch: 18 }, // Sipariş Tarihi
    { wch: 28 }, // Bayi / Firma Adı
    { wch: 18 }, // Sipariş Durumu
    { wch: 35 }, // Ürün Adı
    { wch: 16 }, // Ürün Kodu
    { wch: 12 }, // Miktar
    { wch: 16 }, // Birim Fiyat
    { wch: 14 }, // İskonto
    { wch: 16 }, // Ara Toplam
    { wch: 14 }, // KDV
    { wch: 18 }  // Genel Toplam
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siparisler');

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `ersa-sogutma-siparisler-${todayStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
  return true;
}
