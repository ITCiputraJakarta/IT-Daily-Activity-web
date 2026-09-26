const LS_LOGO_KEY = 'hcj_it_custom_logo_v1';

export function getCustomLogo(): string | null {
  try {
    return localStorage.getItem(LS_LOGO_KEY);
  } catch {
    return null;
  }
}

export function saveCustomLogo(logoDataUrl: string): void {
  try {
    localStorage.setItem(LS_LOGO_KEY, logoDataUrl);
  } catch (e) {
    console.warn('Failed to save custom logo to localStorage:', e);
  }
}

export function removeCustomLogo(): void {
  try {
    localStorage.removeItem(LS_LOGO_KEY);
  } catch (e) {
    console.warn('Failed to remove custom logo from localStorage:', e);
  }
}
