import { WeeklyReport, WeeklyHighlightItem, DailyActivityReport } from '../types';
import { loadActivityReport } from '../services/firebase';
import { sanitizeAndDeduplicateActivities } from '../utils/activityDeduplicator';

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

/**
 * Format date string (YYYY-MM-DD) to "12 October 2026"
 */
export function formatWeeklyDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = MONTH_NAMES_EN[month] || `Month ${parts[1]}`;
  return `${day} ${monthName} ${year}`;
}

/**
 * Given a date string (YYYY-MM-DD), find Monday (start of week) and Sunday (end of week).
 */
export function getWeekRangeFromDate(dateStr: string): {
  startDate: string;
  endDate: string;
  year: number;
  month: number;
  weekNumber: number;
  weekLabel: string;
  dateRangeFormatted: string;
} {
  const target = new Date(dateStr + 'T12:00:00');
  const day = target.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(target);
  monday.setDate(target.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  const startDate = toYmd(monday);
  const endDate = toYmd(sunday);

  // Determine week number within month based on Monday
  const year = monday.getFullYear();
  const month = monday.getMonth() + 1; // 1-12
  const monthName = MONTH_NAMES_EN[monday.getMonth()];

  const dayOfMonth = monday.getDate();
  const weekNumber = Math.min(Math.ceil(dayOfMonth / 7), 5);
  const roman = ROMAN_NUMERALS[weekNumber - 1] || `${weekNumber}`;
  const weekLabel = `Week ${roman} – ${monthName}`;

  const dateRangeFormatted = `${formatWeeklyDate(startDate)} – ${formatWeeklyDate(endDate)}`;

  return {
    startDate,
    endDate,
    year,
    month,
    weekNumber,
    weekLabel,
    dateRangeFormatted,
  };
}

/**
 * Generate 7 dates array from Monday to Sunday
 */
export function getDatesBetween(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startDateStr + 'T12:00:00');
  const end = new Date(endDateStr + 'T12:00:00');

  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export const SAMPLE_WEEKLY_HIGHLIGHTS: string[] = [
  'Change logo POS',
  'Create formula filter ecommerce reservation',
  'Delete and update all signage',
  'Daily checking IT',
  'Daily signage update',
  'Daily Velo device check',
  'Setup CCTV for steward and chef',
  'Setup cables in HR',
  'Perform cable management',
  'Fix guest WiFi connection issues',
  'Add music to the 18thfloor media player for guest elevator',
  'Replace switch hub in HR and provide spare cables & USBtoLAN adapters',
  'Create button data fill',
  'Fix guest TV Vidio.com playback issue',
  'Check database for backup PC specs',
  'Print standing WiFi QR code',
  'Create WiFi coding on TV',
  'Refilter and synchronize email',
  'Fix printer paper jam and refill ink',
  'Reset guest lift music volume',
  'Reconnect access point L14 B after rack replacement',
  'Setup LAN cable at Victory 3',
  'Remove Zoom camera from Victory 3',
  'Fix kitchen maintenance printer',
  'Test and commission videotron with engineering team',
  'Synchronize TV in room 1614 for VIP guest',
  'Create dedicated SSID for HUMA INDONESIA event',
  'Remove LAN cable from Victory 3',
  'Check CCTV at pantry F14 Wing B with Engineering team',
  'Set up karaoke',
  'Run speedtest and check Dian videotron',
  'Reinstall steward PC',
  'Replace steward PC',
];

/**
 * Creates default WeeklyReport structure initialized with Hotel Ciputra Jakarta standard data
 */
export function createDefaultWeeklyReport(baseDateStr?: string): WeeklyReport {
  const todayStr = baseDateStr || new Date().toISOString().split('T')[0];
  const info = getWeekRangeFromDate(todayStr);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekDates = getDatesBetween(info.startDate, info.endDate);

  const databaseBackups = daysOfWeek.map((dayName, idx) => {
    const dStr = weekDates[idx] || info.startDate;
    const parts = dStr.split('-');
    const mmDdYyyy = parts.length === 3 ? `${parts[1]}/${parts[2]}/${parts[0]}` : dStr;
    return {
      day: dayName,
      date: mmDdYyyy,
      time: '05.00',
      databaseLocation: 'Backup PC Server',
      status: 'Done' as const,
    };
  });

  const weeklyHighlights: WeeklyHighlightItem[] = SAMPLE_WEEKLY_HIGHLIGHTS.map((text, idx) => ({
    id: `wh-${idx + 1}`,
    no: idx + 1,
    text,
  }));

  const now = Date.now();
  const TEN_MONTHS_MS = 10 * 30 * 24 * 60 * 60 * 1000;

  return {
    id: `weekly-${info.startDate}`,
    year: info.year,
    month: info.month,
    weekNumber: info.weekNumber,
    weekLabel: info.weekLabel,
    startDate: info.startDate,
    endDate: info.endDate,
    dateRangeFormatted: info.dateRangeFormatted,

    // Header & Metadata
    propertyName: 'Hotel Ciputra Jakarta',
    prepared: 'Junianto Bagas Prasetyo [Asst. IT Manager]',
    directReport: 'Michael G Perdikaris [General Manager]',
    cc: 'I Ketut Subagia [Financial Controller]',
    reportPeriodText: `This report indicates the result of major achievements in the Information Technology department for the month of ${info.weekLabel} ( ${info.dateRangeFormatted} )`,

    // 1. Guest Statistic
    guestStatistic: {
      mrtgScreenshotUrl: '',
      bandwidth: '450 Mbps (1:1)',
      freeBod: 'Free BOD from Velo 100 Mbps / month (based on Velo)',
      ispStatus: 'Status line with ISP Velo Networks Fiber Optic with Radio for backup',
      connectedDevicesCount: '2903',
    },

    // 2. Weekly Highlight
    weeklyHighlights,

    // 3. Weekly Antivirus Report Screenshots
    antivirusReport: {
      statusOverviewUrl: '',
      securityOverviewUrl: '',
      computerStatusUrl: '',
      antivirusDetectionUrl: '',
      firewallDetectionsUrl: '',
      fortigateStatusUrl: '',
    },

    // 4. Next Month Project & On Going
    nextMonthProjects: [
      {
        id: 'nmp-1',
        no: 1,
        projectName: 'Upgrade protel to New Version',
        target: 'Next Year',
        others: 'Need Buy New POS machine',
      },
    ],

    // 5. Training Time & Train the Trainer
    trainings: [
      {
        id: 'tr-1',
        no: 1,
        date: '',
        dept: '',
        topicAndParticipant: '',
        documentationUrl: '',
      },
      {
        id: 'tr-2',
        no: 2,
        date: '',
        dept: '',
        topicAndParticipant: '',
        documentationUrl: '',
      },
    ],

    // 6. Weekly Banquet Support Event Internet BOD
    banquetSupports: [
      {
        id: 'bq-1',
        no: 1,
        date: '',
        eventName: '',
        location: '',
        requirementSupport: '',
      },
      {
        id: 'bq-2',
        no: 2,
        date: '',
        eventName: '',
        location: '',
        requirementSupport: '',
      },
      {
        id: 'bq-3',
        no: 3,
        date: '',
        eventName: '',
        location: '',
        requirementSupport: '',
      },
    ],

    // 7. Daily Activity Report Link
    dailyActivityGdriveLink: 'https://drive.google.com/drive/u/0/folders/1USOh9jp52tMKwscLBOtDz5R9IkawoUz',

    // 8. Weekly Monitoring Access Point
    accessPointMonitoring: {
      floor711: {
        zone: 'Floor 711',
        items: [
          { type: 'UAPACLR', total: 7 },
          { type: 'UAPACLite', total: 146 },
          { type: 'U6Lite', total: 18 },
          { type: 'UK Ultra', total: 2 },
          { type: 'U6+', total: 4 },
          { type: 'U6 Pro', total: 1 },
        ],
        totalAp: 178,
        issue: 'No Issue',
      },
      floor1217: {
        zone: 'Floor 1217',
        items: [
          { type: 'UAPACLR', total: 10 },
          { type: 'UAPACLite', total: 167 },
          { type: 'U6Lite', total: 13 },
        ],
        totalAp: 190,
        issue: 'No Issue',
      },
      meetingAndPublic: {
        zone: 'Meeting Room & Public Area',
        items: [
          { type: 'U6Lite', total: 6 },
          { type: 'UAPACHD', total: 7 },
          { type: 'UAPACLite', total: 2 },
          { type: 'UAPACLR', total: 19 },
          { type: 'U6+', total: 1 },
          { type: 'UAPACLR', total: 36 },
        ],
        totalAp: 35,
        issue: 'No Issue',
      },
      totalSummary: {
        items: [
          { type: 'UAPACLite', total: 315 },
          { type: 'U6Lite', total: 37 },
          { type: 'UAPACHD', total: 7 },
          { type: 'U6+', total: 5 },
          { type: 'UK Ultra', total: 2 },
          { type: 'U6 Pro', total: 1 },
        ],
        totalAp: 403,
      },
    },

    // 9. Backup Database
    databaseBackups,
    databaseBackupLinks: {
      databaseLink: 'https://drive.google.com/drive/u/0/folders/1xgcvFtx8_jJcvLACq7z9wUrKv9hcFph',
      dataCenterLink: 'https://drive.google.com/drive/u/0/folders/1CaVu0u7q4uvJNepCBWwk0oBm0ihmaPlN',
      userDataLink: 'https://drive.google.com/drive/u/0/folders/1v0NLo12TJ2LiMhOvh0noLei3FjkkBGMR',
      accountEmail: 'itmhcj@swissbelhotel.coms',
    },

    // 10. New Employee Data System (HR Request)
    newEmployeeSystem: {
      details: 'Attached on daily maintenance, New SAA',
      fileLink: 'https://drive.google.com/drive/folders/1ttEt8NM_J1VFxDgvWoq7oNQ7Jfng8CNY?usp=sharing',
      noteTitle: 'File on Spreadsheet New user SYSTEM ACCESS AUTHORIZATION REQUEST FORM',
    },

    // 11. New Menu on POS Request (This Week)
    newMenuPos: {
      details: 'Attached on daily maintenance, DOFB memo and tax calculation and Majoo',
      fileLink: 'https://docs.google.com/spreadsheets',
      noteTitle: 'File on Excel has been update for POS & BHC',
    },

    // 12. Sara System Report IT Section
    saraSystemReport: {
      screenshotUrl: '',
      note: 'No pending task from IT during last week. Has been done to handling and solve.',
    },

    // 13. Others Information
    othersInformation: '-',

    // Sign-off
    signatureCityDate: `Jakarta / ${formatWeeklyDate(todayStr)}`,
    signatureName: 'Junianto Bagas Prasetyo',
    signatureTitle: 'Asst. IT Manager',
    footerText: 'INFORMATION TECHNOLOGY [ITDEPT] – 2026 BG V.5',

    isUserModified: false,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + TEN_MONTHS_MS,
  };
}

/**
 * Scan all daily activity reports across the 7 days of the week,
 * and extract all valid activities as WeeklyHighlightItems!
 */
export async function pullHighlightsFromDailyActivities(
  startDateStr: string,
  endDateStr: string,
  includeDeptInfo: boolean = false
): Promise<{ items: WeeklyHighlightItem[]; daysChecked: number; totalFound: number }> {
  const dates = getDatesBetween(startDateStr, endDateStr);
  const collectedHighlights: WeeklyHighlightItem[] = [];
  const seenIds = new Set<string>();

  for (const d of dates) {
    try {
      const dailyReport = await loadActivityReport(d);
      if (dailyReport && dailyReport.logBookActivities) {
        // Sanitize and deduplicate routine and logbook activities first
        const cleanActs = sanitizeAndDeduplicateActivities(
          dailyReport.logBookActivities,
          dailyReport.excludedRoutineIds || []
        );

        cleanActs.forEach((act, actIdx) => {
          if (act && typeof act.details === 'string' && act.details.trim() !== '') {
            let label = act.details.trim();
            if (includeDeptInfo) {
              const dept = act.clientDepartment || act.userClient;
              const metaParts: string[] = [];
              if (act.clientName) metaParts.push(act.clientName);
              if (dept) metaParts.push(dept);
              if (metaParts.length > 0) {
                label = `${label} (${metaParts.join(' - ')})`;
              }
            }

            // Guaranteed unique ID per item to prevent duplicate React keys
            const rawKey = act.id ? String(act.id).replace(/[^a-zA-Z0-9_-]/g, '_') : `act-${actIdx}`;
            let uniqueId = `hl-${d}-${rawKey}-${actIdx}`;
            let suffix = 1;
            while (seenIds.has(uniqueId)) {
              uniqueId = `hl-${d}-${rawKey}-${actIdx}-${suffix++}`;
            }
            seenIds.add(uniqueId);

            collectedHighlights.push({
              id: uniqueId,
              no: collectedHighlights.length + 1,
              text: label,
              sourceDate: d,
              clientDepartment: act.clientDepartment || act.userClient,
              clientName: act.clientName,
              pic: act.pic,
              status: act.status,
            });
          }
        });
      }
    } catch (e) {
      console.warn(`Failed to read daily activity for date ${d}`, e);
    }
  }

  // Renumber 1..N
  const finalItems = collectedHighlights.map((it, idx) => ({ ...it, no: idx + 1 }));

  return {
    items: finalItems,
    daysChecked: dates.length,
    totalFound: finalItems.length,
  };
}

export const POPULAR_AP_TYPES = [
  'UAPACLite',
  'UAPACLR',
  'U6Lite',
  'U6+',
  'U6 Pro',
  'UK Ultra',
  'UAPACHD',
  'U6 Enterprise',
  'U6 In-Wall',
  'U6 Mesh',
  'U7 Pro',
];

/**
 * Recalculates totalAp for each zone and generates the aggregated totalSummary
 * whenever user edits, adds, or deletes AP types/quantities.
 */
export function recalculateApMonitoring(
  ap?: WeeklyReport['accessPointMonitoring']
): WeeklyReport['accessPointMonitoring'] {
  const f711Items = (ap?.floor711?.items || []).map((it) => ({
    type: it.type || '',
    total: Math.max(0, Number(it.total) || 0),
  }));
  const f1217Items = (ap?.floor1217?.items || []).map((it) => ({
    type: it.type || '',
    total: Math.max(0, Number(it.total) || 0),
  }));
  const mpItems = (ap?.meetingAndPublic?.items || []).map((it) => ({
    type: it.type || '',
    total: Math.max(0, Number(it.total) || 0),
  }));

  const f711Total = f711Items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  const f1217Total = f1217Items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  const mpTotal = mpItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);

  // Aggregate all types across the 3 zones
  const typeMap = new Map<string, number>();
  const addItems = (items: { type: string; total: number }[]) => {
    items.forEach((it) => {
      const trimmedType = it.type.trim();
      if (!trimmedType) return;
      const count = Number(it.total) || 0;
      typeMap.set(trimmedType, (typeMap.get(trimmedType) || 0) + count);
    });
  };

  addItems(f711Items);
  addItems(f1217Items);
  addItems(mpItems);

  // Keep a clean aggregated list sorted with highest quantity first
  const aggregatedItems = Array.from(typeMap.entries())
    .map(([type, total]) => ({ type, total }))
    .sort((a, b) => b.total - a.total);

  const overallTotal = f711Total + f1217Total + mpTotal;

  return {
    floor711: {
      zone: ap?.floor711?.zone || 'Floor 711',
      items: f711Items,
      totalAp: f711Total,
      issue: ap?.floor711?.issue ?? 'No Issue',
    },
    floor1217: {
      zone: ap?.floor1217?.zone || 'Floor 1217',
      items: f1217Items,
      totalAp: f1217Total,
      issue: ap?.floor1217?.issue ?? 'No Issue',
    },
    meetingAndPublic: {
      zone: ap?.meetingAndPublic?.zone || 'Meeting Room & Public Area',
      items: mpItems,
      totalAp: mpTotal,
      issue: ap?.meetingAndPublic?.issue ?? 'No Issue',
    },
    totalSummary: {
      items: aggregatedItems.length > 0 ? aggregatedItems : (ap?.totalSummary?.items || []),
      totalAp: overallTotal,
    },
  };
}
