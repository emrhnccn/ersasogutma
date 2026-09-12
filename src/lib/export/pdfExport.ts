/**
 * High-performance, bulletproof client-side PDF export for Orders and Invoices.
 * Optimized specifically for large multi-page orders (e.g. 60+ items).
 * 
 * Key Architectural Safeguards:
 * 1. Isolated Offscreen Iframe Capture:
 *    Prevents html2canvas from cloning and traversing the entire host application DOM
 *    (e.g. 10,000+ admin dashboard nodes, sidebars, charts, modals).
 * 2. Instant Non-Blocking Image Sanitization:
 *    All images are verified with a 300ms max timeout. Failed or slow images are
 *    immediately replaced with a zero-delay PNG Base64 placeholder.
 * 3. Diagnostic Metrics Logging:
 *    Outputs items, preview dimensions, image counts, render times, and page count.
 * 4. Adaptive Canvas Scaling:
 *    1.25x (~135 DPI) for large multi-page documents (> 2000px), 1.5x for standard.
 * 5. Pixel-Level Canvas Verification:
 *    Validates that the rendered canvas contains real text/tables before PDF generation.
 * 6. Multi-Page A4 Slicing:
 *    Flawlessly slices long documents across continuous A4 pages in jsPDF.
 */

import { PRODUCT_PLACEHOLDER_PNG_BASE64 } from './productPlaceholderPng';

export interface PdfExportOptions {
  filename?: string;
  marginMm?: number;
}

/**
 * Ensures all images inside the element are ready without blocking the export.
 * Pending images are given at most 300ms; any failed, slow, or 0-dimension image
 * is immediately replaced with the instant PNG placeholder.
 */
async function ensureAllImagesLoaded(element: HTMLElement): Promise<{
  totalImages: number;
  loadedImages: number;
  failedImages: number;
}> {
  const images = Array.from(element.querySelectorAll('img'));
  let loadedCount = 0;
  let failedCount = 0;

  await Promise.all(
    images.map(async (img) => {
      try {
        // If image is already a Base64 data URL, it is instant
        if (img.src && img.src.startsWith('data:')) {
          loadedCount++;
          return;
        }

        // If not yet complete, wait up to 300ms
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
            setTimeout(onDone, 300);
          });
        }

        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          loadedCount++;
        } else {
          img.src = PRODUCT_PLACEHOLDER_PNG_BASE64;
          failedCount++;
        }
      } catch {
        img.src = PRODUCT_PLACEHOLDER_PNG_BASE64;
        failedCount++;
      }
    })
  );

  return {
    totalImages: images.length,
    loadedImages: loadedCount,
    failedImages: failedCount
  };
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

  // Sample every 4th pixel (step = 16 bytes) for maximum performance
  for (let i = 0; i < imgData.length; i += 16) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];

    // Check for dark text/border pixels (#0f172a, slate text: r < 90, g < 90, b < 90, a > 180)
    if (a > 180 && r < 90 && g < 90 && b < 90) {
      darkPixels++;
    }
  }

  if (darkPixels < 800) {
    return {
      isValid: false,
      darkPixels,
      reason: `Canvas yeterli metin/çizgi pikseli içermiyor (${darkPixels} tespit edildi). Belge boş çıkmış olabilir.`
    };
  }

  return { isValid: true, darkPixels };
}

/**
 * Captures an element inside an isolated offscreen iframe.
 * This guarantees html2canvas only clones and traverses the order document,
 * avoiding the 10,000+ DOM nodes of the admin dashboard.
 */
async function captureElementInIsolatedIframe(
  sourceElement: HTMLElement,
  adaptiveScale: number
): Promise<HTMLCanvasElement> {
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default || html2canvasModule;

  // 1. Create offscreen iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1024px';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('İzole iframe dökümanına erişilemedi');
    }

    // 2. Setup clean HTML shell in iframe
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Sipariş Belgesi</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff !important;
      color: #0f172a !important;
      width: 1024px;
      min-width: 1024px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    img {
      max-width: 100%;
    }
  </style>
