/** Icônes inline minimalistes (trait 1.5, style Linear). */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const IconDashboard = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const IconRaci = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
    <circle cx="17.5" cy="9.5" r="2.4" />
    <path d="M15.5 14.6c2.7 0 4.6 1.5 5 4.4" />
  </svg>
);

export const IconAmdec = () => (
  <svg {...base}>
    <path d="M12 3.5 21 19.5H3L12 3.5Z" />
    <path d="M12 10v4" />
    <path d="M12 16.8v.2" />
  </svg>
);

export const IconActions = () => (
  <svg {...base}>
    <path d="M4 6.5 5.5 8 8 5" />
    <path d="M4 12.5 5.5 14 8 11" />
    <path d="M4 18.5 5.5 20 8 17" />
    <path d="M11 6.5h9M11 12.5h9M11 18.5h9" />
  </svg>
);

export const IconPlanning = () => (
  <svg {...base}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

export const IconPlus = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconZoomIn = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20.5 20.5-4.9-4.9M11 8.5v5M8.5 11h5" />
  </svg>
);

export const IconZoomOut = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20.5 20.5-4.9-4.9M8.5 11h5" />
  </svg>
);

export const IconExpand = () => (
  <svg {...base}>
    <path d="M14 4h6v6M10 20H4v-6M20 4l-6 6M4 20l6-6" />
  </svg>
);

export const IconCollapse = () => (
  <svg {...base}>
    <path d="M20 10h-6V4M4 14h6v6M14 10l6-6M10 14l-6 6" />
  </svg>
);

export const IconEdit = () => (
  <svg {...base}>
    <path d="M16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4L16.5 4.5Z" />
  </svg>
);

export const IconTrash = () => (
  <svg {...base}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
  </svg>
);

export const IconLink = () => (
  <svg {...base}>
    <path d="M10 14a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7l-1.6 1.6" />
    <path d="M14 10a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.7 5.7l1.6-1.6" />
  </svg>
);

export const IconLogout = () => (
  <svg {...base}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const IconUsers = () => (
  <svg {...base}>
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    <path d="M18.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M21.5 16c0-2.2-1.8-4-4-4h-1" />
  </svg>
);

export const IconUser = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5.5 21c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
  </svg>
);

export const IconMail = () => (
  <svg {...base}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const IconFiveWhys = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const IconIshikawa = () => (
  <svg {...base}>
    <line x1="2" y1="12" x2="21" y2="12" />
    <path d="M6 12V8M6 12V16" />
    <path d="M10 12V6M10 12V18" />
    <path d="M14 12V8M14 12V16" />
    <path d="M18 12V6M18 12V18" />
    <circle cx="21.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCapa = () => (
  <svg {...base}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

export const IconCheck = () => (
  <svg {...base}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconStar = () => (
  <svg {...base}>
    <path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3z" />
  </svg>
);

export const IconTarget = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBulb = () => (
  <svg {...base}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1.3 1.5 1.5 2.5h5c.2-1 .7-1.8 1.5-2.5A6 6 0 0 0 12 3z" />
  </svg>
);

export const IconLayers = () => (
  <svg {...base}>
    <path d="M12 2L2 7.5 12 13l10-5.5L12 2z" />
    <path d="M2 12.5L12 18l10-5.5" />
    <path d="M2 17.5L12 23l10-5.5" />
  </svg>
);

export const IconChevronLeft = () => (
  <svg {...base}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const IconTree = () => (
  <svg {...base}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="12" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <path d="M8.5 6h4a3 3 0 0 1 3 3v0.5" />
    <path d="M8.5 18h4a3 3 0 0 0 3-3v-0.5" />
  </svg>
);

export const IconFolder = () => (
  <svg {...base}>
    <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5h-8L9.5 5h-5A1.5 1.5 0 0 0 3 6.5v1z" />
  </svg>
);

export const IconHelp = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const IconTools = () => (
  <svg {...base}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.2-.6-.6-2.2 2.3-2.3z" />
  </svg>
);

export const IconCost = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.2c-.6-.7-1.5-1.1-2.5-1.1-1.8 0-3 1.2-3 3.9s1.2 3.9 3 3.9c1 0 1.9-.4 2.5-1.1" />
    <path d="M8 11.2h4.5M8 13h4.5" />
  </svg>
);

export const IconA3 = () => (
  <svg {...base}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const IconSwot = () => (
  <svg {...base}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 3v18M3 12h18" />
  </svg>
);
