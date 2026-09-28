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
  expiresAt: number; // 60 days after creation
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
  expiresAt: number; // 60 days after creation
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
