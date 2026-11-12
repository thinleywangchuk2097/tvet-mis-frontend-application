// Shared colours and figures for the "TVET at a glance" section.
// Public / private pair validated for colour-blind separation (blue vs amber).
export const NAVY = "#0a2d6e";
export const BLUE = "#1565c0";
export const PUBLIC_COLOR = "#1565c0";
export const PRIVATE_COLOR = "#e0a020";
export const LINE = "#e3eaf4";
export const INK = "#0f1f3d";

// ── Key TVET indicators (cumulative, public / private)
// Same figures as the previous TvetIndicatorsInstituteProviderType table.
export const INDICATOR_GROUPS = [
  {
    title: "Providers & centres",
    rows: [
      { name: "Registered training providers", pub: 14, pvt: 130 },
      { name: "Accredited training providers", pub: 12, pvt: 74 },
      { name: "Accredited assessment centres", pub: 18, pvt: 16 },
      { name: "Registered SES centres", pub: 20, pvt: 8 },
    ],
  },
  {
    title: "Registered professionals",
    rows: [
      { name: "Trainers", pub: 215, pvt: 197 },
      { name: "Accreditors", pub: 38, pvt: 18 },
      { name: "QMS auditors", pub: 22, pvt: 16 },
      { name: "Assessors", pub: 95, pvt: 92 },
    ],
  },
  {
    title: "Programmes & enrolment",
    rows: [
      { name: "Registered programmes", pub: 250, pvt: 470 },
      { name: "Accredited programmes", pub: 173, pvt: 69 },
      { name: "Enrolment in accredited (BQF) programmes", pub: 8094, pvt: 16990 },
      { name: "Enrolment in non-BQF programmes", pub: 5732, pvt: 45951 },
    ],
  },
  {
    title: "Certification",
    rows: [
      {
        name: "BQF certificates awarded",
        pub: 817,
        pvt: 1460,
        subItems: [
          { name: "Certificate 2", pub: 156, pvt: 265 },
          { name: "Certificate 3", pub: 125, pvt: 162 },
          { name: "Diploma", pub: 124, pvt: 830 },
          { name: "Advanced Diploma", pub: 412, pvt: 212 },
        ],
      },
      {
        name: "RPL certificates awarded",
        pub: 7,
        pvt: 55,
        subItems: [
          { name: "Certificate 2", pub: 2, pvt: 4 },
          { name: "Certificate 3", pub: 5, pvt: 51 },
        ],
      },
    ],
  },
];

// ── Training institutes by provider type
export const PROVIDER_TYPES = [
  { name: "Public", value: 48, color: PUBLIC_COLOR },
  { name: "Private", value: 86, color: PRIVATE_COLOR },
];

export const fmt = (n) => (n ?? 0).toLocaleString();
export const pct = (part, whole) =>
  whole ? Math.round((part / whole) * 100) : 0;
