import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const S = (p: P) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const GridIcon = (p: P) => (
  <svg {...S(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
export const BoxIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.3 7L12 12l8.7-5" />
  </svg>
);
export const LayersIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 2l9 5-9 5-9-5 9-5z" />
    <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
  </svg>
);
export const FlowIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="12" r="2.5" />
    <path d="M8.5 6H13a3 3 0 0 1 3 3M8.5 18H13a3 3 0 0 0 3-3" />
  </svg>
);
export const ActivityIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M3 12h4l2 7 4-14 2 7h6" />
  </svg>
);
export const TagIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);
export const SearchIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);
export const BellIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const CalendarIcon = (p: P) => (
  <svg {...S(p)}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
export const DownloadIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
export const AlertIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
export const RecallIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </svg>
);
export const ClockIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
export const ChevronDownIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const PlayIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M5 3l14 9-14 9V3z" />
  </svg>
);
export const MinusIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M5 12h14" />
  </svg>
);
export const FitIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);
export const PanelLeftIcon = (p: P) => (
  <svg {...S(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
);
export const DotsIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </svg>
);
export const LockIcon = (p: P) => (
  <svg {...S(p)}>
    <rect x="4.5" y="11" width="15" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const XIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const FilterIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M3 5h18M6 12h12M10 19h4" />
  </svg>
);
export const BuildingIcon = (p: P) => (
  <svg {...S(p)}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M9 21v-4h6v4" />
  </svg>
);
export const ChevronRightIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const UserIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
export const UsersIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5.5a3.5 3.5 0 0 1 0 6.8M17.5 20a6.5 6.5 0 0 0-3-5.5" />
  </svg>
);
export const AppsIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="5" cy="5" r="1.6" />
    <circle cx="12" cy="5" r="1.6" />
    <circle cx="19" cy="5" r="1.6" />
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
    <circle cx="5" cy="19" r="1.6" />
    <circle cx="12" cy="19" r="1.6" />
    <circle cx="19" cy="19" r="1.6" />
  </svg>
);
export const ArrowRightIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ChevronLeftIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const SettingsIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 3l8 3v6c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const KeyIcon = (p: P) => (
  <svg {...S(p)}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l9-9M17 6l2 2M15 8l2 2" />
  </svg>
);
export const MailIcon = (p: P) => (
  <svg {...S(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5L12 13l8.5-6.5" />
  </svg>
);
export const InboxIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M4 13l2.5-8h11L20 13" />
    <path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5h-5a3 3 0 0 1-6 0H4z" />
  </svg>
);
export const HistoryIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 4v4h4M12 8v4l3 2" />
  </svg>
);
export const BarChartIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
export const TruckIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17.5" cy="18" r="1.8" />
  </svg>
);
export const ScanIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </svg>
);
export const StarIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z" />
  </svg>
);
export const LogInIcon = (p: P) => (
  <svg {...S(p)}>
    <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l5-5-5-5M15 12H3" />
  </svg>
);
export const BuildingsIcon = (p: P) => (
  <svg {...S(p)}>
    <rect x="3" y="8" width="8" height="13" rx="1" />
    <rect x="13" y="3" width="8" height="18" rx="1" />
    <path d="M6 12h2M6 16h2M16 7h2M16 11h2M16 15h2" />
  </svg>
);

/**
 * Node-shape glyphs for the workflow builder, keyed by a semantic name.
 * Kept here so both the palette and the canvas nodes draw the same icon.
 */
const glyphs: Record<string, JSX.Element> = {
  scan: (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ),
  api: <path d="M4 7h16M4 12h16M4 17h10" />,
  validate: (
    <>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  branch: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <path d="M8.5 6H13a3 3 0 0 1 3 3M8.5 18H13a3 3 0 0 0 3-3" />
    </>
  ),
  route: <path d="M4 4h16v4H4zM4 16h16v4H4zM12 8v8" />,
  transform: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    </>
  ),
  genid: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 9v6M10 9v6M13 9v6M17 9v6" />
    </>
  ),
  genlabel: (
    <>
      <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6z" />
      <circle cx="8" cy="8" r="1.3" />
    </>
  ),
  record: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  approve: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  notify: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  loop: (
    <>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  subflow: <path d="M4 5h6v6H4zM14 5h6v6h-6zM9 16h6v3H9z" />,
};

export const Glyph = ({ name, ...p }: P & { name: string }) => (
  <svg {...S(p)}>{glyphs[name] ?? glyphs.api}</svg>
);
