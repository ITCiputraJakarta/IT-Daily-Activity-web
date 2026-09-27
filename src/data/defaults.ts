import { ChecklistItem, DailyActivityReport, DailyChecklistReport } from '../types';
import { formatReportDate, getTodayDateString } from '../utils/imageUtils';
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
  { id: 'item-1', no: 1, taskList: 'Unifi Controller', personIncharge: 'Bagas', status: 'Checked', remark: '403 AP Active & 767 User Connected' },
  { id: 'item-2', no: 2, taskList: 'Bandwidth statistic', personIncharge: 'Bagas', status: 'Checked', remark: 'MAX: 301.7 Mbps | AVG: 122.1 Mbps | CR: 165.5 Mbps' },
  { id: 'item-3', no: 3, taskList: 'Diskstation System', personIncharge: 'Bagas', status: 'Checked', remark: '95% Capacity 0.4 TB Free' },
  { id: 'item-4', no: 4, taskList: 'Check Cloud Backup', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-5', no: 5, taskList: 'UPS Checkup status', personIncharge: 'Bagas', status: 'Checked', remark: 'No issue' },
  { id: 'item-6', no: 6, taskList: 'HK Survey (Google form)', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-7', no: 7, taskList: 'Check Fortigate Firewall', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-8', no: 8, taskList: 'Meal Record Appsheet', personIncharge: 'Bagas', status: 'Checked', remark: '106 pax based on QR activity' },
  { id: 'item-9', no: 9, taskList: 'Check Internet Performance', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-10', no: 10, taskList: 'Miwa Backup Database', personIncharge: 'Ramdhani', status: 'Checked', remark: 'Manual Backup ( by Fo Night Shift )' },
  { id: 'item-11', no: 11, taskList: 'Protel Backup Database', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-12', no: 12, taskList: 'Sage Backup Database', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-13', no: 13, taskList: 'XNPOS Backup Database', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-14', no: 14, taskList: 'JDS Backup Database', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-15', no: 15, taskList: 'BHC (Ciphos, Grogol, PIM) & Grab & GO POS', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-16', no: 16, taskList: 'VIP Arrival on Samsung Reach', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-17', no: 17, taskList: 'Signage Checklist', personIncharge: 'Ramdhani', status: 'Checked', remark: 'Update Promo Material September' },
  { id: 'item-18', no: 18, taskList: 'Daily Update digital signage event', personIncharge: 'Ramdhani', status: 'Checked', remark: '"What\'s On Today" Event Updated' },
  { id: 'item-19', no: 19, taskList: 'ADS Checklist', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No Issue' },
  { id: 'item-20', no: 20, taskList: 'Lift TV', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No Issue' },
  { id: 'item-21', no: 21, taskList: 'Interface status', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No Issue' },
  { id: 'item-22', no: 22, taskList: 'All server condition', personIncharge: 'Ramdhani', status: 'Checked', remark: 'UPS installed, on monitoring' },
  { id: 'item-23', no: 23, taskList: 'PABX server', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-24', no: 24, taskList: 'Check DVR & NVR CCTV Connection', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-25', no: 25, taskList: 'Check BHC CCTV Connection', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-26', no: 26, taskList: 'Synchronize time All Server', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-27', no: 27, taskList: 'FO Appsheet Database', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-28', no: 28, taskList: 'Mikrotik Router Checklist', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-29', no: 29, taskList: 'Check SARA Apps', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No Pending Task' },
  { id: 'item-30', no: 30, taskList: 'Check ESET PROTECT', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
  { id: 'item-31', no: 31, taskList: 'Protel Occupancy check', personIncharge: 'Ramdhani', status: 'Checked', remark: 'No issue' },
];

export function createDefaultChecklistReport(dateStr?: string): DailyChecklistReport {
  const date = dateStr || getTodayDateString();
  return {
    id: date,
    date,
    formattedDate: formatReportDate(date),
    propertyName: DEFAULT_PROPERTY_NAME,
    morningShiftPic: 'Ramdhani',
    eveningShiftPic: 'Bagas',
    items: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_ITEMS)),
    generalNotes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
}

export function createDefaultActivityReport(dateStr?: string): DailyActivityReport {
  const date = dateStr || getTodayDateString();
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
        pic: 'Ramdhani',
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
        pic: 'Bagas',
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
        pic: 'VELO',
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
    createdAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
}
