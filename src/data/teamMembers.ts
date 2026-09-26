import { TeamMember } from '../types';

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm-1', name: 'Ramdhani', role: 'IT Support', isActive: true },
  { id: 'tm-2', name: 'Bagas', role: 'IT Support', isActive: true },
  { id: 'tm-3', name: 'VELO', role: 'IT Technician', isActive: true },
  { id: 'tm-4', name: 'BGS', role: 'IT Officer', isActive: true },
  { id: 'tm-5', name: 'BGS & VLO', role: 'IT Joint Team', isActive: true },
  { id: 'tm-6', name: 'IT Team HCJ', role: 'General Team', isActive: true },
  { id: 'tm-7', name: 'I Ketut Subagia [FC]', role: 'Direct Report / FC', isActive: true },
  { id: 'tm-8', name: 'Michael G Perdikaris [GM]', role: 'General Manager', isActive: true },
];

export const CLIENT_DEPARTMENTS: string[] = [
  'IT',
  'HR',
  'FO (Front Office)',
  'HK (Housekeeping)',
  'FB (Food & Beverage)',
  'Engineering',
  'Sales & Marketing',
  'Accounting & Finance',
  'Security',
  'GM Apart',
  'Dian Ballroom',
  'Green Café',
  'Daily Activity User',
  'Vendor / 3rd Party',
];

const LS_TEAM_MEMBERS_KEY = 'hcj_it_team_members_v1';

export function loadTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(LS_TEAM_MEMBERS_KEY);
    if (raw) {
      return JSON.parse(raw);
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
