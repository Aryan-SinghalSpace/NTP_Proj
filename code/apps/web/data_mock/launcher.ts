/**
 * Page registry for the Strings platform. This drives the temporary `/launcher`
 * index (the "see all pages" screen) and mirrors docs/RUNBOOK.md.
 *
 * NOTE: the launcher is a scaffolding aid ("just for now"); everything here is
 * mock/structural and lives under data_mock so it can be removed once real
 * navigation + auth gating exist.
 */

export type PageStatus = 'built' | 'partial' | 'pending';

export interface PageEntry {
  title: string;
  /** what this page represents — one line, also used in the runbook */
  blurb: string;
  href: string;
  icon: string; // key into the icon map in app/launcher/page.tsx
  status: PageStatus;
}

export interface PageGroup {
  group: string;
  note: string;
  pages: PageEntry[];
}

export const registry: PageGroup[] = [
  {
    group: 'Operational — Tenant workspace',
    note: 'The day-to-day surface a tenant admin / user lives in.',
    pages: [
      { title: 'Dashboard', blurb: 'Production snapshot — KPIs, event volume, active recall, FEFO advisories.', href: '/dashboard', icon: 'grid', status: 'built' },
      { title: 'Master Data', blurb: 'Products/GTINs, manufacturers, brand owners and pack hierarchy. Locked identity fields.', href: '/master-data', icon: 'box', status: 'built' },
      { title: 'Field Library', blurb: 'Three-tier field model (Core / Super / Tenant Custom). Reads the live API.', href: '/fields', icon: 'layers', status: 'partial' },
      { title: 'Workflow Builder', blurb: 'No-code canvas — palette, nodes, inspector, validate / dry-run / publish.', href: '/workflows', icon: 'flow', status: 'built' },
      { title: 'Events & Trace', blurb: 'Append-only event stream, forward/backward trace explorer, recall fan-out.', href: '/events', icon: 'activity', status: 'built' },
      { title: 'Label Designer', blurb: 'WYSIWYG label canvas — Zint rendering, scannability check, PDF/PNG/ZPL output.', href: '/labels', icon: 'tag', status: 'built' },
      { title: 'Scanning App', blurb: 'Mobile PWA surface — tag, dispatch, receive against labels, offline sync.', href: '/scanning', icon: 'scan', status: 'built' },
      { title: 'Dispatch & Receive', blurb: 'Multi-dealer dispatch with legs + dealer receiving and FEFO advisory.', href: '/dispatch', icon: 'truck', status: 'built' },
      { title: 'Reports', blurb: 'Template-based reports & analytics across events, trace and inventory.', href: '/reports', icon: 'barChart', status: 'built' },
    ],
  },
  {
    group: 'Tenant administration & configuration',
    note: 'How a tenant admin shapes their own instance.',
    pages: [
      { title: 'Settings', blurb: 'Tenant profile, locale, GS1 conformance toggle and platform preferences.', href: '/settings', icon: 'settings', status: 'built' },
      { title: 'Users', blurb: 'Invite, manage and deactivate users; assign roles within the tenant.', href: '/users', icon: 'users', status: 'built' },
      { title: 'Roles & Permissions', blurb: 'Configurable tenant roles with granular, resource-level permissions.', href: '/roles', icon: 'shield', status: 'built' },
      { title: 'Identity Schemes', blurb: 'Configure GTIN / UUID / custom identity schemes and validation.', href: '/identity-schemes', icon: 'key', status: 'built' },
      { title: 'Notifications', blurb: 'In-app / email / webhook notification rules and delivery log.', href: '/notifications', icon: 'mail', status: 'built' },
      { title: 'Approvals', blurb: 'Queue for field-promotion requests and workflow publish approvals.', href: '/approvals', icon: 'inbox', status: 'built' },
      { title: 'Audit Log', blurb: 'Append-only, versioned history of every configuration change.', href: '/audit', icon: 'history', status: 'built' },
      { title: 'Account', blurb: 'Your profile, sessions and personal preferences.', href: '/account', icon: 'user', status: 'built' },
    ],
  },
  {
    group: 'Platform super-admin console',
    note: 'God-mode across all tenants (Platform Super Admin / Platform Admin).',
    pages: [
      { title: 'Tenants', blurb: 'Onboard, configure, suspend and inspect every customer tenant.', href: '/admin/tenants', icon: 'buildings', status: 'built' },
      { title: 'Super Fields', blurb: 'Canonical shared field library + Tenant→Super promotion approval queue.', href: '/admin/super-fields', icon: 'star', status: 'built' },
      { title: 'Usage Metrics', blurb: 'Platform-wide usage: events, storage, active tenants (no billing in v1).', href: '/admin/usage', icon: 'barChart', status: 'built' },
    ],
  },
  {
    group: 'Auth & onboarding',
    note: 'Entry points — chrome-free, pre-login.',
    pages: [
      { title: 'Login', blurb: 'Email/password + SSO sign-in (OIDC stand-in for now).', href: '/login', icon: 'login', status: 'built' },
      { title: 'Register', blurb: 'New user sign-up / invite acceptance.', href: '/register', icon: 'user', status: 'built' },
      { title: 'Tenant Onboarding', blurb: 'Guided wizard to spin up a configured customer instance.', href: '/onboarding', icon: 'buildings', status: 'built' },
      { title: 'Forgot Password', blurb: 'Request a password reset link.', href: '/forgot-password', icon: 'key', status: 'built' },
    ],
  },
];
