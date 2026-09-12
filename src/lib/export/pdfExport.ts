/**
 * Client-side direct PDF export utility for Orders and Invoices.
 * Uses html2canvas and jsPDF to render DOM elements to canvas
 * and automatically trigger file download without opening the print dialog.
 * 
 * Includes CORS-safe image pre-fetching and base64 data URL conversion
 * to prevent tainted canvases and CORS blocking errors.
 */

export interface PdfExportOptions {
  filename?: string;
  marginMm?: number;
}

/**
 * Converts an image src to a base64 data URL via the proxy-image endpoint
 * or direct fetch if same-origin.
 */
async function toDataUrl(src: string): Promise<string> {
  if (!src || src.startsWith('data:')) return src;

  try {
    const isRemote = src.startsWith('http://') || src.startsWith('https://');
    const fetchUrl = isRemote
      ? `/api/proxy-image?url=${encodeURIComponent(src)}`
      : src;

    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    const blob = await res.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('/placeholder.svg');
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[pdfExport] Image to DataURL conversion failed for: ${src}`, err);
    return '/placeholder.svg';
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
    // 1. Convert all img sources inside the element to Data URLs ahead of time
    const imgElements = Array.from(element.getElementsByTagName('img'));
    await Promise.all(
      imgElements.map(async (img) => {
        try {
          const currentSrc = img.currentSrc || img.src;
          if (currentSrc && !currentSrc.startsWith('data:')) {
            const dataUrl = await toDataUrl(currentSrc);
            if (dataUrl) {
              img.src = dataUrl;
            }
          }
        } catch {
          // ignore individual image errors
        }
      })
    );

    // 2. Wait for all images to complete loading
    await Promise.all(
      imgElements.map((img) => {
        if (img.complete) return Promise.resolve(null);
        return new Promise((resolve) => {
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null);
          setTimeout(resolve, 1500); // 1.5s fallback timeout
        });
      })
    );

    // 3. Dynamic import of html2canvas and jsPDF
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import('jspdf');

    // 4. Render element to high-res canvas (scale 2 = 192 DPI for crisp text)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (_clonedDoc, clonedElement) => {
        // Ensure white background and solid text color on cloned container
        clonedElement.style.backgroundColor = '#ffffff';
        clonedElement.style.color = '#0f172a';
      }
    });

    // 5. Convert canvas to JPEG image data
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 6. Initialize jsPDF in A4 portrait format
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

    // 7. Direct browser download trigger
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('[pdfExport] PDF oluşturma/indirme hatası:', err);
    return false;
  }
}
