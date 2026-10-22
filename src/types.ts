export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  isActive: boolean;
}

export interface ClientUser {
  id: string;
  name: string;
  department: string;
  roleOrExt?: string;
  isActive: boolean;
}

export type RoutineSchedule = 'everyday' | 'weekday' | 'weekend';

export interface RoutineActivityTemplate {
  id: string;
  details: string; // e.g. "Update Digital Signage", "GM Check Laptop"
  clientName?: string; // e.g. "Public Area", "General Manager"
  clientDepartment: string; // e.g. "Sales & Marketing", "Executive Office / GM"
  schedule: RoutineSchedule; // 'everyday' | 'weekday' | 'weekend'
  defaultStatus: 'Done' | 'Pending' | 'In Progress' | 'Cancelled';
  noPhoto?: boolean; // true = list item without photo documentation
  isActive: boolean;
  order?: number;
}

export interface LogBookItem {
  id: string;
  no: number;
  details: string;
  userClient: string; // backwards compatibility: "[Name] - [Dept]" or "[Dept]"
  clientName?: string; // Nama User/Client (misal: Pak Budi, Ibu Dewi, Reception)
  clientDepartment?: string; // Departemen User/Client (misal: FO, Housekeeping, Accounting)
  status: 'Done' | 'Pending' | 'In Progress' | 'Cancelled';
  pic: string; // Petugas IT (nama saja, misal: Ramdhani, Bagas, VELO)
  pictureUrl?: string;
  pictureCaption?: string;
  isRoutine?: boolean; // true if this activity came from routine template
  noPhoto?: boolean; // true if displayed in list form without photo requirement
}

export interface SaraActivity {
  enabled: boolean;
  title: string;
  screenshotUrl?: string;
  notes?: string;
}

export interface InternetTraffic {
  enabled: boolean;
  title: string;
  screenshotUrl?: string;
  notes?: string;
  maxIn?: string;
  avgIn?: string;
  currentIn?: string;
  maxOut?: string;
  avgOut?: string;
  currentOut?: string;
}

export interface ServerTemperature {
  enabled: boolean;
  title: string;
  stdTemp: string; // e.g. "Std 17°C to 23°C"
  stdHum: string;  // e.g. "Hum 45%-55%"
  currentTemp?: string; // numeric value stored e.g. "17.3" or "17"
  currentHum?: string;  // numeric value stored e.g. "41" or "45"
  photoUrl?: string;
  notes?: string;
}

export interface ServerThresholdSettings {
  minTemp: number; // e.g. 17 or 18
  maxTemp: number; // e.g. 23 or 24
  minHum: number;  // e.g. 45 or 40
  maxHum: number;  // e.g. 55 or 60
  stdTempLabel: string; // e.g. "Std 17°C to 23°C"
  stdHumLabel: string;  // e.g. "Hum 45%-55%"
  updatedAt?: number;
}

export interface DailyActivityReport {
  id: string; // usually YYYY-MM-DD
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "Saturday, 26 September 2026"
  propertyName: string;
  prepared: string;
  directReport: string;
  cc: string;
  logBookActivities: LogBookItem[];
  saraActivity: SaraActivity;
  internetTraffic: InternetTraffic;
  serverTemperature: ServerTemperature;
  otherIssues: string;
  isUserModified?: boolean; // true when user has filled in fields or uploaded photos
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // 10 months (~300 days) retention after creation
}

export interface ChecklistItem {
  id: string;
  no: number;
  taskList: string;
  personIncharge: string;
  shift?: 'morning' | 'evening' | 'custom';
  status: 'Checked' | 'Pending' | 'Issue' | 'In Progress';
  remark: string;
}

