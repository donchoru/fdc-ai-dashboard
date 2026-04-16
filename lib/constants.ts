export const PROCESS_LABELS: Record<string, string> = {
  etch: 'Etch (Dry Etch)',
  cvd: 'CVD (Chemical Vapor Deposition)',
  litho: 'Lithography',
  cmp: 'CMP (Chemical Mechanical Planarization)',
  pvd: 'PVD (Physical Vapor Deposition)',
  diffusion: 'Diffusion / Oxidation',
};

export const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
};

export const STATUS_COLORS = {
  RUN: '#22c55e',
  IDLE: '#a3a3a3',
  DOWN: '#ef4444',
  PM: '#f59e0b',
  ENGINEERING: '#8b5cf6',
};

export const PARAMETER_STATUS_COLORS = {
  NORMAL: '#22c55e',
  WARNING: '#f59e0b',
  OOS: '#ef4444',
};

export const SPC_STATUS_COLORS = {
  IN_CONTROL: '#22c55e',
  WARNING: '#f59e0b',
  OOC: '#ef4444',
};

// SEMI Standard References
export const SEMI_REFERENCES = {
  E10: 'SEMI E10-0814 Equipment Reliability, Availability, and Maintainability',
  E79: 'SEMI E79-0211 Standard for Definition and Measurement of Equipment Productivity',
  E95: 'SEMI E95-1101 Specification for Human Interface of Semiconductor Manufacturing Equipment',
  E142: 'SEMI E142-1109 Specification for Time Synchronization and Definition of Events',
  E164: 'SEMI E164-0218 Guide for FDC System Design',
};

// ITRS/IRDS Node Reference
export const TECHNOLOGY_NODE = {
  node: '5nm FinFET',
  year: 2024,
  gateLength: 12, // nm
  metalPitch: 28, // nm
  reference: 'IRDS 2024 More Moore',
};
