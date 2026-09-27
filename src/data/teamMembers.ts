import { TeamMember } from '../types';

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

const LS_TEAM_MEMBERS_KEY = 'hcj_it_team_members_v1';

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
