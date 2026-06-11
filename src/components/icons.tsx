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
