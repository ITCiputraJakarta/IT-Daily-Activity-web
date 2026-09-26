import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Exports one or more HTML elements as an A4 PDF document.
 * Each element passed will be rendered on a separate A4 page.
 * Uses html2canvas-pro with full support for modern CSS color spaces including OKLCH.
 */
export async function exportElementsToA4Pdf(
  elements: HTMLElement[],
  filename: string,
  onProgress?: (progress: number, status: string) => void
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const a4WidthMm = 210;
  const a4HeightMm = 297;

  // Temporary canvas to safely resolve any potential color functions
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (onProgress) {
      onProgress(
        Math.round((i / elements.length) * 100),
        `Rendering halaman ${i + 1} dari ${elements.length}...`
      );
    }

    // Crucial: Wait for all images in element (custom logo, evidence photos, MRTG graphs) to be fully loaded & decoded
    const images = Array.from(el.querySelectorAll('img'));
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
          }
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 2500); // 2.5s fallback timeout
          });
        })
      );
    }

    // Brief 80ms tick to ensure browser layout & rendering pipeline is settled
    await new Promise((resolve) => setTimeout(resolve, 80));

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const canvas = await html2canvas(el, {
      scale: 2, // 2x scale for crisp high-resolution print quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794, // Standard A4 96 DPI pixel width (210mm)
      onclone: (clonedDoc: Document) => {
        // Pre-process any style tags containing oklch to standard rgb
        if (tempCtx) {
          const styleElements = clonedDoc.querySelectorAll('style');
          const oklchRegex = /oklch\([^)]+\)/gi;
          styleElements.forEach((styleTag) => {
            if (styleTag.textContent && oklchRegex.test(styleTag.textContent)) {
              styleTag.textContent = styleTag.textContent.replace(oklchRegex, (match) => {
                try {
                  tempCtx.fillStyle = match;
                  return tempCtx.fillStyle;
                } catch {
                  return match;
                }
              });
            }
          });
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress(100, 'Menyelesaikan berkas PDF...');
  }

  pdf.save(filename);
}

/**
 * Triggers native browser print dialog with A4 print layout
 */
export function triggerNativePrint(): void {
  window.print();
}
