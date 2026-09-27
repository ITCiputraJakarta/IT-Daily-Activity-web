import { TeamMember, ClientUser } from '../types';

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
const LS_CLIENT_USERS_KEY = 'hcj_it_client_users_v1';

export function loadTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(LS_TEAM_MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load team members from localStorage:', e);
  }
  return DEFAULT_TEAM_MEMBERS;
}

export function saveTeamMembersToStorage(members: TeamMember[]): void {
  try {
    localStorage.setItem(LS_TEAM_MEMBERS_KEY, JSON.stringify(members));
  } catch (e) {
    console.warn('Failed to save team members to localStorage:', e);
  }
}

export function loadClientUsers(): ClientUser[] {
  try {
    const raw = localStorage.getItem(LS_CLIENT_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load client users from localStorage:', e);
  }
  return DEFAULT_CLIENT_USERS;
}

export function saveClientUsersToStorage(users: ClientUser[]): void {
  try {
    localStorage.setItem(LS_CLIENT_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to save client users to localStorage:', e);
  }
}
