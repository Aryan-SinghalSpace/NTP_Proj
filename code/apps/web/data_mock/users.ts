/**
 * Mock data for the tenant-administration pages: Users (/users), Roles &
 * permissions (/roles), and supporting shapes for Account / Settings. Shaped to
 * resemble what the Identity & access backend will serve — tenant-scoped users,
 * configurable roles, and a resource × CRUD permission matrix per role.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type UserStatus = 'active' | 'invited' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  lastActive: string;
  initials: string;
}

export const users: User[] = [
  {
    id: 'u_01',
    name: 'Riya Sharma',
    email: 'riya.sharma@acmefoods.in',
    role: 'Tenant Admin',
    status: 'active',
    lastActive: '2 min ago',
    initials: 'RS',
  },
  {
    id: 'u_02',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@acmefoods.in',
    role: 'Operations',
    status: 'active',
    lastActive: '18 min ago',
    initials: 'AM',
  },
  {
    id: 'u_03',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@acmefoods.in',
    role: 'QA',
    status: 'active',
    lastActive: '1 hr ago',
    initials: 'NK',
  },
  {
    id: 'u_04',
    name: 'Vikram Singh',
    email: 'vikram.singh@northdealers.in',
    role: 'Dealer',
    status: 'active',
    lastActive: '3 hr ago',
    initials: 'VS',
  },
  {
    id: 'u_05',
    name: 'Priya Nair',
    email: 'priya.nair@acmefoods.in',
    role: 'Viewer',
    status: 'invited',
    lastActive: 'Never',
    initials: 'PN',
  },
  {
    id: 'u_06',
    name: 'Karan Bhatia',
    email: 'karan.bhatia@southdealers.in',
    role: 'Dealer',
    status: 'invited',
    lastActive: 'Never',
    initials: 'KB',
  },
  {
    id: 'u_07',
    name: 'Sana Iqbal',
    email: 'sana.iqbal@acmefoods.in',
    role: 'Operations',
    status: 'active',
    lastActive: 'Yesterday',
    initials: 'SI',
  },
  {
    id: 'u_08',
    name: 'Rohit Verma',
    email: 'rohit.verma@acmefoods.in',
    role: 'QA',
    status: 'disabled',
    lastActive: '21 days ago',
    initials: 'RV',
  },
];

export interface Role {
  id: string;
  name: string;
  description: string;
  members: number;
  system: boolean;
}

export const roles: Role[] = [
  {
    id: 'r_admin',
    name: 'Tenant Admin',
    description: 'Full control of this tenant — config, users, workflows, data.',
    members: 1,
    system: true,
  },
  {
    id: 'r_ops',
    name: 'Operations',
    description: 'Capture events, run dispatch & receive, manage batches.',
    members: 2,
    system: false,
  },
  {
    id: 'r_qa',
    name: 'QA',
    description: 'Hold/release, quality checks, recall initiation.',
    members: 2,
    system: false,
  },
  {
    id: 'r_dealer',
    name: 'Dealer',
    description: 'Scan inbound, confirm receive against dispatch.',
    members: 2,
    system: false,
  },
  {
    id: 'r_viewer',
    name: 'Viewer',
    description: 'Read-only access to dashboards and trace.',
    members: 1,
    system: false,
  },
];

export interface Crud {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export const resources = [
  'Master Data',
  'Field Library',
  'Workflows',
  'Events',
  'Labels',
  'Users & Roles',
] as const;

export type Resource = (typeof resources)[number];

/** roleId -> resource -> CRUD grants. */
export const permissionMatrix: Record<string, Record<Resource, Crud>> = {
  r_admin: {
    'Master Data': { create: true, read: true, update: true, delete: true },
    'Field Library': { create: true, read: true, update: true, delete: true },
    Workflows: { create: true, read: true, update: true, delete: true },
    Events: { create: true, read: true, update: true, delete: true },
    Labels: { create: true, read: true, update: true, delete: true },
    'Users & Roles': { create: true, read: true, update: true, delete: true },
  },
  r_ops: {
    'Master Data': { create: true, read: true, update: true, delete: false },
    'Field Library': { create: false, read: true, update: false, delete: false },
    Workflows: { create: false, read: true, update: false, delete: false },
    Events: { create: true, read: true, update: true, delete: false },
    Labels: { create: true, read: true, update: false, delete: false },
    'Users & Roles': { create: false, read: false, update: false, delete: false },
  },
  r_qa: {
    'Master Data': { create: false, read: true, update: false, delete: false },
    'Field Library': { create: false, read: true, update: false, delete: false },
    Workflows: { create: false, read: true, update: false, delete: false },
    Events: { create: true, read: true, update: true, delete: false },
    Labels: { create: false, read: true, update: false, delete: false },
    'Users & Roles': { create: false, read: false, update: false, delete: false },
  },
  r_dealer: {
    'Master Data': { create: false, read: true, update: false, delete: false },
    'Field Library': { create: false, read: false, update: false, delete: false },
    Workflows: { create: false, read: false, update: false, delete: false },
    Events: { create: true, read: true, update: false, delete: false },
    Labels: { create: false, read: true, update: false, delete: false },
    'Users & Roles': { create: false, read: false, update: false, delete: false },
  },
  r_viewer: {
    'Master Data': { create: false, read: true, update: false, delete: false },
    'Field Library': { create: false, read: true, update: false, delete: false },
    Workflows: { create: false, read: true, update: false, delete: false },
    Events: { create: false, read: true, update: false, delete: false },
    Labels: { create: false, read: true, update: false, delete: false },
    'Users & Roles': { create: false, read: false, update: false, delete: false },
  },
};

/** Current signed-in user (drives Account + the RS avatar in TopNav). */
export const currentUser = {
  name: 'Riya Sharma',
  email: 'riya.sharma@acmefoods.in',
  role: 'Tenant Admin',
  initials: 'RS',
};

export interface Session {
  id: string;
  device: string;
  location: string;
  lastSeen: string;
  current: boolean;
}

export const sessions: Session[] = [
  {
    id: 's_01',
    device: 'Chrome · macOS',
    location: 'Mumbai, IN',
    lastSeen: 'Active now',
    current: true,
  },
  {
    id: 's_02',
    device: 'Strings Scan PWA · Android',
    location: 'Pune, IN',
    lastSeen: '4 hr ago',
    current: false,
  },
  {
    id: 's_03',
    device: 'Safari · iPhone',
    location: 'Mumbai, IN',
    lastSeen: 'Yesterday',
    current: false,
  },
];
