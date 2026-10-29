import { LogBookItem } from '../types';

/**
 * Normalizes details text for robust matching (trims whitespace, collapses internal spaces, lowercases).
 */
export function normalizeActivityKey(details?: string): string {
  return (details || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Deduplicates and reorders log book activities for a specific date:
 * 1. Separates regular activities and routine activities.
 * 2. Deduplicates activities so that identical tasks (especially routine tasks) appear EXACTLY ONCE.
 *    If duplicates exist, it keeps the most complete one (the one with photoUrl, clientName, custom PIC, or non-default status).
 * 3. Enforces that routine activities ALWAYS stay at the VERY BOTTOM of the list.
 * 4. Renumbers all activities sequentially from 1 to N without gaps or duplicate numbers.
 */
export function sanitizeAndDeduplicateActivities(
  activities: LogBookItem[] | undefined | null,
  excludedRoutineIds: string[] = []
): LogBookItem[] {
  if (!Array.isArray(activities) || activities.length === 0) {
    return [];
  }

  const excludedKeys = new Set(excludedRoutineIds.map((k) => normalizeActivityKey(k)));

  const regularBlankSlots: LogBookItem[] = [];
  const regularFilledMap = new Map<string, LogBookItem>();
  const routineMap = new Map<string, LogBookItem>();

  activities.forEach((item) => {
    if (!item) return;

    const details = (item.details || '').trim();
    const isRoutine = Boolean(item.isRoutine);
    const key = normalizeActivityKey(details);

    // Empty blank slots for input
    if (!details) {
      if (!isRoutine) {
        regularBlankSlots.push({ ...item, no: 0 });
      }
      return;
    }

    // If it's a routine item that was excluded for this specific date, skip it!
    if (isRoutine && (excludedKeys.has(key) || excludedKeys.has(item.id))) {
      return;
    }

    const targetMap = isRoutine ? routineMap : regularFilledMap;
    const existing = targetMap.get(key);

    if (existing) {
      // Pick the better version (prioritize photo, custom PIC, custom client, non-default status)
      const currentQuality =
        (item.pictureUrl ? 10 : 0) +
        (item.clientName?.trim() ? 3 : 0) +
        (item.pic && item.pic !== 'IT Team' && item.pic !== 'IT Team of HCJ' ? 2 : 0) +
        (item.status && item.status !== 'Done' ? 2 : 0);

      const existingQuality =
        (existing.pictureUrl ? 10 : 0) +
        (existing.clientName?.trim() ? 3 : 0) +
        (existing.pic && existing.pic !== 'IT Team' && existing.pic !== 'IT Team of HCJ' ? 2 : 0) +
        (existing.status && existing.status !== 'Done' ? 2 : 0);

      if (currentQuality > existingQuality) {
        targetMap.set(key, { ...item, isRoutine });
      }
    } else {
      // If a regular item already has this key, don't duplicate it in routine
      if (isRoutine && regularFilledMap.has(key)) {
        // Upgrade the regular item to mark as routine if applicable
        const reg = regularFilledMap.get(key)!;
        regularFilledMap.set(key, { ...reg, isRoutine: true });
        return;
      }
      targetMap.set(key, { ...item, isRoutine });
    }
  });

  // If any item in regularFilledMap was marked routine, move it to routineMap
  const regularFilledList: LogBookItem[] = [];
  regularFilledMap.forEach((item, key) => {
    if (item.isRoutine) {
      if (!routineMap.has(key)) {
        routineMap.set(key, item);
      }
    } else {
      regularFilledList.push(item);
    }
  });

  const routineList: LogBookItem[] = Array.from(routineMap.values());

  // Regular activities ALWAYS first (unfilled slots + filled regular items),
  // Routine activities ALWAYS at the VERY BOTTOM.
  const combined = [...regularBlankSlots, ...regularFilledList, ...routineList];

  // Renumber 1..N sequentially
  return combined.map((act, idx) => ({
    ...act,
    no: idx + 1,
  }));
}
