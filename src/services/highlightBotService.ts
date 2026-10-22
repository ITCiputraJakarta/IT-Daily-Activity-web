import { WeeklyHighlightItem } from '../types';
import { refineHighlightsLocally, formatSingleHighlightToEnglish } from '../utils/highlightRefiner';

export interface BotRefineResult {
  items: WeeklyHighlightItem[];
  duplicatesRemoved: number;
  totalRefined: number;
  source: 'gemini' | 'rule-engine';
}

/**
 * Refines weekly highlights:
 * - Option 1: Strictly in English, concise (core points only), duplicates removed, grammar fixed.
 * - Tries Gemini 3.8 Flash via backend /api/refine-highlights.
 * - Seamlessly falls back to local IT rule engine if offline or no API key.
 */
export async function refineWeeklyHighlightsWithBot(
  currentItems: WeeklyHighlightItem[]
): Promise<BotRefineResult> {
  const originalCount = currentItems.length;
  if (originalCount === 0) {
    return {
      items: [],
      duplicatesRemoved: 0,
      totalRefined: 0,
      source: 'rule-engine',
    };
  }

  const rawTexts = currentItems.map((it) => it.text).filter((t) => t && t.trim() !== '');

  // 1. Try server-side Gemini 3.8 Flash API
  try {
    const res = await fetch('/api/refine-highlights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: rawTexts }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.refined) && data.refined.length > 0) {
        const refinedItems: WeeklyHighlightItem[] = data.refined.map((text: string, idx: number) => {
          // match metadata from original if possible
          const original = currentItems[idx] || {};
          return {
            id: original.id || `wh-refined-${Date.now()}-${idx + 1}`,
            no: idx + 1,
            text: text.trim(),
            sourceDate: original.sourceDate,
            clientDepartment: original.clientDepartment,
            clientName: original.clientName,
            pic: original.pic,
            status: original.status,
          };
        });

        const duplicatesRemoved = Math.max(0, originalCount - refinedItems.length);
        return {
          items: refinedItems,
          duplicatesRemoved,
          totalRefined: refinedItems.length,
          source: data.source === 'gemini' ? 'gemini' : 'rule-engine',
        };
      }
    }
  } catch (err) {
    console.warn('Backend refine endpoint failed or unavailable, using local engine:', err);
  }

  // 2. Fallback to intelligent local rule engine
  const localRefined = refineHighlightsLocally(currentItems);
  const refinedItems: WeeklyHighlightItem[] = localRefined.map((text, idx) => {
    const original = currentItems[idx] || {};
    return {
      id: original.id || `wh-refined-${Date.now()}-${idx + 1}`,
      no: idx + 1,
      text,
      sourceDate: original.sourceDate,
      clientDepartment: original.clientDepartment,
      clientName: original.clientName,
      pic: original.pic,
      status: original.status,
    };
  });

  const duplicatesRemoved = Math.max(0, originalCount - refinedItems.length);
  return {
    items: refinedItems,
    duplicatesRemoved,
    totalRefined: refinedItems.length,
    source: 'rule-engine',
  };
}

export { formatSingleHighlightToEnglish };
