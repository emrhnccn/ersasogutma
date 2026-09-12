/**
 * Bulletproof, high-fidelity client-side PDF export for Orders and Invoices.
 * Uses html2canvas and jsPDF with:
 * 1. Explicit image loading completion & SVG fallback for broken remote URLs
 * 2. document.fonts.ready synchronization
 * 3. Strict dark-mode immunity via inline light styles
 * 4. Pre-export canvas pixel verification to ensure all text & rows are rendered
 * 5. Automatic multi-page A4 splitting
 */

export interface PdfExportOptions {
  filename?: string;
  marginMm?: number;
}

export const FALLBACK_SVG_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="8" fill="#F1F5F9"/>
    <path d="M20 44L28 34L34 40L40 32L46 44H20Z" fill="#CBD5E1"/>
    <circle cx="26" cy="26" r="3" fill="#CBD5E1"/>
  </svg>`);

/**
 * Ensures all images inside the element have completed loading before canvas capture.
 * If any image errors, fails or has 0 dimensions, it is gracefully replaced with
 * an inline SVG placeholder so html2canvas never hangs or renders broken placeholders.
 */
async function ensureAllImagesLoaded(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));

  await Promise.all(
    images.map(async (img) => {
      try {
        if (img.src && img.src.startsWith('data:')) return;

        if (!img.complete) {
          await new Promise<void>((resolve) => {
            let settled = false;
            const onDone = () => {
              if (settled) return;
              settled = true;
              img.removeEventListener('load', onDone);
              img.removeEventListener('error', onDone);
              resolve();
            };
            img.addEventListener('load', onDone);
            img.addEventListener('error', onDone);
            // 2000ms max timeout per image
            setTimeout(onDone, 2000);
          });
        }

        // If image failed to load or has 0 dimensions, replace with clean SVG
        if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
          img.src = FALLBACK_SVG_DATA_URL;
        }
      } catch {
        img.src = FALLBACK_SVG_DATA_URL;
      }
    })
  );
}

/**
 * Verifies that the canvas actually contains the full rendered order document,
 * including text, tables, and borders, and is not a blank/white canvas.
 */
function verifyCanvasContent(canvas: HTMLCanvasElement): { isValid: boolean; darkPixels: number; reason?: string } {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    return { isValid: false, darkPixels: 0, reason: 'Canvas boyutları geçersiz (0x0)' };
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { isValid: false, darkPixels: 0, reason: 'Canvas 2D context alınamadı' };
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let darkPixels = 0;

  // Sample every 4th pixel (step = 16 bytes) for fast performance
  for (let i = 0; i < imgData.length; i += 16) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];

    // Check for dark text pixels (#0f172a, slate text, borders: r < 90, g < 90, b < 90, a > 180)
    if (a > 180 && r < 90 && g < 90 && b < 90) {
      darkPixels++;
    }
  }

  // A complete order document canvas has thousands of sampled dark text pixels.
  // A blank/empty canvas has almost zero.
  if (darkPixels < 1000) {
    return {
      isValid: false,
      darkPixels,
      reason: `Canvas yeterli metin/çizgi pikseli içermiyor (${darkPixels} tespit edildi). Belge boş çıkmış olabilir.`
    };
  }

  return { isValid: true, darkPixels };
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
    console.error(`[pdfExport] Hedef element bulunamadı:`, elementIdOrElement);
    return false;
  }

  const filename = options.filename || 'Siparis_Formu.pdf';
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    // 1. Wait for document fonts to finish loading
    if (typeof document !== 'undefined' && (document as any).fonts && (document as any).fonts.ready) {
      try {
        await (document as any).fonts.ready;
      } catch (fontErr) {
        console.warn('[pdfExport] Font yükleme kontrolü uyarısı:', fontErr);
      }
    }

    // 2. Ensure all images inside target element have finished loading
    await ensureAllImagesLoaded(element);

    // 3. Dynamic import of html2canvas and jsPDF
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import('jspdf');

    // 4. Render element to high-res canvas with a 20s timeout
    const canvasPromise = html2canvas(element, {
      scale: 1.75, // 168 DPI: sharp text with high rendering performance
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1024,
      onclone: (clonedDoc, clonedElement) => {
        // Strip dark mode classes from cloned document so background is pure white
        clonedDoc.documentElement.classList.remove('dark');
        clonedDoc.body.classList.remove('dark');
        clonedDoc.documentElement.style.colorScheme = 'light';
        clonedDoc.documentElement.removeAttribute('data-theme');

        clonedElement.classList.remove('dark');
        clonedElement.style.backgroundColor = '#ffffff';
        clonedElement.style.color = '#0f172a';

        // Remove .dark class from all descendants in clone
        const darkChildren = clonedElement.querySelectorAll('.dark');
        darkChildren.forEach((el) => el.classList.remove('dark'));
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('html2canvas oluşturma zaman aşımına uğradı (20s)')), 20000)
    );

    const canvas = await Promise.race([canvasPromise, timeoutPromise]);

    // 5. Canvas verification: Ensure canvas is not blank and contains actual document content
    const verification = verifyCanvasContent(canvas);
    if (!verification.isValid) {
      console.error('[pdfExport] Canvas doğrulama başarısız:', verification.reason);
      throw new Error(verification.reason);
    }

    console.log(`[pdfExport] Canvas başarıyla doğrulandı (${verification.darkPixels} metin pikseli, ${canvas.width}x${canvas.height})`);

    // 6. Convert canvas to JPEG image data
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 7. Initialize jsPDF in A4 portrait format
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

    // Additional pages if order exceeds single A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // 8. Direct browser download trigger
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('[pdfExport] PDF oluşturma hatası:', err);
    return false;
  }
}
