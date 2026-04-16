import type { SpcItem, OocViolation, ProcessType } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Statistical utilities (AIAG SPC Manual 4th Ed.)
// ─────────────────────────────────────────────────────────────────────────────

export function calcStats(values: number[]): { mean: number; std: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1);
  return { mean, std: Math.sqrt(variance) };
}

export function calcCpk(values: number[], usl: number, lsl: number): { cp: number; cpk: number; pp: number; ppk: number } {
  const { mean, std } = calcStats(values);
  if (std === 0) return { cp: 999, cpk: 999, pp: 999, ppk: 999 };
  const cp = (usl - lsl) / (6 * std);
  const cpu = (usl - mean) / (3 * std);
  const cpl = (mean - lsl) / (3 * std);
  const cpk = Math.min(cpu, cpl);
  // Pp/Ppk use overall std (same for stable process)
  const pp = cp;
  const ppk = cpk;
  return {
    cp: +cp.toFixed(3),
    cpk: +cpk.toFixed(3),
    pp: +pp.toFixed(3),
    ppk: +ppk.toFixed(3),
  };
}

/**
 * AIAG SPC Manual — Western Electric Rules (WERs):
 * Rule 1: 1 point beyond 3σ (UCL/LCL)
 * Rule 2: 9 consecutive points same side of center line
 * Rule 3: 6 consecutive points trending up or down
 * Rule 4: 14 consecutive points alternating up/down
 * Rule 5: 2 of 3 consecutive points beyond 2σ (same side)
 * Rule 6: 4 of 5 consecutive points beyond 1σ (same side)
 * Rule 7: 15 consecutive points within 1σ (both sides — stratification)
 * Rule 8: 8 consecutive points beyond 1σ (both sides — mixture)
 */
export function evaluateOocRules(
  values: number[],
  mean: number,
  std: number,
): OocViolation[] {
  const violations: OocViolation[] = [];
  const sigma1 = std;
  const sigma2 = 2 * std;
  const sigma3 = 3 * std;

  // Rule 1: Beyond 3σ
  values.forEach((v, i) => {
    if (Math.abs(v - mean) > sigma3) {
      violations.push({
        rule: 1,
        index: i,
        value: v,
        message: `Rule 1: Point #${i + 1} (${v.toFixed(3)}) beyond 3σ control limit`,
      });
    }
  });

  // Rule 2: 9 consecutive same side
  for (let i = 8; i < values.length; i++) {
    const window = values.slice(i - 8, i + 1);
    if (window.every((v) => v > mean) || window.every((v) => v < mean)) {
      violations.push({
        rule: 2,
        index: i,
        value: values[i],
        message: `Rule 2: 9 consecutive points on same side of centerline ending at #${i + 1}`,
      });
      break;
    }
  }

  // Rule 3: 6 consecutive monotone trend
  for (let i = 5; i < values.length; i++) {
    const window = values.slice(i - 5, i + 1);
    let increasing = true;
    let decreasing = true;
    for (let j = 1; j < window.length; j++) {
      if (window[j] <= window[j - 1]) increasing = false;
      if (window[j] >= window[j - 1]) decreasing = false;
    }
    if (increasing || decreasing) {
      violations.push({
        rule: 3,
        index: i,
        value: values[i],
        message: `Rule 3: 6 consecutive points ${increasing ? 'increasing' : 'decreasing'} ending at #${i + 1}`,
      });
      break;
    }
  }

  // Rule 5: 2 of 3 consecutive beyond 2σ same side
  for (let i = 2; i < values.length; i++) {
    const window = values.slice(i - 2, i + 1);
    const aboveCount = window.filter((v) => v - mean > sigma2).length;
    const belowCount = window.filter((v) => mean - v > sigma2).length;
    if (aboveCount >= 2 || belowCount >= 2) {
      violations.push({
        rule: 5,
        index: i,
        value: values[i],
        message: `Rule 5: 2 of 3 consecutive points beyond 2σ on same side at #${i + 1}`,
      });
      break;
    }
  }

  // Rule 6: 4 of 5 consecutive beyond 1σ same side
  for (let i = 4; i < values.length; i++) {
    const window = values.slice(i - 4, i + 1);
    const aboveCount = window.filter((v) => v - mean > sigma1).length;
    const belowCount = window.filter((v) => mean - v > sigma1).length;
    if (aboveCount >= 4 || belowCount >= 4) {
      violations.push({
        rule: 6,
        index: i,
        value: values[i],
        message: `Rule 6: 4 of 5 consecutive points beyond 1σ on same side at #${i + 1}`,
      });
      break;
    }
  }

  return violations;
}

