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
    alarmName: '챔버 압력 상한 초과',
    description: '공정 챔버 압력이 UCL을 초과했습니다. 현재: 34.8 mTorr, UCL: 33.5 mTorr. 쓰로틀 밸브 개도 72% — MFC 피드백 오류 의심.',
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
    alarmName: '식각율 상한 이탈 (OOS)',
    description: 'OES 엔드포인트 식각율이 USL을 초과했습니다. 현재: 541 Å/min, USL: 530 Å/min. 압력 상승으로 플라즈마 화학 반응 가속.',
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
    alarmName: '식각 균일도 이탈 (OOS)',
    description: '웨이퍼 내 식각 균일도(1σ)가 규격 이탈. 현재: 3.2%, 규격: <2.0%. 5nm 노드 FinFET 게이트 CD 확장 위험 — 로트 홀드 권고.',
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
    alarmName: 'TEOS 유량 상한 초과',
    description: 'TEOS MFC 측정값 1122 mgm, 설정값 1000 mgm (+12.2%). MFC 드리프트 또는 기화기 하류 배관 누기 의심.',
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
    alarmName: '박막 두께 균일도 이탈',
    description: 'TEOS-PECVD 두께 균일도 3.8%(1σ)로 저하. 규격: <1.5%. 과다 전구체 유량으로 중심 두꺼운 방사형 프로파일 형성.',
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
    alarmName: '웨이퍼 스테이지 온도 편차',
    description: '웨이퍼 스테이지 온도: 22.18°C (목표 22.00°C, Δ=+0.18°C). ±0.05°C 안정도 규격 초과. 냉각 루프 유량 기준 대비 8% 감소.',
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
    alarmName: '오버레이 X축 이탈 (OOS)',
    description: 'X축 오버레이: 2.1nm (예산 ±1.5nm, IRDS 2024). 22.18°C 스테이지 열팽창으로 X축 계통 오프셋 발생. 3σ 위반.',
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
    alarmName: '웨이퍼 레벨링 오차 초과',
    description: '레벨링 잔류 오차 11.4nm, 한계 8nm 초과. 열 구배로 웨이퍼 휨 유발 — 오토포커스 보정이 5nm DOF 예산에 불충분.',
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
    alarmName: 'CMP 패드 수명 임계',
    description: '패드 사용률 88% (한계: 85%). 컨디셔너 디스크 마모 >15%. 슬러리 보유력 저하로 글레이징 위험.',
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
    alarmName: '제거율 하한 이탈 (OOS)',
    description: 'Cu CMP 제거율: 3116 Å/min (목표 3800 Å/min, -18%). ISR-M 신호 편차로 패드 글레이징 확인. 설비 DOWN 조치.',
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
    alarmName: '웨이퍼 내 균일도 이탈 (OOS)',
    description: 'WIWNU: 6.7% (범위/평균), 규격 <3.0%. 패드 표면 조도 저하로 슬러리 불균등 분포. 로트 홀드 진행 중.',
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
    alarmName: 'Zone 3 온도 하한 이탈',
    description: '퍼니스 Zone 3: 995.8°C (규격 1000±1°C). Zone 2(1000.1°C) 대비 4.2°C 편차. 히팅 엘리먼트 저항 기준 대비 +8% — 부분 고장 의심.',
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
    alarmName: '산화막 두께 균일도 이탈 (OOS)',
    description: '산화막 두께 균일도: 0.72Å(1σ), 규격 <0.5Å. Zone 3 열 구배로 300mm 웨이퍼 전체 1.8Å 방사형 두께 프로파일 형성.',
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
    alarmName: '스퍼터 타겟 수명 경고',
    description: 'TaN 스퍼터 타겟 사용률 71%. ISRM이 타겟 침식 불균일 3.2% 편차 검출. 500매 이내 타겟 교체 예약 필요.',
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
    alarmName: 'O2 유량 하한 경고',
    description: 'O2 가스 유량: 4.8 sccm (설정값 5.0 sccm, -4.0%). MFC 선형화 점검 권고. 미조치 시 측벽 폴리머 비율 변화 가능.',
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
    alarmName: '파티클 수 상승',
    description: '인시튜 파티클 수: 8개/웨이퍼 (>0.09μm), 규격 <5. 챔버 라이너 퇴적물 박리 의심. 챔버 클린 점검 필요.',
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
    alarmName: '노광 도즈 균일도 경고',
    description: 'EUV 소스 도즈 균일도: 0.28%(3σ/평균), 규격 <0.25%. DUV 조명 램프 강도 저하 — 소스 파워 보상 중.',
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
    alarmName: 'WIWNU 한계 근접',
    description: 'WIWNU: 3.1%, 규격 <3.0%. 경미한 이탈 — 컨디셔너 스윕 프로파일 최적화 권고. 5매마다 모니터링.',
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
    alarmName: 'PM 필요 — 웨이퍼 수 한계',
    description: '마지막 PM 이후 처리 웨이퍼: 3200매. PM 주기: 3000매 (SEMI E10). 정기 PM 격리 — 챔버 클린 및 포커스 링 교체.',
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
    alarmName: '챔버 베이스 압력 상한 초과',
    description: '증착 전 베이스 압력: 3.1E-8 Torr (규격 <1E-8 Torr). 트랜스퍼 모듈 게이트 밸브 O링 미세 누기 의심. 헬륨 리크 점검 권고.',
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
    name: '식각 압력 연쇄 이탈',
    description: '챔버 압력 편차가 식각율 가속을 유발하고 균일도 저하로 이어짐',
    alarmSequence: ['AL-20240415-001', 'AL-20240415-002', 'AL-20240415-003'],
    equipmentPattern: 'ETCH-001',
    timeWindowMin: 15,
    rootCauseHint: '쓰로틀 밸브 MFC 교정 드리프트 — APC(적응형 압력 제어) 루프 피드백 점검. 주요 조치: 쓰로틀 밸브 재교정 및 MFC 유량 곡선 재검증.',
  },
  {
    id: 'CORR-002',
    name: 'CVD TEOS 유량 이상',
    description: 'TEOS MFC 과다 유량이 증착율 증가 및 두께 불균일을 유발',
    alarmSequence: ['AL-20240415-004', 'AL-20240415-005'],
    equipmentPattern: 'CVD-001',
    timeWindowMin: 10,
    rootCauseHint: 'TEOS 기화기 온도 드리프트로 액체/기체 상 불균형 — 기화기 히터 설정값 및 MFC 교정 확인. 상류 압력 조절기 점검.',
  },
  {
    id: 'CORR-003',
    name: 'EUV 스테이지 열팽창 오버레이 연쇄',
    description: '스테이지 온도 편차가 열팽창을 일으켜 계통적 오버레이 오프셋 발생',
    alarmSequence: ['AL-20240415-006', 'AL-20240415-007', 'AL-20240415-008'],
    equipmentPattern: 'LITHO-001',
    timeWindowMin: 8,
    rootCauseHint: '웨이퍼 스테이지 냉각 회로 유량 제한 — 마이크로채널 열교환기 부분 막힘 의심. 냉각수 유량 및 필터 차압 확인. 단기적으로 열 모델 보정 적용 가능.',
  },
  {
    id: 'CORR-004',
    name: 'CMP 패드 열화 연쇄',
    description: '패드 수명 초과로 글레이징 발생, 제거율 저하 및 WIWNU 악화로 이어짐',
    alarmSequence: ['AL-20240415-009', 'AL-20240415-010', 'AL-20240415-011'],
    equipmentPattern: 'CMP-002',
    timeWindowMin: 10,
    rootCauseHint: '컨디셔너 디스크 마모 — 표면 절삭률 저하로 패드 글레이징(표면 거칠기 소실). 즉시 패드 및 컨디셔너 디스크 교체 필요. 향후 방지를 위해 컨디셔너 스윕 레시피 검토.',
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
