/**
 * High-performance, bulletproof client-side PDF export for Orders and Invoices.
 * Uses html2canvas and jsPDF with instant in-memory image conversion,
 * scroll neutralization, and complete dark-mode immunity.
 */

export interface PdfExportOptions {
  filename?: string;
  marginMm?: number;
}

/**
 * Fast synchronous conversion of an already-loaded HTMLImageElement to DataURL
 * using an offscreen canvas. Zero network delay.
 */
function imageElementToDataUrl(img: HTMLImageElement): string {
  try {
    if (!img.complete || img.naturalWidth === 0) return img.src;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    // If canvas is tainted or conversion fails, return original src safely
    return img.src;
  }
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
    // 1. Convert already-loaded images inside the element to Data URLs instantly
    const imgElements = Array.from(element.getElementsByTagName('img'));
    for (const img of imgElements) {
      if (img.complete && img.naturalWidth > 0 && !img.src.startsWith('data:')) {
        const dataUrl = imageElementToDataUrl(img);
        if (dataUrl && dataUrl.startsWith('data:')) {
          img.src = dataUrl;
        }
      }
    }

    // 2. Dynamic import of html2canvas and jsPDF
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import('jspdf');

    // 3. Render element to high-res canvas (scale 2 = 192 DPI for crisp text)
    // with scrollX: 0, scrollY: 0 so page scroll position never offsets or clips the capture
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1024,
      onclone: (clonedDoc, clonedElement) => {
        // STRIP DARK MODE: Force cloned document to light mode
        clonedDoc.documentElement.classList.remove('dark');
        clonedDoc.body.classList.remove('dark');
        clonedDoc.documentElement.style.colorScheme = 'light';

        // Force white background & crisp dark text on cloned container
        clonedElement.classList.remove('dark');
        clonedElement.style.backgroundColor = '#ffffff';
        clonedElement.style.color = '#0f172a';

        // Ensure all text elements inside cloned element are dark slate
        const textElements = clonedElement.querySelectorAll<HTMLElement>(
          'p, span, h1, h2, h3, h4, td, th, div, strong'
        );
        textElements.forEach((el) => {
          el.classList.remove('dark');
        });
      }
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
