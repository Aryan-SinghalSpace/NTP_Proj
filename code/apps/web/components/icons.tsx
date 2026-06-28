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
