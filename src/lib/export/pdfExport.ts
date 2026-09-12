/**
 * Client-side PDF export utility for Orders and Invoices
 * Uses html2pdf.js dynamically to produce crisp A4 PDF documents.
 */

export interface PdfExportOptions {
  filename?: string;
  marginMm?: [number, number, number, number];
}

export async function downloadElementAsPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[pdfExport] Element #${elementId} bulunamadı.`);
    return false;
  }

  const filename = options.filename || 'Siparis_Formu.pdf';
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const marginMm = options.marginMm || [8, 8, 8, 8];

  try {
    // Dynamic import to prevent any SSR compilation issue
    // @ts-ignore
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: marginMm,
      filename: cleanFilename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (err) {
    console.error('[pdfExport] PDF indirme hatası:', err);
    return false;
  }
}