// ─────────────────────────────────────────────────────────────────────────────
// Realistic time series generation with autocorrelation (AR1 process)
// ─────────────────────────────────────────────────────────────────────────────

function gaussianRandom(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

function generateAR1Series(
  target: number,
  spread: number,  // ~1σ process spread
  n: number,
  phi = 0.75,      // AR(1) coefficient — realistic autocorrelation
): number[] {
  const values: number[] = [];
  let prev = target;
  for (let i = 0; i < n; i++) {
    const noise = gaussianRandom(0, spread * Math.sqrt(1 - phi * phi));
    const next = target + phi * (prev - target) + noise;
    values.push(next);
    prev = next;
  }
  return values;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPC Item definitions (AIAG SPC Manual + IRDS 2024 specs)
// ─────────────────────────────────────────────────────────────────────────────

type SpcItemBase = Omit<SpcItem, 'recentValues' | 'latest' | 'status' | 'cp' | 'cpk' | 'pp' | 'ppk' | 'mean' | 'std' | 'oocViolations' | 'ucl' | 'lcl'> & {
  ucl: number;
  lcl: number;
};

function buildSpcItem(
  base: SpcItemBase,
  scenario?: string,
): SpcItem {
  const spread = (base.usl - base.lsl) / 12; // ~Cpk 1.33 natural spread
  let values = generateAR1Series(base.target, spread, 25);

  // Apply OOC scenarios if requested
  if (scenario === 'OOC-DRIFT' && base.key === 'etch_cd') {
    // Rule 3: monotone drift in last 8 points
    for (let i = 17; i < 25; i++) {
      values[i] = base.target + ((i - 17) * (base.usl - base.target)) / 8;
    }
  }
  if (scenario === 'OOC-SHIFT' && base.key === 'overlay_x') {
    // Rule 2: 9+ points above mean (systematic shift)
    for (let i = 15; i < 25; i++) {
      values[i] = base.target + (base.usl - base.target) * 0.65;
    }
  }
  if (scenario === 'OOC-SPIKE' && base.key === 'cmp_removal_rate') {
    // Rule 1: single OOC point
    values[22] = base.usl + (base.usl - base.lsl) * 0.15;
  }
  if (scenario === 'OOC-OSCILLATION' && base.key === 'diffusion_oxide_thickness') {
    // Rule 4: alternating pattern
    for (let i = 10; i < 25; i++) {
      const amp = (base.usl - base.lsl) * 0.35;
      values[i] = base.target + (i % 2 === 0 ? amp : -amp);
    }
  }

  // ── "이상 발생" 헤더 시나리오 → 알람과 매칭되는 SPC 항목에 OOC 주입 ──
  if (scenario === 'incident') {
    const oocRange = base.usl - base.lsl;
    // 알람 체인별로 대응하는 SPC 항목에 확실히 UCL/LCL 넘는 데이터 생성
    if (base.key === 'etch_cd') {
      // ETCH-001 알람: 압력 드리프트 → CD 상승 드리프트
      for (let i = 18; i < 25; i++) {
        values[i] = base.usl + oocRange * 0.05 * (i - 17);
      }
    }
    if (base.key === 'dep_oxide_thickness') {
      // CVD-001 알람: TEOS 유량 이상 → 두께 상한 초과
      values[21] = base.usl + oocRange * 0.12;
      values[23] = base.usl + oocRange * 0.08;
    }
    if (base.key === 'overlay_x') {
      // LITHO-001 알람: 스테이지 열팽창 → overlay 시프트
      for (let i = 16; i < 25; i++) {
        values[i] = base.target + (base.usl - base.target) * 0.75;
      }
    }
    if (base.key === 'cmp_uniformity') {
      // CMP-002 알람: 패드 열화 → 균일도 악화
      values[20] = base.usl + oocRange * 0.1;
      values[22] = base.usl + oocRange * 0.15;
      values[24] = base.usl + oocRange * 0.2;
    }
    if (base.key === 'diffusion_oxide_thickness') {
      // DIFF-001 알람: Zone 온도 불균일 → 산화막 두께 하한 이탈
      values[19] = base.lsl - oocRange * 0.08;
      values[22] = base.lsl - oocRange * 0.12;
    }
  }

  const { mean, std } = calcStats(values);
  const { cp, cpk, pp, ppk } = calcCpk(values, base.usl, base.lsl);
  const latest = values[values.length - 1];
  const ucl = mean + 3 * std;
  const lcl = mean - 3 * std;
  const allViolations = evaluateOocRules(values, mean, std);

  // 정상 운전(시나리오 없음)에서는 Rule 1(±3σ 초과)만 적용
  // 패턴 규칙(Rule 2,3,5,6)은 OOC 시나리오에서만 활성화
  // → UCL/LCL 안에 있는데 "관리 이탈" 표시되는 오탐 방지
  const isNormalOp = !scenario || scenario === 'NORMAL' || scenario === 'maintenance' || scenario === 'rampup';
  const oocViolations = isNormalOp
    ? allViolations.filter((v) => v.rule === 1)
    : allViolations;

  let status: SpcItem['status'] = 'IN_CONTROL';
  if (oocViolations.length > 0) {
    const hasRule1 = oocViolations.some((v) => v.rule === 1);
    status = hasRule1 ? 'OOC' : 'WARNING';
  }
  if (cpk < 1.0) status = 'OOC';
  else if (cpk < 1.33) status = 'WARNING';

  return {
    ...base,
    recentValues: values.map((v) => +v.toFixed(4)),
    latest: +latest.toFixed(4),
    status,
    cp,
    cpk,
    pp,
    ppk,
    mean: +mean.toFixed(4),
    std: +std.toFixed(4),
    ucl: +ucl.toFixed(4),
    lcl: +lcl.toFixed(4),
    oocViolations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10 SPC items — 5nm node specs (IRDS 2024)
// ─────────────────────────────────────────────────────────────────────────────

function buildAllSpcItems(scenario?: string): SpcItem[] {
  return [
    buildSpcItem(
      {
        key: 'etch_cd',
        name: 'Gate CD (Etch)',
        process: 'etch',
        target: 12.0,
        unit: 'nm',
        sigma: 0.15,
        usl: 12.5,
        lsl: 11.5,
        ucl: 12.45,
        lcl: 11.55,
        sampleSize: 9,
        description: 'Gate critical dimension after dry etch — IRDS 2024 5nm node target 12nm ±0.5nm',
        measurementTool: 'KLA eDR-7000 (CD-SEM)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'dep_oxide_thickness',
        name: 'TEOS Oxide Thickness (CVD)',
        process: 'cvd',
        target: 500.0,
        unit: 'Å',
        sigma: 5.0,
        usl: 515.0,
        lsl: 485.0,
        ucl: 515.0,
        lcl: 485.0,
        sampleSize: 5,
        description: 'TEOS-PECVD SiO2 ILD thickness — IRDS PMD target 500Å ±3%',
        measurementTool: 'KLA Spectra FX10 (Ellipsometry)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'dep_nitride_thickness',
        name: 'Si3N4 Nitride Thickness (CVD)',
        process: 'cvd',
        target: 300.0,
        unit: 'Å',
        sigma: 4.0,
        usl: 312.0,
        lsl: 288.0,
        ucl: 312.0,
        lcl: 288.0,
        sampleSize: 5,
        description: 'PECVD Si3N4 etch stop layer thickness — critical for SAC selectivity window',
        measurementTool: 'KLA Spectra FX10 (Ellipsometry)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'overlay_x',
        name: 'Overlay X (Litho)',
        process: 'litho',
        target: 0.0,
        unit: 'nm',
        sigma: 0.4,
        usl: 1.5,
        lsl: -1.5,
        ucl: 1.2,
        lcl: -1.2,
        sampleSize: 25,
        description: 'EUV lithography X-axis overlay — IRDS 2024 5nm budget ±1.5nm (3σ)',
        measurementTool: 'KLA ARCHER 750 (Overlay Metrology)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'overlay_y',
        name: 'Overlay Y (Litho)',
        process: 'litho',
        target: 0.0,
        unit: 'nm',
        sigma: 0.4,
        usl: 1.5,
        lsl: -1.5,
        ucl: 1.2,
        lcl: -1.2,
        sampleSize: 25,
        description: 'EUV lithography Y-axis overlay — IRDS 2024 5nm budget ±1.5nm (3σ)',
        measurementTool: 'KLA ARCHER 750 (Overlay Metrology)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'cmp_uniformity',
        name: 'CMP Within-Wafer NU',
        process: 'cmp',
        target: 2.0,
        unit: '%',
        sigma: 0.3,
        usl: 3.5,
        lsl: 0.5,
        ucl: 3.5,
        lcl: 0.5,
        sampleSize: 5,
        description: 'Cu CMP within-wafer non-uniformity (range/mean) — target <3% for 5nm BEOL',
        measurementTool: 'Therma-Wave Optiprobe (4-point probe Rs map)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'cmp_removal_rate',
        name: 'Cu CMP Removal Rate',
        process: 'cmp',
        target: 3800,
        unit: 'Å/min',
        sigma: 80,
        usl: 4050,
        lsl: 3550,
        ucl: 4020,
        lcl: 3580,
        sampleSize: 5,
        description: 'Cu film removal rate — Preston equation control for 70nm trench damascene',
        measurementTool: 'KLA Surfscan SP3 (post-CMP thickness)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'litho_cd',
        name: 'Metal Pitch CD (Litho)',
        process: 'litho',
        target: 28.0,
        unit: 'nm',
        sigma: 0.3,
        usl: 29.0,
        lsl: 27.0,
        ucl: 28.9,
        lcl: 27.1,
        sampleSize: 9,
        description: 'Metal 2 pitch CD at EUV exposure — IRDS 2024 28nm half-pitch target',
        measurementTool: 'KLA eDR-7000 (CD-SEM)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'pvd_sheet_resistance',
        name: 'TaN Sheet Resistance (PVD)',
        process: 'pvd',
        target: 150,
        unit: 'Ω/sq',
        sigma: 5,
        usl: 168,
        lsl: 132,
        ucl: 165,
        lcl: 135,
        sampleSize: 5,
        description: 'TaN barrier PVD sheet resistance — 4-point probe, target 150±15Ω/sq for 7nm trench',
        measurementTool: 'KLA RS-200 (4-point probe)',
      },
      scenario,
    ),
    buildSpcItem(
      {
        key: 'diffusion_oxide_thickness',
        name: 'Gate Oxide Thickness (Diffusion)',
        process: 'diffusion',
        target: 12.0,
        unit: 'Å',
        sigma: 0.12,
        usl: 12.5,
        lsl: 11.5,
        ucl: 12.36,
        lcl: 11.64,
        sampleSize: 5,
        description: 'Thermal SiO2 gate oxide thickness — Deal-Grove growth, EOT target 1.2nm for 5nm node',
        measurementTool: 'KLA Spectra FX10 (Ellipsometry + SE)',
      },
      scenario,
    ),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// OOC Scenario definitions
// ─────────────────────────────────────────────────────────────────────────────

export function getSpcScenarios() {
  return [
    {
      id: 'NORMAL',
      name: '정상 운전',
      description: '모든 파라미터 통계적 관리 상태 (Cpk ≥ 1.33)',
    },
    {
      id: 'OOC-DRIFT',
      name: '게이트 CD 드리프트 (Rule 3)',
      description: '게이트 CD 단조 상승 드리프트 — WE Rule 3 위반, 쓰로틀 밸브 교정 이상 의심',
    },
    {
      id: 'OOC-SHIFT',
      name: 'Overlay X 시프트 (Rule 2)',
      description: 'X 오버레이 계통적 이동 — WE Rule 2 위반, 스테이지 열 드리프트 의심',
    },
    {
      id: 'OOC-SPIKE',
      name: 'CMP 제거율 급변 (Rule 1)',
      description: 'Cu 제거율 단발성 OOC 급변 — WE Rule 1 위반, 슬러리 농도 이상',
    },
    {
      id: 'OOC-OSCILLATION',
      name: '산화막 두께 진동 (Rule 4)',
      description: '산화막 두께 교대 패턴 — WE Rule 4 위반, Zone 온도 헌팅',
    },
  ];
}

export function getSpcData(process?: ProcessType, scenario?: string): SpcItem[] {
  const items = buildAllSpcItems(scenario);
  if (!process) return items;
  return items.filter((i) => i.process === process);
}
