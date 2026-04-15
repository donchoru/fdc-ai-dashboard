import type { TracePoint, ParameterStatus } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Gaussian random number via Box-Muller transform
// ─────────────────────────────────────────────────────────────────────────────
function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ─────────────────────────────────────────────────────────────────────────────
// Determine point status from UCL/LCL (3σ control limits)
// Also marks WARNING when between 2σ and 3σ (control limit inner zone)
// ─────────────────────────────────────────────────────────────────────────────
function determineStatus(value: number, ucl: number, lcl: number, target: number): ParameterStatus {
  // 2σ approximation: 2/3 of the UCL/LCL distance from target
  const range = (ucl - lcl) / 2;
  const warn2sigma = range * (2 / 3);

  if (value > ucl || value < lcl) return 'OOS';
  if (value > target + warn2sigma || value < target - warn2sigma) return 'WARNING';
  return 'NORMAL';
}

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly injection functions
// ─────────────────────────────────────────────────────────────────────────────

function injectDrift(
  values: number[],
  target: number,
  ucl: number,
  startIdx: number,
  noiseLevel: number,
): void {
  const range = ucl - target;
  const n = values.length - startIdx;
  for (let i = startIdx; i < values.length; i++) {
    const progress = (i - startIdx) / n;
    // Linear drift toward and past UCL
    const driftMagnitude = range * 1.1 * progress;
    const noise = gaussianRandom() * noiseLevel * (range * 0.1);
    values[i] = target + driftMagnitude + noise;
  }
}

function injectShift(
  values: number[],
  target: number,
  ucl: number,
  startIdx: number,
  noiseLevel: number,
): void {
  const range = ucl - target;
  // Step shift to 75% of UCL
  const shiftMagnitude = range * 0.75;
  for (let i = startIdx; i < values.length; i++) {
    const noise = gaussianRandom() * noiseLevel * (range * 0.1);
    values[i] = target + shiftMagnitude + noise;
  }
}

function injectSpike(
  values: number[],
  target: number,
  ucl: number,
  lcl: number,
  startIdx: number,
): void {
  const range = ucl - lcl;
  // Single spike event near anomaly start
  const spikeIdx = startIdx + Math.floor((values.length - startIdx) * 0.4);
  if (spikeIdx < values.length) {
    // Spike 30% beyond UCL
    values[spikeIdx] = ucl + range * 0.3;
  }
}

function injectOscillation(
  values: number[],
  target: number,
  ucl: number,
  startIdx: number,
  noiseLevel: number,
): void {
  const range = ucl - target;
  // Oscillation amplitude grows over time, reaching 2σ
  const amp = range * 0.7;
  for (let i = startIdx; i < values.length; i++) {
    const t = i - startIdx;
    const frequency = 0.4; // cycles per point
    const noise = gaussianRandom() * noiseLevel * (range * 0.05);
    values[i] = target + amp * Math.sin(2 * Math.PI * frequency * t) + noise;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main trace generator
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateTraceParams {
  target: number;
  ucl: number;
  lcl: number;
  points?: number;
  anomalyType?: 'drift' | 'shift' | 'spike' | 'oscillation' | null;
  anomalyStart?: number;   // 0-1 fraction of trace length, default 0.8
  noiseLevel?: number;     // 0-1 scale factor for noise, default 0.3
}

export function generateTrace(params: GenerateTraceParams): TracePoint[] {
  const {
    target,
    ucl,
    lcl,
    points = 100,
    anomalyType = null,
    anomalyStart = 0.8,
    noiseLevel = 0.3,
  } = params;

  const range = ucl - lcl;
  const naturalSpread = (range / 6) * noiseLevel; // ~Cpk 1.0 natural noise

  // AR(1) autoregressive process: x_t = φ * x_{t-1} + (1-φ) * target + ε_t
  const phi = 0.85; // autocorrelation coefficient — realistic for fab equipment
  const innovationStd = naturalSpread * Math.sqrt(1 - phi * phi);

  const values: number[] = new Array(points);
  values[0] = target + gaussianRandom() * naturalSpread * 0.5;

  for (let i = 1; i < points; i++) {
    const innovation = gaussianRandom() * innovationStd;
    values[i] = phi * values[i - 1] + (1 - phi) * target + innovation;
  }

  // Inject anomaly in the designated window
  if (anomalyType) {
    const startIdx = Math.floor(points * anomalyStart);
    switch (anomalyType) {
      case 'drift':
        injectDrift(values, target, ucl, startIdx, noiseLevel);
        break;
      case 'shift':
        injectShift(values, target, ucl, startIdx, noiseLevel);
        break;
      case 'spike':
        injectSpike(values, target, ucl, lcl, startIdx);
        break;
      case 'oscillation':
        injectOscillation(values, target, ucl, startIdx, noiseLevel);
        break;
    }
  }

  // Build TracePoint array with ISO8601 timestamps
  const now = Date.now();
  const intervalMs = 30 * 1000; // 30-second sampling interval (typical FDC)

  return values.map((v, i): TracePoint => {
    const tMs = now - (points - 1 - i) * intervalMs;
    const d = new Date(tMs);
    const time = d.toISOString().replace('T', ' ').substring(0, 19);

    return {
      time,
      value: +v.toFixed(4),
      ucl,
      lcl,
      target,
      status: determineStatus(v, ucl, lcl, target),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: generate trace for a known FDC parameter
// ─────────────────────────────────────────────────────────────────────────────

export interface ParameterTraceConfig {
  target: number;
  ucl: number;
  lcl: number;
  anomalyType?: 'drift' | 'shift' | 'spike' | 'oscillation' | null;
  points?: number;
}

export function generateParameterTrace(config: ParameterTraceConfig): TracePoint[] {
  return generateTrace({
    target: config.target,
    ucl: config.ucl,
    lcl: config.lcl,
    points: config.points ?? 100,
    anomalyType: config.anomalyType ?? null,
    anomalyStart: 0.75,
    noiseLevel: 0.35,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch generator for multi-parameter overlay charts
// ─────────────────────────────────────────────────────────────────────────────

export function generateMultiTrace(
  configs: Array<ParameterTraceConfig & { key: string }>,
): Record<string, TracePoint[]> {
  const result: Record<string, TracePoint[]> = {};
  for (const cfg of configs) {
    result[cfg.key] = generateParameterTrace(cfg);
  }
  return result;
}
