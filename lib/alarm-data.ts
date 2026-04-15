import type { Alarm, AlarmCorrelation, ProcessType, Severity, AlarmStatus } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Alarm data — SEMI E5 / SEMI PV16 compliant alarm codes
// Time-stamped with realistic FAB intervals
// ─────────────────────────────────────────────────────────────────────────────

const BASE_TIME = new Date('2024-04-15T06:00:00Z');

function ts(offsetMin: number): { time: string; timestamp: string } {
  const d = new Date(BASE_TIME.getTime() + offsetMin * 60 * 1000);
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const timestamp = d.toISOString();
  return { time, timestamp };
}

const ALARM_DATA: Alarm[] = [
  // ── Correlation Chain 1: Etch pressure cascade (ETCH-001)
  // AL-1001 → AL-1002 → AL-1003 forms a causal chain
  {
    id: 'AL-20240415-001',
    ...ts(0),
    equipmentId: 'ETCH-001',
    equipmentName: 'Kiyo45 #1',
    lineId: 'FAB-A',
    process: 'etch',
    alarmCode: 'E-PRES-001',
    alarmName: 'Chamber Pressure High',
    description: 'Process chamber pressure exceeded UCL. Current: 34.8 mTorr, UCL: 33.5 mTorr. Throttle valve position at 72% — suspected MFC feedback error.',
    value: 34.8,
    spec: '30 ± 3 mTorr',
    severity: 'WARNING',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §5.3',
  },
  {
    id: 'AL-20240415-002',
    ...ts(4),
    equipmentId: 'ETCH-001',
    equipmentName: 'Kiyo45 #1',
    lineId: 'FAB-A',
    process: 'etch',
    alarmCode: 'E-RATE-001',
    alarmName: 'Etch Rate High OOS',
    description: 'OES endpoint-derived etch rate exceeds USL. Current: 541 Å/min, USL: 530 Å/min. Elevated pressure accelerating plasma chemistry kinetics.',
    value: 541,
    spec: '500 ± 25 Å/min',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §6.2',
  },
  {
    id: 'AL-20240415-003',
    ...ts(7),
    equipmentId: 'ETCH-001',
    equipmentName: 'Kiyo45 #1',
    lineId: 'FAB-A',
    process: 'etch',
    alarmCode: 'E-UNIF-001',
    alarmName: 'Etch Uniformity OOS',
    description: 'Within-wafer etch uniformity (1σ) out of spec. Current: 3.2%, Spec: <2.0%. CD widening risk for 5nm node FinFET gate — lot hold recommended.',
    value: 3.2,
    spec: '< 2.0%',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §6.2',
  },

  // ── Correlation Chain 2: CVD TEOS flow excursion (CVD-001)
  {
    id: 'AL-20240415-004',
    ...ts(15),
    equipmentId: 'CVD-001',
    equipmentName: 'Producer #1',
    lineId: 'FAB-A',
    process: 'cvd',
    alarmCode: 'C-FLOW-001',
    alarmName: 'TEOS Flow Rate High',
    description: 'TEOS MFC reading 1122 mgm vs setpoint 1000 mgm (+12.2%). Suspected MFC drift or delivery line leak downstream of vaporizer.',
    value: 1122,
    spec: '1000 ± 50 mgm',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    acknowledged: true,
    semiReference: 'SEMI E164 §5.4',
  },
  {
    id: 'AL-20240415-005',
    ...ts(19),
    equipmentId: 'CVD-001',
    equipmentName: 'Producer #1',
    lineId: 'FAB-A',
    process: 'cvd',
    alarmCode: 'C-THKNU-001',
    alarmName: 'Film Thickness Non-Uniformity',
    description: 'TEOS-PECVD thickness uniformity degraded to 3.8% (1σ). Spec: <1.5%. Elevated precursor flow creating center-thick radial profile.',
    value: 3.8,
    spec: '< 1.5%',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §6.2',
  },

  // ── Correlation Chain 3: Litho overlay excursion (LITHO-001)
  {
    id: 'AL-20240415-006',
    ...ts(32),
    equipmentId: 'LITHO-001',
    equipmentName: 'NXE:3600 #1',
    lineId: 'FAB-A',
    process: 'litho',
    alarmCode: 'L-TEMP-001',
    alarmName: 'Wafer Stage Temp Deviation',
    description: 'Wafer stage temperature: 22.18°C vs target 22.00°C (Δ=+0.18°C). Exceeds ±0.05°C stability spec. Cooling loop flow rate reduced 8% vs baseline.',
    value: 22.18,
    spec: '22.0 ± 0.05°C',
    severity: 'WARNING',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §5.5',
  },
  {
    id: 'AL-20240415-007',
    ...ts(35),
    equipmentId: 'LITHO-001',
    equipmentName: 'NXE:3600 #1',
    lineId: 'FAB-A',
    process: 'litho',
    alarmCode: 'L-OVL-001',
    alarmName: 'Overlay X OOS',
    description: 'X-axis overlay: 2.1nm vs budget ±1.5nm (IRDS 2024). Thermal expansion of stage at 22.18°C causing systematic X-offset. 3-sigma violation.',
    value: 2.1,
    spec: '0 ± 1.5 nm',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §6.2',
  },
  {
    id: 'AL-20240415-008',
    ...ts(36),
    equipmentId: 'LITHO-001',
    equipmentName: 'NXE:3600 #1',
    lineId: 'FAB-A',
    process: 'litho',
    alarmCode: 'L-LEVEL-001',
    alarmName: 'Wafer Leveling Error High',
    description: 'Leveling residual error 11.4nm exceeds 8nm limit. Thermal gradient inducing wafer bow — auto-focus correction insufficient for 5nm DOF budget.',
    value: 11.4,
    spec: '< 8 nm',
    severity: 'WARNING',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §5.3',
  },

  // ── Correlation Chain 4: CMP pad degradation (CMP-002)
  {
    id: 'AL-20240415-009',
    ...ts(48),
    equipmentId: 'CMP-002',
    equipmentName: 'Reflexion LK #2',
    lineId: 'FAB-B',
    process: 'cmp',
    alarmCode: 'P-PAD-001',
    alarmName: 'Polishing Pad Life Critical',
    description: 'Pad utilization at 88% of qualified life (limit: 85%). Conditioner disk showing >15% wear. Glazing risk with reduced slurry retention.',
    value: 88,
    spec: '< 85%',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    acknowledged: true,
    semiReference: 'SEMI E164 §5.3',
  },
  {
    id: 'AL-20240415-010',
    ...ts(52),
    equipmentId: 'CMP-002',
    equipmentName: 'Reflexion LK #2',
    lineId: 'FAB-B',
    process: 'cmp',
    alarmCode: 'P-RATE-001',
    alarmName: 'Removal Rate Low OOS',
    description: 'Cu CMP removal rate: 3116 Å/min vs target 3800 Å/min (-18%). Pad glazing confirmed by ISR-M signal variance. Equipment DOWN initiated.',
    value: 3116,
    spec: '3800 ± 200 Å/min',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §6.2',
  },
  {
    id: 'AL-20240415-011',
    ...ts(53),
    equipmentId: 'CMP-002',
    equipmentName: 'Reflexion LK #2',
    lineId: 'FAB-B',
    process: 'cmp',
    alarmCode: 'P-WIWNU-001',
    alarmName: 'Within-Wafer Non-Uniformity OOS',
    description: 'WIWNU: 6.7% (range/mean) vs spec <3.0%. Non-uniform slurry distribution due to pad surface roughness reduction. Lot hold active.',
    value: 6.7,
    spec: '< 3.0%',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §6.2',
  },

  // ── Standalone alarms — various equipment
  {
    id: 'AL-20240415-012',
    ...ts(62),
    equipmentId: 'DIFF-001',
    equipmentName: 'Alpha-303i #1',
    lineId: 'FAB-A',
    process: 'diffusion',
    alarmCode: 'D-TEMP-003',
    alarmName: 'Zone 3 Temperature Low',
    description: 'Furnace zone 3: 995.8°C vs spec 1000±1°C. 4.2°C delta vs zone 2 at 1000.1°C. Heating element resistance +8% from baseline — partial failure suspected.',
    value: 995.8,
    spec: '1000 ± 1°C',
    severity: 'WARNING',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §5.3',
  },
  {
    id: 'AL-20240415-013',
    ...ts(65),
    equipmentId: 'DIFF-001',
    equipmentName: 'Alpha-303i #1',
    lineId: 'FAB-A',
    process: 'diffusion',
    alarmCode: 'D-THKNU-001',
    alarmName: 'Oxide Thickness Uniformity OOS',
    description: 'Oxide thickness uniformity: 0.72Å (1σ) vs spec <0.5Å. Zone 3 thermal gradient creating 1.8Å radial thickness profile across 300mm wafer.',
    value: 0.72,
    spec: '< 0.5 Å',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §6.2',
  },
  {
    id: 'AL-20240415-014',
    ...ts(78),
    equipmentId: 'PVD-002',
    equipmentName: 'Endura #2',
    lineId: 'FAB-B',
    process: 'pvd',
    alarmCode: 'V-TRGT-001',
    alarmName: 'Sputter Target Life Warning',
    description: 'TaN sputter target at 71% utilization. Target erosion non-uniformity detected by ISRM at 3.2% deviation. Schedule target exchange within 500 wafers.',
    value: 71,
    spec: '< 85%',
    severity: 'INFO',
    status: 'ACKNOWLEDGED',
    acknowledged: true,
    semiReference: 'SEMI E10 §4.1',
  },
  {
    id: 'AL-20240415-015',
    ...ts(85),
    equipmentId: 'ETCH-002',
    equipmentName: 'Kiyo45 #2',
    lineId: 'FAB-A',
    process: 'etch',
    alarmCode: 'E-GAS-002',
    alarmName: 'O2 Flow Low Warning',
    description: 'O2 gas flow: 4.8 sccm vs setpoint 5.0 sccm (-4.0%). MFC linearization check recommended. Sidewall polymer ratio may shift if uncorrected.',
    value: 4.8,
    spec: '5 ± 0.5 sccm',
    severity: 'WARNING',
    status: 'CLEARED',
    acknowledged: true,
    semiReference: 'SEMI E164 §5.4',
  },
  {
    id: 'AL-20240415-016',
    ...ts(92),
    equipmentId: 'CVD-002',
    equipmentName: 'Producer #2',
    lineId: 'FAB-A',
    process: 'cvd',
    alarmCode: 'C-PART-001',
    alarmName: 'Particle Count Elevated',
    description: 'In-situ particle count: 8 particles/wafer (>0.09μm) vs spec <5. Possible chamber liner deposit spallation. Clean chamber inspection required.',
    value: 8,
    spec: '< 5 particles/wafer',
    severity: 'WARNING',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §5.3',
  },
  {
    id: 'AL-20240415-017',
    ...ts(105),
    equipmentId: 'LITHO-002',
    equipmentName: 'NXT:2050i #1',
    lineId: 'FAB-B',
    process: 'litho',
    alarmCode: 'L-DOSE-001',
    alarmName: 'Dose Uniformity Warning',
    description: 'EUV source dose uniformity: 0.28% (3σ/mean) vs spec <0.25%. DUV illuminator lamp intensity dropping — source power compensation active.',
    value: 0.28,
    spec: '< 0.25%',
    severity: 'WARNING',
    status: 'CLEARED',
    acknowledged: true,
    semiReference: 'SEMI E164 §5.3',
  },
  {
    id: 'AL-20240415-018',
    ...ts(118),
    equipmentId: 'CMP-001',
    equipmentName: 'Reflexion LK #1',
    lineId: 'FAB-A',
    process: 'cmp',
    alarmCode: 'P-WIWNU-002',
    alarmName: 'WIWNU Approaching Limit',
    description: 'WIWNU: 3.1% vs spec <3.0%. Marginally OOS — conditioner sweep profile optimization recommended. Monitoring every 5 wafers.',
    value: 3.1,
    spec: '< 3.0%',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    acknowledged: true,
    semiReference: 'SEMI E164 §5.3',
  },
  {
    id: 'AL-20240415-019',
    ...ts(125),
    equipmentId: 'ETCH-003',
    equipmentName: 'Versys #1',
    lineId: 'FAB-B',
    process: 'etch',
    alarmCode: 'E-PM-001',
    alarmName: 'PM Due — Wafer Count Limit',
    description: 'Wafer count since last PM: 3200 wafers. PM interval: 3000 wafers (SEMI E10). Equipment quarantined for scheduled PM — chamber clean and focus ring replacement.',
    value: 3200,
    spec: '< 3000 wafers/PM',
    severity: 'INFO',
    status: 'CLEARED',
    acknowledged: true,
    semiReference: 'SEMI E10 §5.2',
  },
  {
    id: 'AL-20240415-020',
    ...ts(138),
    equipmentId: 'PVD-001',
    equipmentName: 'Endura #1',
    lineId: 'FAB-A',
    process: 'pvd',
    alarmCode: 'V-PRES-001',
    alarmName: 'Chamber Base Pressure High',
    description: 'Pre-deposition base pressure: 3.1E-8 Torr vs spec <1E-8 Torr. Possible O-ring micro-leak at transfer module gate valve. Helium leak check recommended.',
    value: 3.1e-8,
    spec: '< 1E-8 Torr',
    severity: 'WARNING',
    status: 'ACTIVE',
    acknowledged: false,
    semiReference: 'SEMI E164 §5.4',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Alarm Correlation Chains
// ─────────────────────────────────────────────────────────────────────────────

const ALARM_CORRELATIONS: AlarmCorrelation[] = [
  {
    id: 'CORR-001',
    name: 'Etch Pressure Cascade',
    description: 'Chamber pressure deviation triggers etch rate acceleration, leading to uniformity degradation',
    alarmSequence: ['AL-20240415-001', 'AL-20240415-002', 'AL-20240415-003'],
    equipmentPattern: 'ETCH-001',
    timeWindowMin: 15,
    rootCauseHint: 'Throttle valve MFC calibration drift — check APC (Adaptive Pressure Control) loop feedback. Primary action: recalibrate throttle valve and requalify MFC flow curve.',
  },
  {
    id: 'CORR-002',
    name: 'CVD TEOS Flow Excursion',
    description: 'TEOS MFC overflow causes deposition rate increase and thickness non-uniformity',
    alarmSequence: ['AL-20240415-004', 'AL-20240415-005'],
    equipmentPattern: 'CVD-001',
    timeWindowMin: 10,
    rootCauseHint: 'TEOS vaporizer temperature drift causing liquid/vapor phase imbalance — verify vaporizer heater setpoint and MFC calibration. Check upstream pressure regulator.',
  },
  {
    id: 'CORR-003',
    name: 'EUV Stage Thermal Overlay Cascade',
    description: 'Stage temperature deviation creates thermal expansion leading to systematic overlay offset',
    alarmSequence: ['AL-20240415-006', 'AL-20240415-007', 'AL-20240415-008'],
    equipmentPattern: 'LITHO-001',
    timeWindowMin: 8,
    rootCauseHint: 'Wafer stage cooling circuit flow restriction — likely partial blockage in micro-channel heat exchanger. Verify coolant flow rate and check filter differential pressure. Thermal model correction may compensate short-term.',
  },
  {
    id: 'CORR-004',
    name: 'CMP Pad Degradation Sequence',
    description: 'Pad life exceedance leads to glazing, causing removal rate drop and WIWNU degradation',
    alarmSequence: ['AL-20240415-009', 'AL-20240415-010', 'AL-20240415-011'],
    equipmentPattern: 'CMP-002',
    timeWindowMin: 10,
    rootCauseHint: 'Conditioner disk wear — surface cut rate degradation allows pad glazing (loss of asperity). Immediate pad and conditioner disk replacement required. Review conditioner sweep recipe for future prevention.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface AlarmFilters {
  equipmentId?: string;
  process?: ProcessType | 'transfer';
  severity?: Severity;
  status?: AlarmStatus;
  lineId?: string;
}

export function getAlarmData(filters?: AlarmFilters): Alarm[] {
  let data = [...ALARM_DATA];
  if (!filters) return data;

  if (filters.equipmentId) {
    data = data.filter((a) => a.equipmentId === filters.equipmentId);
  }
  if (filters.process) {
    data = data.filter((a) => a.process === filters.process);
  }
  if (filters.severity) {
    data = data.filter((a) => a.severity === filters.severity);
  }
  if (filters.status) {
    data = data.filter((a) => a.status === filters.status);
  }
  if (filters.lineId) {
    data = data.filter((a) => a.lineId === filters.lineId);
  }
  return data;
}

export function getAlarmCorrelations(equipmentId?: string): AlarmCorrelation[] {
  if (!equipmentId) return ALARM_CORRELATIONS;
  return ALARM_CORRELATIONS.filter((c) => c.equipmentPattern === equipmentId);
}

export function getAlarmSummary() {
  const all = ALARM_DATA;
  const bySeverity = all.reduce(
    (acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    },
    {} as Record<Severity, number>,
  );
  const byStatus = all.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<AlarmStatus, number>,
  );
  const byProcess = all.reduce(
    (acc, a) => {
      const key = a.process as string;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const byEquipment = all.reduce(
    (acc, a) => {
      acc[a.equipmentId] = (acc[a.equipmentId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total: all.length,
    bySeverity: {
      CRITICAL: bySeverity['CRITICAL'] || 0,
      WARNING: bySeverity['WARNING'] || 0,
      INFO: bySeverity['INFO'] || 0,
    },
    byStatus: {
      ACTIVE: byStatus['ACTIVE'] || 0,
      ACKNOWLEDGED: byStatus['ACKNOWLEDGED'] || 0,
      CLEARED: byStatus['CLEARED'] || 0,
    },
    byProcess,
    byEquipment,
    correlationCount: ALARM_CORRELATIONS.length,
  };
}
