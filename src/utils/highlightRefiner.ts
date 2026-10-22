import { WeeklyHighlightItem } from '../types';

/**
 * Common translation dictionary and phrase mappers for Hotel Ciputra Jakarta IT Operations.
 * Translates Indonesian daily logs into concise, professional English core points.
 */
const VERB_MAPPINGS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^(ganti|mengganti|penggantian|replace)/i, replacement: 'Replace' },
  { pattern: /^(perbaikan|memperbaiki|benerin|fix|service)/i, replacement: 'Troubleshoot and fix' },
  { pattern: /^(tarik kabel|pasang kabel|penarikan kabel)/i, replacement: 'Install network cable' },
  { pattern: /^(pasang|memasang|instalasi|install|setup|set up)/i, replacement: 'Setup' },
  { pattern: /^(perapihan kabel|rapikan kabel|cable management)/i, replacement: 'Perform cable management' },
  { pattern: /^(cek rutin|pengecekan rutin|daily check|daily checking)/i, replacement: 'Daily check' },
  { pattern: /^(cek|pengecekan|memeriksa|pemeriksaan|inspect)/i, replacement: 'Inspect' },
  { pattern: /^(update|memperbarui|perbarui)/i, replacement: 'Update' },
  { pattern: /^(konfigurasi|setting|seting|configure)/i, replacement: 'Configure' },
  { pattern: /^(reset|me-reset)/i, replacement: 'Reset' },
  { pattern: /^(tambah|menambah|tambahkan)/i, replacement: 'Add' },
  { pattern: /^(hapus|menghapus|remove)/i, replacement: 'Remove' },
  { pattern: /^(restart|reboot)/i, replacement: 'Restart' },
  { pattern: /^(bersihkan|membersihkan|clean)/i, replacement: 'Clean' },
  { pattern: /^(reinstall|install ulang)/i, replacement: 'Reinstall' },
  { pattern: /^(monitoring|pantau|memantau)/i, replacement: 'Monitor' },
  { pattern: /^(sinkronisasi|sync)/i, replacement: 'Synchronize' },
  { pattern: /^(uji coba|testing|test)/i, replacement: 'Test and verify' },
];

const TERM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdigital signage\b/gi, 'digital signage'],
  [/\bsignage\b/gi, 'signage'],
  [/\bvelo device\b/gi, 'Velo router device'],
  [/\bvelo\b/gi, 'Velo Networks'],
  [/\bkabel lan\b/gi, 'LAN cable'],
  [/\bkabel\b/gi, 'cables'],
  [/\baccess point\b/gi, 'access point'],
  [/\bap\b/gi, 'AP'],
  [/\bswitch hub\b/gi, 'switch hub'],
  [/\bswitch\b/gi, 'switch'],
  [/\bprinter macet\b/gi, 'printer paper jam'],
  [/\bkertas macet\b/gi, 'paper jam'],
  [/\btinta habis\b/gi, 'ink cartridge'],
  [/\bisi tinta\b/gi, 'refill printer ink'],
  [/\bprinter\b/gi, 'printer'],
  [/\btamu vip\b/gi, 'VIP guest'],
  [/\btamu\b/gi, 'guest'],
  [/\bkamar\b/gi, 'Room'],
  [/\bruang\b/gi, 'Room'],
  [/\blantai\b/gi, 'Floor'],
  [/\blift\b/gi, 'elevator'],
  [/\blagu lift\b/gi, 'elevator background music'],
  [/\bmusik lift\b/gi, 'elevator background music'],
  [/\bgambar macet\b/gi, 'playback glitch'],
  [/\bvolume suara\b/gi, 'audio volume'],
  [/\btidak bisa konek\b/gi, 'connection issue'],
  [/\bgabisa konek\b/gi, 'connection issue'],
  [/\blemot\b/gi, 'slow bandwidth issue'],
  [/\bputus-putus\b/gi, 'intermittent connection'],
  [/\brusak\b/gi, 'malfunction'],
  [/\bmati total\b/gi, 'hardware failure'],
  [/\bsudah selesai\b/gi, ''],
  [/\bselesai\b/gi, ''],
  [/\bberhasil\b/gi, ''],
  [/\bdan aman\b/gi, ''],
  [/\buntuk\b/gi, 'for'],
  [/\bdi\b/gi, 'in'],
  [/\bdengan\b/gi, 'with'],
  [/\bdan\b/gi, 'and'],
  [/\bke\b/gi, 'to'],
  [/\bdari\b/gi, 'from'],
];

/**
 * Standardize capitalization for IT terms
 */
