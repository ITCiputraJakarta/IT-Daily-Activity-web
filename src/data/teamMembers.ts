import { TeamMember, ClientUser, ServerThresholdSettings } from '../types';

export const DEFAULT_SERVER_THRESHOLDS: ServerThresholdSettings = {
  minTemp: 17,
  maxTemp: 23,
  minHum: 45,
  maxHum: 55,
  stdTempLabel: 'Std 17°C to 23°C',
  stdHumLabel: 'Hum 45%-55%',
};

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm-1', name: 'Ramdhani', role: 'IT Support', isActive: true },
  { id: 'tm-2', name: 'Bagas', role: 'IT Support', isActive: true },
  { id: 'tm-3', name: 'VELO', role: 'IT Technician', isActive: true },
  { id: 'tm-4', name: 'Andika', role: 'IT Staff', isActive: true },
  { id: 'tm-5', name: 'IT Team HCJ', role: 'Tim Bersama IT', isActive: true },
];

export const CLIENT_DEPARTMENTS: string[] = [
  'FO (Front Office)',
  'HK (Housekeeping)',
  'FB (Food & Beverage)',
  'Engineering & Maintenance',
  'Accounting & Finance',
  'Sales & Marketing',
  'HR (Human Resources)',
  'Security',
  'Executive Office / GM',
  'Banquet & Event',
  'IT (Internal IT)',
  'Vendor / 3rd Party',
  'Other / Lainnya',
];

export const DEFAULT_CLIENT_USERS: ClientUser[] = [
  { id: 'cu-1', name: 'Reception / GSA', department: 'FO (Front Office)', roleOrExt: 'Front Desk', isActive: true },
  { id: 'cu-2', name: 'Duty Manager', department: 'FO (Front Office)', roleOrExt: 'FO Counter', isActive: true },
  { id: 'cu-3', name: 'HK Order Taker', department: 'HK (Housekeeping)', roleOrExt: 'Housekeeping Office', isActive: true },
  { id: 'cu-4', name: 'FB Cashier / Bakery', department: 'FB (Food & Beverage)', roleOrExt: 'Outlet POS', isActive: true },
  { id: 'cu-5', name: 'Engineering Duty', department: 'Engineering & Maintenance', roleOrExt: 'Control Room', isActive: true },
  { id: 'cu-6', name: 'Income Audit / AP', department: 'Accounting & Finance', roleOrExt: 'Back Office', isActive: true },
  { id: 'cu-7', name: 'Sales Admin', department: 'Sales & Marketing', roleOrExt: 'Sales Office', isActive: true },
  { id: 'cu-8', name: 'HR Admin', department: 'HR (Human Resources)', roleOrExt: 'HRD Office', isActive: true },
  { id: 'cu-9', name: 'Banquet Captain', department: 'Banquet & Event', roleOrExt: 'Dian Ballroom / Meeting Room', isActive: true },
  { id: 'cu-10', name: 'Executive Secretary', department: 'Executive Office / GM', roleOrExt: 'GM Office', isActive: true },
];

const LS_TEAM_MEMBERS_KEY = 'hcj_it_team_members_v1';
const LS_TEAM_MEMBERS_UPDATED_KEY = 'hcj_it_team_members_updated_at_v1';
const LS_CLIENT_USERS_KEY = 'hcj_it_client_users_v1';
const LS_CLIENT_USERS_UPDATED_KEY = 'hcj_it_client_users_updated_at_v1';

export function loadTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(LS_TEAM_MEMBERS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load team members from localStorage:', e);
  }
  return DEFAULT_TEAM_MEMBERS;
}

export function getTeamMembersLocalUpdatedAt(): number {
  try {
    const raw = localStorage.getItem(LS_TEAM_MEMBERS_UPDATED_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveTeamMembersToStorage(members: TeamMember[], updatedAt = Date.now()): void {
  try {
    localStorage.setItem(LS_TEAM_MEMBERS_KEY, JSON.stringify(members));
    localStorage.setItem(LS_TEAM_MEMBERS_UPDATED_KEY, String(updatedAt));
  } catch (e) {
    console.warn('Failed to save team members to localStorage:', e);
  }
}

export function loadClientUsers(): ClientUser[] {
  try {
    const raw = localStorage.getItem(LS_CLIENT_USERS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load client users from localStorage:', e);
  }
  return DEFAULT_CLIENT_USERS;
}

export function getClientUsersLocalUpdatedAt(): number {
  try {
    const raw = localStorage.getItem(LS_CLIENT_USERS_UPDATED_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveClientUsersToStorage(users: ClientUser[], updatedAt = Date.now()): void {
  try {
    localStorage.setItem(LS_CLIENT_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(LS_CLIENT_USERS_UPDATED_KEY, String(updatedAt));
  } catch (e) {
    console.warn('Failed to save client users to localStorage:', e);
  }
}

const LS_DEPARTMENTS_KEY = 'hcj_it_departments_v1';
const LS_DEPARTMENTS_UPDATED_KEY = 'hcj_it_departments_updated_at_v1';

export function loadDepartments(): string[] {
  try {
    const raw = localStorage.getItem(LS_DEPARTMENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load departments from localStorage:', e);
  }
  return CLIENT_DEPARTMENTS;
}

export function getDepartmentsLocalUpdatedAt(): number {
  try {
    const raw = localStorage.getItem(LS_DEPARTMENTS_UPDATED_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveDepartmentsToStorage(departments: string[], updatedAt = Date.now()): void {
  try {
    localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(departments));
    localStorage.setItem(LS_DEPARTMENTS_UPDATED_KEY, String(updatedAt));
  } catch (e) {
    console.warn('Failed to save departments to localStorage:', e);
  }
}

const LS_SERVER_THRESHOLDS_KEY = 'hcj_it_server_thresholds_v1';
const LS_SERVER_THRESHOLDS_UPDATED_KEY = 'hcj_it_server_thresholds_updated_at_v1';

export function loadServerThresholds(): ServerThresholdSettings {
  try {
    const raw = localStorage.getItem(LS_SERVER_THRESHOLDS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.minTemp === 'number' && typeof parsed.maxTemp === 'number') {
        return {
          minTemp: parsed.minTemp,
          maxTemp: parsed.maxTemp,
          minHum: typeof parsed.minHum === 'number' ? parsed.minHum : 45,
          maxHum: typeof parsed.maxHum === 'number' ? parsed.maxHum : 55,
          stdTempLabel: parsed.stdTempLabel || `Std ${parsed.minTemp}°C to ${parsed.maxTemp}°C`,
          stdHumLabel: parsed.stdHumLabel || `Hum ${parsed.minHum ?? 45}%-${parsed.maxHum ?? 55}%`,
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load server thresholds from localStorage:', e);
  }
  return DEFAULT_SERVER_THRESHOLDS;
}

export function getServerThresholdsLocalUpdatedAt(): number {
  try {
    const raw = localStorage.getItem(LS_SERVER_THRESHOLDS_UPDATED_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveServerThresholdsToStorage(
  thresholds: ServerThresholdSettings,
  updatedAt = Date.now()
): void {
  try {
    const dataWithTs = { ...thresholds, updatedAt };
    localStorage.setItem(LS_SERVER_THRESHOLDS_KEY, JSON.stringify(dataWithTs));
    localStorage.setItem(LS_SERVER_THRESHOLDS_UPDATED_KEY, String(updatedAt));
  } catch (e) {
    console.warn('Failed to save server thresholds to localStorage:', e);
  }
}


