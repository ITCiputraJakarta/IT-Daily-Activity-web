import { ChecklistItem, DailyActivityReport, DailyChecklistReport } from '../types';
import { formatReportDate, getTodayDateString } from '../utils/imageUtils';
import { loadTeamMembers } from './teamMembers';
import {
  SAMPLE_ERTFLIX_IMG,
  SAMPLE_PCCAFE_IMG,
  SAMPLE_SARA_IMG,
  SAMPLE_SPEEDTEST_IMG,
  SAMPLE_THERMOPRO_IMG,
  SAMPLE_TRAFFIC_IMG
} from './sampleImages';

export const DEFAULT_PROPERTY_NAME = 'Hotel Ciputra Jakarta';

export const DEFAULT_PREPARED = 'IT Team of HCJ';
export const DEFAULT_DIRECT_REPORT = 'I Ketut Subagia [FC]';
export const DEFAULT_CC = 'Michael G Perdikaris [GM] & IT Team';

export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'item-1', no: 1, taskList: 'Unifi Controller', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-2', no: 2, taskList: 'Bandwidth statistic', personIncharge: '', status: 'Checked', remark: '-' },
  { id: 'item-3', no: 3, taskList: 'Diskstation System', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-4', no: 4, taskList: 'Check Cloud Backup', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-5', no: 5, taskList: 'UPS Checkup status', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-6', no: 6, taskList: 'HK Survey (Google form)', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-7', no: 7, taskList: 'Check Fortigate Firewall', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-8', no: 8, taskList: 'Meal Record Appsheet', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-9', no: 9, taskList: 'Check Internet Performance', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-10', no: 10, taskList: 'Miwa Backup Database', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-11', no: 11, taskList: 'Protel Backup Database', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-12', no: 12, taskList: 'Sage Backup Database', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-13', no: 13, taskList: 'XNPOS Backup Database', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-14', no: 14, taskList: 'JDS Backup Database', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-15', no: 15, taskList: 'BHC (Ciphos, Grogol, PIM) & Grab & GO POS', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-16', no: 16, taskList: 'VIP Arrival on Samsung Reach', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-17', no: 17, taskList: 'Signage Checklist', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-18', no: 18, taskList: 'Daily Update digital signage event', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-19', no: 19, taskList: 'ADS Checklist', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-20', no: 20, taskList: 'Lift TV', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-21', no: 21, taskList: 'Interface status', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-22', no: 22, taskList: 'All server condition', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-23', no: 23, taskList: 'PABX server', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-24', no: 24, taskList: 'Check DVR & NVR CCTV Connection', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-25', no: 25, taskList: 'Check BHC CCTV Connection', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-26', no: 26, taskList: 'Synchronize time All Server', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-27', no: 27, taskList: 'FO Appsheet Database', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-28', no: 28, taskList: 'Mikrotik Router Checklist', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-29', no: 29, taskList: 'Check SARA Apps', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-30', no: 30, taskList: 'Check ESET PROTECT', personIncharge: '', status: 'Checked', remark: 'No issue' },
  { id: 'item-31', no: 31, taskList: 'Protel Occupancy check', personIncharge: '', status: 'Checked', remark: 'No issue' },
];

export function createDefaultChecklistReport(dateStr?: string): DailyChecklistReport {
  const date = dateStr || getTodayDateString();
  return {
    id: date,
    date,
    formattedDate: formatReportDate(date),
    propertyName: DEFAULT_PROPERTY_NAME,
    morningShiftPic: '',
    eveningShiftPic: '',
    items: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_ITEMS)),
    generalNotes: '',
    isUserModified: false,
    createdAt: Date.now(),
    updatedAt: 0,
    expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 2 months (60 days) retention
  };
}

/**
 * Checks whether a checklist report has been customized/edited by the user
 * (as opposed to being an untouched blank default or auto-inherited report).
 */
export function isChecklistCustomModified(report: DailyChecklistReport | null | undefined): boolean {
  if (!report) return false;
  if (typeof report.isUserModified === 'boolean') {
    return report.isUserModified;
  }
  if (
    report.morningShiftPic?.trim() ||
    report.eveningShiftPic?.trim() ||
    report.generalNotes?.trim()
  ) {
    return true;
  }
  if (!Array.isArray(report.items) || report.items.length !== DEFAULT_CHECKLIST_ITEMS.length) {
    return true;
  }
  return report.items.some((it, idx) => {
    const def = DEFAULT_CHECKLIST_ITEMS[idx];
    if (!def) return true;
    return (
      Boolean(it.personIncharge?.trim()) ||
      it.status !== def.status ||
      it.remark !== def.remark ||
      it.taskList !== def.taskList
    );
  });
}

/**
 * Creates a DailyChecklistReport for a target date by inheriting the previous date's
 * Morning Shift PIC, Evening Shift PIC, checklist items (including added/removed tasks, PICs, statuses, remarks),
 * propertyName, and generalNotes.
 */