function fixItCapitalization(text: string): string {
  return text
    .replace(/\bpos\b/gi, 'POS')
    .replace(/\bpc\b/gi, 'PC')
    .replace(/\bcctv\b/gi, 'CCTV')
    .replace(/\blan\b/gi, 'LAN')
    .replace(/\bwifi\b/gi, 'WiFi')
    .replace(/\bwi-fi\b/gi, 'WiFi')
    .replace(/\bssid\b/gi, 'SSID')
    .replace(/\bvlan\b/gi, 'VLAN')
    .replace(/\bhr\b/gi, 'HR')
    .replace(/\bfo\b/gi, 'FO')
    .replace(/\bgm\b/gi, 'GM')
    .replace(/\bhk\b/gi, 'HK')
    .replace(/\bf&b\b/gi, 'F&B')
    .replace(/\bfb\b/gi, 'F&B')
    .replace(/\bap\b/gi, 'AP')
    .replace(/\btv\b/gi, 'TV')
    .replace(/\bqr code\b/gi, 'QR code')
    .replace(/\bqr\b/gi, 'QR')
    .replace(/\bvip\b/gi, 'VIP')
    .replace(/\bvelo\b/gi, 'Velo');
}

/**
 * Clean and format a single raw Indonesian or informal IT log into concise English core point
 */
export function formatSingleHighlightToEnglish(rawText: string): string {
  let cleaned = (rawText || '').trim();
  if (!cleaned) return '';

  // Remove leading numbers, bullets, checkboxes, timestamps (e.g. "1.", "- ", "[08:00]")
  cleaned = cleaned.replace(/^(\d+[\.\)\-:]|\-|\*|•|\[\d{1,2}:\d{2}\])\s*/i, '').trim();

  // Strip trailing notes like "(Done)", "[Done]", "(Selesai)"
  cleaned = cleaned.replace(/\s*[\(\[]?(done|selesai|ok|pending|in progress)[\)\]]?$/i, '').trim();

  // Apply verb transformations
  let matchedVerb = false;
  for (const { pattern, replacement } of VERB_MAPPINGS) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, replacement).trim();
      matchedVerb = true;
      break;
    }
  }

  // Apply vocabulary replacements
  for (const [pattern, rep] of TERM_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, rep);
  }

  // Clean excess spaces & fix casing
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  cleaned = fixItCapitalization(cleaned);

  // If no action verb was matched, prepend appropriate action verb if needed
  if (!matchedVerb && !/^[A-Z][a-z]+/.test(cleaned)) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  } else if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Enforce conciseness: if sentence is too long (> 16 words), condense to core subject
  const words = cleaned.split(' ');
  if (words.length > 15) {
    cleaned = words.slice(0, 14).join(' ');
  }

  return cleaned;
}

/**
 * Rule-based local refinement:
 * 1. Translates into concise English
 * 2. Normalizes & eliminates duplicate / redundant items
 * 3. Consolidates repeated daily routine tasks
 */
export function refineHighlightsLocally(
  items: Array<{ text: string; sourceDate?: string; clientDepartment?: string; pic?: string }>
): string[] {
  const seenKeys = new Set<string>();
  const refinedList: string[] = [];

  // Group repeated daily checks
  let hasDailyItCheck = false;
  let hasDailySignage = false;
  let hasDailyVelo = false;

  for (const item of items) {
    const raw = item.text || '';
    if (!raw.trim()) continue;

    // Detect repeated common daily routine checks
    const lower = raw.toLowerCase();
    if (lower.includes('daily check') || lower.includes('daily checking') || lower.includes('cek rutin it') || lower.includes('pengecekan it')) {
      if (!hasDailyItCheck) {
        hasDailyItCheck = true;
        refinedList.push('Perform daily IT infrastructure checks');
      }
      continue;
    }

    if (lower.includes('signage') && (lower.includes('update') || lower.includes('daily') || lower.includes('harian'))) {
      if (!hasDailySignage) {
        hasDailySignage = true;
        refinedList.push('Update and verify daily digital signage content');
      }
      continue;
    }

    if (lower.includes('velo') && (lower.includes('check') || lower.includes('cek') || lower.includes('pantau'))) {
      if (!hasDailyVelo) {
        hasDailyVelo = true;
        refinedList.push('Monitor Velo router and backup line status');
      }
      continue;
    }

    const english = formatSingleHighlightToEnglish(raw);
    if (!english) continue;

    // Deduplication key (normalize punctuation and spaces)
    const normKey = english.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenKeys.has(normKey)) {
      seenKeys.add(normKey);
      refinedList.push(english);
    }
  }

  return refinedList;
}
