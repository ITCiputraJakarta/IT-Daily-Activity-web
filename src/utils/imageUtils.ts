/**
 * Image compression utility to compress camera or file uploads
 * into lightweight base64 data URLs (~30KB-60KB each)
 * Prevents Firestore document 1MB limit issues and speeds up export.
 */
export async function compressImage(file: File | Blob, maxWidth = 900, maxHeight = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw image with smooth scaling
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed jpeg
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Adaptive step-down if base64 string is > 90KB so multiple photos per report never exceed Firestore 1MB limit or LocalStorage quota
        let currentQ = quality;
        let currentScale = 1.0;
        while (dataUrl.length > 90000 && currentQ > 0.35) {
          currentQ = Math.max(0.35, currentQ - 0.08);
          currentScale *= 0.85;
          const stepCanvas = document.createElement('canvas');
          stepCanvas.width = Math.max(1, Math.round(width * currentScale));
          stepCanvas.height = Math.max(1, Math.round(height * currentScale));
          const stepCtx = stepCanvas.getContext('2d');
          if (!stepCtx) break;
          stepCtx.fillStyle = '#ffffff';
          stepCtx.fillRect(0, 0, stepCanvas.width, stepCanvas.height);
          stepCtx.drawImage(img, 0, 0, stepCanvas.width, stepCanvas.height);
          dataUrl = stepCanvas.toDataURL('image/jpeg', currentQ);
          if (currentQ <= 0.35) break;
        }

        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Format a Date object to Indonesian formatted date string
 * Example: "Saturday, 26 September 2026"
 */
export function formatReportDate(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Return current YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely adds or subtracts days from a YYYY-MM-DD date string without UTC timezone shift
 */
export function addDaysToDateString(dateString: string, days: number): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      date.setDate(date.getDate() + days);
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const da = String(date.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    }
  } catch (e) {
    console.error('Error shifting date:', e);
  }
  return dateString;
}
