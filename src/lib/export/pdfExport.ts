/**
 * Client-side direct PDF export utility for Orders and Invoices.
 * Uses html2canvas and jsPDF directly to render DOM elements to canvas
 * and automatically trigger file download without opening the print dialog.
 */

export interface PdfExportOptions {
  filename?: string;
  marginMm?: number;
}

export async function downloadElementAsPdf(
  elementIdOrElement: string | HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const element =
    typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

  if (!element) {
    console.error(`[pdfExport] Element bulunamadı:`, elementIdOrElement);
    return false;
  }

  const filename = options.filename || 'Siparis_Formu.pdf';
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    // 1. Wait for any pending images inside the container to load
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve(null);
        return new Promise((resolve) => {
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null);
          setTimeout(resolve, 1500); // 1.5s fallback timeout
        });
      })
    );

    // 2. Dynamic import of html2canvas and jsPDF
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import('jspdf');

    // 3. Render element to high-res canvas (scale 2 = 192 DPI for crisp text)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024
    });

    // 4. Convert canvas to JPEG image data
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 5. Initialize jsPDF in A4 portrait format
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Additional pages if order is longer than single A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // 6. Direct browser download trigger
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('[pdfExport] PDF oluşturma/indirme hatası:', err);
    return false;
  }
}