export function createChecklistFromPrevious(
  dateStr: string,
  previousReport?: DailyChecklistReport | null
): DailyChecklistReport {
  if (!previousReport) {
    return createDefaultChecklistReport(dateStr);
  }

  const clonedItems: ChecklistItem[] = Array.isArray(previousReport.items)
    ? JSON.parse(JSON.stringify(previousReport.items)).map((it: ChecklistItem, idx: number) => ({
        ...it,
        no: idx + 1,
      }))
    : JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_ITEMS));

  const now = Date.now();
  return {
    id: dateStr,
    date: dateStr,
    formattedDate: formatReportDate(dateStr),
    propertyName: previousReport.propertyName || DEFAULT_PROPERTY_NAME,
    morningShiftPic: previousReport.morningShiftPic || '',
    eveningShiftPic: previousReport.eveningShiftPic || '',
    items: clonedItems,
    generalNotes: previousReport.generalNotes || '',
    isUserModified: false,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 60 * 24 * 60 * 60 * 1000,
  };
}

export function createDefaultActivityReport(dateStr?: string): DailyActivityReport {
  const date = dateStr || getTodayDateString();
  const activeMembers = loadTeamMembers().filter((m) => m.isActive);
  const pickPic = (idx: number) =>
    activeMembers.length > 0 ? activeMembers[idx % activeMembers.length].name : '';

  return {
    id: date,
    date,
    formattedDate: formatReportDate(date),
    propertyName: DEFAULT_PROPERTY_NAME,
    prepared: DEFAULT_PREPARED,
    directReport: DEFAULT_DIRECT_REPORT,
    cc: DEFAULT_CC,
    logBookActivities: [
      {
        id: 'act-1',
        no: 1,
        details: '',
        clientName: '',
        clientDepartment: 'FO (Front Office)',
        userClient: 'FO (Front Office)',
        status: 'Done',
        pic: pickPic(0),
        pictureUrl: '',
      },
      {
        id: 'act-2',
        no: 2,
        details: '',
        clientName: '',
        clientDepartment: 'HK (Housekeeping)',
        userClient: 'HK (Housekeeping)',
        status: 'Done',
        pic: pickPic(1),
        pictureUrl: '',
      },
      {
        id: 'act-3',
        no: 3,
        details: '',
        clientName: '',
        clientDepartment: 'Engineering & Maintenance',
        userClient: 'Engineering & Maintenance',
        status: 'Done',
        pic: pickPic(2),
        pictureUrl: '',
      },
    ],
    saraActivity: {
      enabled: true,
      title: '2. SARA Activity Today',
      notes: '',
      screenshotUrl: '',
    },
    internetTraffic: {
      enabled: true,
      title: '3. Internet Total Average Traffic Evening',
      notes: 'Hotel Ciputra Jakarta :: Traffic Analysis (Daily Graph 5 Minute Average)',
      maxIn: '',
      avgIn: '',
      currentIn: '',
      maxOut: '',
      avgOut: '',
      currentOut: '',
      screenshotUrl: '',
    },
    serverTemperature: {
      enabled: true,
      title: '4. Server Temperature',
      stdTemp: 'Std 17°C to 23°C',
      stdHum: 'Hum 45%-55%',
      currentTemp: '',
      currentHum: '',
      photoUrl: '',
      notes: '',
    },
    otherIssues: '-',
    isUserModified: false,
    createdAt: Date.now(),
    updatedAt: 0,
    expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 2 months (60 days) retention
  };
}

/**
 * Checks whether a DailyActivityReport contains real user-filled data or uploaded photos
 * (as opposed to an untouched blank default template).
 */
export function isActivityCustomModified(
  report: DailyActivityReport | null | undefined
): boolean {
  if (!report) return false;
  if (report.isUserModified === true) return true;

  const hasLogBookData =
    Array.isArray(report.logBookActivities) &&
    (report.logBookActivities.length !== 3 ||
      report.logBookActivities.some(
        (act) =>
          Boolean(act.details?.trim()) ||
          Boolean(act.clientName?.trim()) ||
          Boolean(act.pictureUrl?.trim()) ||
          act.status !== 'Done'
      ));

  const hasSaraData =
    Boolean(report.saraActivity?.screenshotUrl?.trim()) ||
    Boolean(report.saraActivity?.notes?.trim());

  const hasTrafficData =
    Boolean(report.internetTraffic?.screenshotUrl?.trim()) ||
    Boolean(report.internetTraffic?.maxIn?.trim()) ||
    Boolean(report.internetTraffic?.avgIn?.trim()) ||
    Boolean(report.internetTraffic?.currentIn?.trim());

  const hasTempData =
    Boolean(report.serverTemperature?.photoUrl?.trim()) ||
    Boolean(report.serverTemperature?.currentTemp?.trim()) ||
    Boolean(report.serverTemperature?.currentHum?.trim()) ||
    Boolean(report.serverTemperature?.notes?.trim());

  const hasOtherIssues =
    Boolean(report.otherIssues?.trim()) && report.otherIssues.trim() !== '-';

  return (
    hasLogBookData ||
    hasSaraData ||
    hasTrafficData ||
    hasTempData ||
    hasOtherIssues
  );
}
