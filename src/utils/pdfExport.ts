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

/**
 * Helper to configure the cloned document and element inside html2canvas
 * so that mobile/tablet devices export the exact desktop 1920x1080 Fit (or A4) layout.
 */
function prepareClonedDocForDesktopExport(
  clonedDoc: Document,
  originalElement: HTMLElement
): void {
  const isA4 = originalElement.getAttribute('data-layout') === 'a4';
  const targetWidth = isA4 ? 900 : 1240;

  // 1. Force iframe document & body to full desktop width (1920px)
  clonedDoc.documentElement.style.width = '1920px';
  clonedDoc.documentElement.style.minWidth = '1920px';
  clonedDoc.documentElement.style.overflow = 'visible';
  clonedDoc.documentElement.scrollTop = 0;
  clonedDoc.documentElement.scrollLeft = 0;

  clonedDoc.body.style.width = '1920px';
  clonedDoc.body.style.minWidth = '1920px';
  clonedDoc.body.style.overflow = 'visible';
  clonedDoc.body.scrollTop = 0;
  clonedDoc.body.scrollLeft = 0;

  // 2. Locate target element in cloned document
  const targetInClone =
    (originalElement.id ? clonedDoc.getElementById(originalElement.id) : null) ||
    clonedDoc.querySelector('#wa-report-card') as HTMLElement ||
    null;

  if (targetInClone) {
    targetInClone.style.width = `${targetWidth}px`;
    targetInClone.style.minWidth = `${targetWidth}px`;
    targetInClone.style.maxWidth = `${targetWidth}px`;
    targetInClone.style.transform = 'none';
    targetInClone.style.margin = '0 auto';
    targetInClone.style.boxSizing = 'border-box';

    // Ensure all ancestors in cloned DOM tree do not constrain width or clip overflow
    let curr: HTMLElement | null = targetInClone.parentElement;
    while (curr && curr !== clonedDoc.body) {
      curr.style.width = '100%';
      curr.style.maxWidth = 'none';
      curr.style.minWidth = '0';
      curr.style.overflow = 'visible';
      curr.style.transform = 'none';
      curr.style.padding = '0';
      curr.style.margin = '0';
      curr = curr.parentElement;
    }
  }

  // 3. Pre-process any style tags containing oklch color notation
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
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
}

/**
 * Exports a single DOM element (such as WA Report A4 / 1920x1080) as a high-resolution JPG image.
 * Guarantees Desktop 1920x1080 Fit layout even when downloaded on mobile or tablet devices.
 */
export async function exportElementToJpg(
  element: HTMLElement,
  filename: string,
  scale = 2
): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 2000);
        });
      })
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 80));

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 1920,
    windowHeight: 1080,
    scrollX: 0,
    scrollY: 0,
    ignoreElements: (el) => el.classList.contains('no-export'),
    onclone: (clonedDoc: Document) => {
      prepareClonedDocForDesktopExport(clonedDoc, element);
    },
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95)
  );

  const cleanFilename =
    filename.endsWith('.jpg') || filename.endsWith('.jpeg')
      ? filename
      : `${filename}.jpg`;

  if (!blob) {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = cleanFilename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = cleanFilename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exports a single DOM element (such as WA Report A4 / 1920x1080) as a high-resolution PNG image.
 * Guarantees Desktop 1920x1080 Fit layout even when downloaded on mobile or tablet devices.
 */
export async function exportElementToPng(
  element: HTMLElement,
  filename: string,
  scale = 2
): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 2000);
        });
      })
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 80));

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 1920,
    windowHeight: 1080,
    scrollX: 0,
    scrollY: 0,
    ignoreElements: (el) => el.classList.contains('no-export'),
    onclone: (clonedDoc: Document) => {
      prepareClonedDocForDesktopExport(clonedDoc, element);
    },
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );

  const cleanFilename = filename.endsWith('.png') ? filename : `${filename}.png`;

  if (!blob) {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = cleanFilename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = cleanFilename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Copies a rendered DOM element directly into the system clipboard as a PNG image.
 * This allows users to immediately paste (Ctrl+V) into WhatsApp Web or Desktop.
 * Guarantees Desktop 1920x1080 Fit layout even when triggered from mobile or tablet devices.
 */
export async function copyElementAsImageToClipboard(
  element: HTMLElement,
  scale = 2
): Promise<boolean> {
  try {
    const images = Array.from(element.querySelectorAll('img'));
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 1500);
          });
        })
      );
    }

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1920,
      windowHeight: 1080,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (el) => el.classList.contains('no-export'),
      onclone: (clonedDoc: Document) => {
        prepareClonedDocForDesktopExport(clonedDoc, element);
      },
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );

    if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Copy to clipboard failed:', err);
    return false;
  }
}
