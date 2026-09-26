export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  isActive: boolean;
}

export interface LogBookItem {
  id: string;
  no: number;
  details: string;
  userClient: string;
  status: 'Done' | 'Pending' | 'In Progress' | 'Cancelled';
  pic: string;
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
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // 30 days after creation
}

export interface ChecklistItem {
  id: string;
  no: number;
  taskList: string;
  personIncharge: string;
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
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // 30 days after creation
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