export interface DailyChecklistReport {
  id: string; // usually YYYY-MM-DD
  date: string; // YYYY-MM-DD
  formattedDate: string;
  propertyName: string;
  morningShiftPic: string;
  eveningShiftPic: string;
  items: ChecklistItem[];
  generalNotes?: string;
  waReportPhoto?: string; // Foto untuk WA Report (dari galeri atau live)
  waReportPhotoCaption?: string; // Keterangan foto (default dari point no. 1)
  isUserModified?: boolean; // true when explicitly edited on this date; false when inherited default from previous date
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // 10 months (~300 days) retention after creation
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// =========================================================================
// WEEKLY MAINTENANCE REPORT TYPES (A4 7-Page Executive Report)
// =========================================================================

export interface WeeklyHighlightItem {
  id: string;
  no: number;
  text: string;
  sourceDate?: string;
  clientDepartment?: string;
  clientName?: string;
  pic?: string;
  status?: string;
}

export interface NextMonthProjectItem {
  id: string;
  no: number;
  projectName: string;
  target: string;
  others: string;
}

export interface TrainingItem {
  id: string;
  no: number;
  date: string;
  dept: string;
  topicAndParticipant: string;
  documentationUrl?: string;
}

export interface BanquetSupportItem {
  id: string;
  no: number;
  date: string;
  eventName: string;
  location: string;
  requirementSupport: string;
}

export interface DatabaseBackupRow {
  day: string; // e.g. "Monday"
  date: string; // e.g. "10/12/2026"
  time: string; // e.g. "05.00"
  databaseLocation: string; // e.g. "Backup PC Server"
  status: 'Done' | 'Pending' | 'Failed' | 'In Progress';
}

export interface AccessPointItem {
  type: string;
  total: number;
}

export interface AccessPointZoneGroup {
  zone: string;
  items: AccessPointItem[];
  totalAp: number;
  issue: string;
}

export interface WeeklyReport {
  id: string; // e.g. "2026-W42" or "2026-10-W2"
  year: number;
  month: number;
  weekNumber: number;
  weekLabel: string; // e.g. "Week II – October"
  startDate: string; // "2026-10-12"
  endDate: string; // "2026-10-18"
  dateRangeFormatted: string; // "12 October 2026 – 18 October 2026"

  // Header & Metadata
  propertyName: string;
  prepared: string;
  directReport: string;
  cc: string;
  reportPeriodText: string;

  // 1. Guest Statistic
  guestStatistic: {
    mrtgScreenshotUrl?: string;
    bandwidth: string;
    freeBod: string;
    ispStatus: string;
    connectedDevicesCount: string;
  };

  // 2. Weekly Highlight
  weeklyHighlights: WeeklyHighlightItem[];

  // 3. Weekly Antivirus Report Screenshots
  antivirusReport: {
    statusOverviewUrl?: string;
    securityOverviewUrl?: string;
    computerStatusUrl?: string;
    antivirusDetectionUrl?: string;
    firewallDetectionsUrl?: string;
    fortigateStatusUrl?: string;
  };

  // 4. Next Month Project & On Going
  nextMonthProjects: NextMonthProjectItem[];

  // 5. Training Time & Train the Trainer
  trainings: TrainingItem[];

  // 6. Weekly Banquet Support Event Internet BOD
  banquetSupports: BanquetSupportItem[];

  // 7. Daily Activity Report Link
  dailyActivityGdriveLink: string;

  // 8. Weekly Monitoring Access Point
  accessPointMonitoring: {
    floor711: AccessPointZoneGroup;
    floor1217: AccessPointZoneGroup;
    meetingAndPublic: AccessPointZoneGroup;
    totalSummary: {
      items: AccessPointItem[];
      totalAp: number;
    };
  };

  // 9. Backup Database
  databaseBackups: DatabaseBackupRow[];
  databaseBackupLinks: {
    databaseLink: string;
    dataCenterLink: string;
    userDataLink: string;
    accountEmail: string;
  };

  // 10. New Employee Data System (HR Request)
  newEmployeeSystem: {
    details: string;
    fileLink: string;
    noteTitle: string;
  };

  // 11. New Menu on POS Request (This Week)
  newMenuPos: {
    details: string;
    fileLink: string;
    noteTitle: string;
  };

  // 12. Sara System Report IT Section
  saraSystemReport: {
    screenshotUrl?: string;
    note: string;
  };

  // 13. Others Information
  othersInformation: string;

  // Sign-off
  signatureCityDate: string;
  signatureName: string;
  signatureTitle: string;
  footerText: string;

  isUserModified?: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}
