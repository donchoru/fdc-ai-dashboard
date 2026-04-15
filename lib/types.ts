// Equipment, Parameter, SPC, Alarm, AI types
export type ProcessType = 'etch' | 'cvd' | 'litho' | 'cmp' | 'pvd' | 'diffusion';
export type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
export type ParameterStatus = 'NORMAL' | 'WARNING' | 'OOS';
export type SpcStatus = 'IN_CONTROL' | 'WARNING' | 'OOC';
export type EquipmentStatus = 'RUN' | 'IDLE' | 'DOWN' | 'PM' | 'ENGINEERING';
export type AlarmStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED';

export interface Equipment {
  equipmentId: string;
  name: string;
  model: string;        // e.g., "LAM 2300 Kiyo"
  vendor: string;        // e.g., "LAM Research"
  line: string;
  process: ProcessType;
  status: EquipmentStatus;
  chamberCount: number;
  lastPmDate: string;
  waferCount: number;    // wafers processed since last PM
}

export interface FdcParameter {
  process: ProcessType;
  processLabel: string;
  parameter: string;
  description: string;
  value: number;
  unit: string;
  spec: string;
  ucl: number;
  lcl: number;
  target: number;
  status: ParameterStatus;
  equipmentId: string;
  semiStandard?: string; // e.g., "SEMI E10" reference
}

export interface SpcItem {
  key: string;
  name: string;
  process: ProcessType;
  target: number;
  unit: string;
  sigma: number;
  usl: number;
  lsl: number;
  ucl: number;
  lcl: number;
  recentValues: number[];
  latest: number;
  sampleSize: number;
  description: string;
  measurementTool: string;
  status: SpcStatus;
  cp?: number;
  cpk?: number;
  pp?: number;
  ppk?: number;
  mean?: number;
  std?: number;
  oocViolations: OocViolation[];
}

export interface OocViolation {
  rule: number;
  index: number;
  value: number | null;
  message: string;
}

export interface Alarm {
  id: string;
  time: string;
  timestamp: string;
  equipmentId: string;
  equipmentName: string;
  lineId: string;
  process: ProcessType | 'transfer';
  alarmCode: string;
  alarmName: string;
  description: string;
  value: number | null;
  spec: string | null;
  severity: Severity;
  status: AlarmStatus;
  acknowledged: boolean;
  semiReference?: string; // SEMI standard reference
}

export interface AlarmCorrelation {
  id: string;
  name: string;
  description: string;
  alarmSequence: string[];
  equipmentPattern: string;
  timeWindowMin: number;
  rootCauseHint: string;
}

export interface AnomalyScenario {
  id: string;
  process: ProcessType;
  description: string;
  affectedParameters: string[];
  rootCause: string;
  semiReference?: string;
}

export interface KpiData {
  totalEquipment: number;
  activeAlarms: number;
  oosParameters: number;
  avgCpk: number;
  oee: number;
  equipmentByStatus: Record<EquipmentStatus, number>;
  alarmsBySeverity: Record<Severity, number>;
}

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface TracePoint {
  time: string;
  value: number;
  ucl: number;
  lcl: number;
  target: number;
  status: ParameterStatus;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