</head>
<body style="background-color: #ffffff; color: #0f172a; margin: 0; padding: 24px;">
</body>
</html>`);
    iframeDoc.close();

    // 3. Copy stylesheets from parent document for identical typography and Tailwind styling
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    for (const styleNode of styleTags) {
      try {
        iframeDoc.head.appendChild(styleNode.cloneNode(true));
      } catch {
        // ignore clone error
      }
    }

    // 4. Clone source element and append to iframe body
    const cloned = sourceElement.cloneNode(true) as HTMLElement;
    cloned.id = 'order-print-isolated';
    cloned.style.width = '100%';
    cloned.style.maxWidth = '100%';
    cloned.style.margin = '0 auto';
    cloned.style.backgroundColor = '#ffffff';
    cloned.style.color = '#0f172a';

    // Remove any dark mode classes
    cloned.classList.remove('dark');
    cloned.querySelectorAll('.dark').forEach((el) => el.classList.remove('dark'));

    iframeDoc.body.appendChild(cloned);

    // 5. Wait for fonts if available
    if (typeof (document as any).fonts?.ready !== 'undefined') {
      try {
        await (document as any).fonts.ready;
      } catch {}
    }

    // 6. Ensure all images in cloned element are ready
    await ensureAllImagesLoaded(cloned);

    // Allow DOM layout and styles to settle
    await new Promise((resolve) => setTimeout(resolve, 60));

    const targetHeight = Math.max(cloned.scrollHeight, cloned.offsetHeight, 600);

    // 7. Capture cloned element with html2canvas inside the isolated iframe
    const canvasPromise = html2canvas(cloned, {
      scale: adaptiveScale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 3000,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1024,
      windowHeight: targetHeight,
      width: 1024,
      height: targetHeight,
      onclone: (clonedDoc, clonedElement) => {
        clonedDoc.documentElement.classList.remove('dark');
        clonedDoc.body.classList.remove('dark');
        clonedElement.classList.remove('dark');
        clonedElement.style.backgroundColor = '#ffffff';
        clonedElement.style.color = '#0f172a';
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('html2canvas oluşturma zaman aşımına uğradı (15s)')), 15000)
    );

    return await Promise.race([canvasPromise, timeoutPromise]);
  } finally {
    // Guaranteed cleanup of isolated iframe
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
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
    console.error(`[pdfExport] Hedef element bulunamadı:`, elementIdOrElement);
    return false;
  }

  const filename = options.filename || 'Siparis_Formu.pdf';
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  const h2cStartTime = Date.now();

  try {
    // 1. Diagnostics: Log item count, preview dimensions, scroll height
    const rows = element.querySelectorAll('tbody tr').length;
    const previewWidth = element.offsetWidth;
    const previewHeight = element.offsetHeight;
    const scrollHeight = element.scrollHeight;

    console.log(`[pdfExport] items: ${rows}`);
    console.log(`[pdfExport] previewSize: ${previewWidth} x ${previewHeight} (scrollHeight: ${scrollHeight})`);

    // 2. Fast non-blocking image sanitization on source element
    const imgStats = await ensureAllImagesLoaded(element);
    console.log(`[pdfExport] images: ${imgStats.totalImages}`);
    console.log(`[pdfExport] loadedImages: ${imgStats.loadedImages}`);
    console.log(`[pdfExport] failedImages: ${imgStats.failedImages}`);

    // 3. Adaptive scale calculation:
    // Large orders (> 2000px height, e.g. 60 items) use scale: 1.25 (~135 DPI, fast, crisp)
    // Smaller orders (<= 2000px) use scale: 1.5 (~160 DPI)
    const docHeight = Math.max(previewHeight, scrollHeight);
    const adaptiveScale = docHeight > 2000 ? 1.25 : 1.5;
    console.log(`[pdfExport] docHeight: ${docHeight}px, selected scale: ${adaptiveScale}`);

    // 4. Capture element via isolated iframe to avoid admin dashboard DOM bloat
    const canvas = await captureElementInIsolatedIframe(element, adaptiveScale);
    const h2cDuration = Date.now() - h2cStartTime;

    console.log(`[pdfExport] html2canvas completion time: ${h2cDuration}ms`);
    console.log(`[pdfExport] canvas size: ${canvas.width} x ${canvas.height}`);

    // 5. Verify canvas content: Ensure document is not blank
    const verification = verifyCanvasContent(canvas);
    if (!verification.isValid) {
      console.error('[pdfExport] Canvas doğrulama başarısız:', verification.reason);
      throw new Error(verification.reason);
    }
    console.log(`[pdfExport] Canvas doğrulandı (${verification.darkPixels} koyu metin pikseli tespit edildi)`);

    // 6. Convert canvas to JPEG image data
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 7. Multi-page A4 PDF creation
    const { jsPDF } = await import('jspdf');
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
    let pageCount = 1;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Additional pages if document spans multiple A4 pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pageCount++;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    console.log(`[pdfExport] generated PDF pages: ${pageCount}`);

    // 8. Direct browser download
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('[pdfExport] PDF oluşturma hatası:', err);
    return false;
  }
}
