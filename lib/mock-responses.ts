// Pre-written mock responses for demo mode
// Used when LLM API key is not configured

export const MOCK_ANALYSIS_REPORT = `## 이상 분석 리포트

### 요약
현재 활성화된 이상 시나리오에 대한 자동 분석 결과입니다.

### 탐지된 이상 패턴
- **RF Power 저하**: ETCH-001 설비에서 RF Forward Power가 지난 2시간 동안 점진적으로 감소하는 추세가 감지되었습니다 (1,850W → 1,780W, -3.8%)
- **Chamber Pressure 드리프트**: 동시에 챔버 압력이 목표값 대비 +2.1% 상승하여 UCL 근접 상태입니다
- **CD 시프트 위험**: 상기 두 파라미터의 복합 작용으로 Critical Dimension이 목표 대비 시프트될 가능성이 높습니다

### 근본 원인 분석 (RCA)

| 순위 | 원인 | 확률 | 근거 |
|------|------|------|------|
| 1 | RF Generator 열화 | 65% | 가동 시간 2,840hr, PM 주기 초과 |
| 2 | 매칭 네트워크 불량 | 20% | Reflected Power 간헐적 증가 |
| 3 | 가스 유량 변동 | 10% | MFC 교정 시점 경과 |
| 4 | 웨이퍼 차징 | 5% | ESC 전압 정상 범위 |

### 영향도 평가
- **수율 영향**: 현재 추세 지속 시 24시간 내 CD spec-out 예상 (영향 lot: ~45매)
- **확산 위험**: ETCH-002도 동일 RF Generator 계열 사용 → 모니터링 강화 권고

### 권고 조치
1. **즉시**: ETCH-001 RF Generator 출력 교정 실시
2. **24시간 내**: Matching Network 임피던스 점검
3. **다음 PM 시**: RF Generator 예방 교체 검토
4. **모니터링**: ETCH-002 RF Power 트렌드 감시 강화

---
*이 리포트는 AI 데모 모드로 생성되었습니다.*`;

export const MOCK_SHIFT_REPORT = `# Shift 엔지니어링 리포트

## 1. 요약
금번 Shift 기간 중 전반적인 FAB 가동 상태는 **양호**하며, 일부 설비에서 주의가 필요한 파라미터 변동이 감지되었습니다.

## 2. 설비 현황

| 설비 | 상태 | 가동률 | 특이사항 |
|------|------|--------|----------|
| ETCH-001 (Kiyo45 #1) | 🟢 RUN | 94.2% | RF Power 모니터링 중 |
| ETCH-002 (Kiyo45 #2) | 🟢 RUN | 91.8% | 정상 |
| CVD-001 (Producer #1) | 🟢 RUN | 88.5% | 챔버 압력 안정화 완료 |
| LITHO-001 (NXE:3600) | 🟢 RUN | 96.1% | 오버레이 정밀도 우수 |
| CMP-001 (Reflexion LK #1) | 🟢 RUN | 85.3% | 패드 교체 D-3 |
| CMP-002 (Reflexion LK #2) | 🔴 DOWN | 0% | PM 진행 중 (잔여 4hr) |
| PVD-001 (Endura #1) | 🟢 RUN | 92.7% | 정상 |
| DIFF-001 (Alpha-303i #1) | 🟢 RUN | 97.3% | 온도 균일도 양호 |

## 3. 활성 알람 현황
- **CRITICAL (2건)**: CMP-002 PM 알람, ETCH-003 배기 압력 이상
- **WARNING (5건)**: RF Power 추세 경고 2건, 온도 편차 1건, 유량 변동 2건
- **INFO (3건)**: PM 예정 알림, 소모품 교체 알림

## 4. SPC 이탈 항목
- **ETCH CD Uniformity**: Cpk 1.28 → 1.33 미만, Western Electric Rule 2 위반 (연속 7점 한쪽 편향)
- **CVD Thickness**: 정상 범위 (Cpk 1.85)

## 5. 수율 위험 평가
현재 수율 영향 요소는 제한적이나, ETCH-001 RF Power 추세 지속 시 CD 관련 수율 저하 가능성 있음.
예상 영향: **0.3~0.5% 수율 하락** (worst case)

## 6. 인수인계 사항
1. CMP-002 PM 완료 예정 (다음 Shift 중반) → 복귀 후 Qualification Run 필요
2. ETCH-001 RF Power 추세 모니터링 지속 → 1시간 간격 확인 요망
3. ETCH-003 PM 일정 조율 필요 (생산팀 협의)

---
*이 리포트는 AI 데모 모드로 생성되었습니다.*`;

export const MOCK_DAILY_REPORT = `# Daily 엔지니어링 리포트

## 1. 일일 운영 요약
오늘 24시간 동안 전반적인 FAB 가동률은 **91.4%**로 목표 대비 양호한 수준을 유지하였습니다.

## 2. 설비 운영 현황

| 설비 | 가동 시간 | 비가동 시간 | 비가동 사유 |
|------|-----------|-------------|-------------|
| ETCH-001 | 22.6hr | 1.4hr | 레시피 변경 대기 |
| ETCH-002 | 23.1hr | 0.9hr | 엔지니어링 테스트 |
| CVD-001 | 21.2hr | 2.8hr | 챔버 클리닝 |
| LITHO-001 | 23.5hr | 0.5hr | 기준 웨이퍼 측정 |
| CMP-001 | 20.4hr | 3.6hr | 패드 컨디셔닝 |
| CMP-002 | 16.0hr | 8.0hr | 정기 PM |
| PVD-001 | 22.2hr | 1.8hr | 타겟 교체 준비 |
| DIFF-001 | 23.4hr | 0.6hr | 온도 보정 |

## 3. 생산 실적
- **투입 웨이퍼**: 1,240매
- **완료 웨이퍼**: 1,187매
- **가공 중**: 53매
- **특이 LOT**: 3건 (ETCH CD spec hold 2건, CMP 균일도 확인 1건)

## 4. 품질 지표 (SPC)

| 공정 | 관리 항목 | 상태 | Cpk |
|------|----------|------|-----|
| Etch | CD Uniformity | ⚠️ 주의 | 1.28 |
| Etch | Etch Rate | ✅ 양호 | 1.67 |
| CVD | Film Thickness | ✅ 우수 | 1.85 |
| Litho | Overlay | ✅ 우수 | 2.12 |
| CMP | Removal Rate | ⚠️ 주의 | 1.15 |

## 5. 설비 이벤트 로그
- **04:32** ETCH-001 RF Power 저하 경보 → 엔지니어 대응 완료
- **09:15** CMP-002 정기 PM 시작
- **14:20** CVD-001 챔버 클리닝 완료, 공정 복귀
- **18:45** CMP-002 PM 완료, Qualification Run 진행 중
- **22:10** ETCH-001 RF Power 재교정 완료, 정상화

## 6. 내일 예정 작업
1. ETCH-001 Matching Network 임피던스 점검
2. CMP-001 패드 교체 (D-2)
3. PVD-001 타겟 잔량 평가 (현재 78%)

---
*이 리포트는 AI 데모 모드로 생성되었습니다.*`;

export const MOCK_SPC_REPORT = `## SPC 관리도 분석 리포트

### 전체 공정 능력 요약

| 공정 | 파라미터 | Cpk | 상태 | 비고 |
|------|----------|-----|------|------|
| Etch | CD Uniformity | 1.28 | ⚠️ 주의 | Rule 2 위반 |
| Etch | Etch Rate | 1.67 | ✅ 양호 | - |
| CVD | Film Thickness | 1.85 | ✅ 우수 | - |
| CVD | Stress | 1.42 | ✅ 양호 | - |
| Litho | Overlay | 2.12 | ✅ 우수 | - |
| CMP | Removal Rate | 1.15 | ⚠️ 주의 | Cpk 저하 추세 |
| CMP | Uniformity | 1.31 | ⚠️ 주의 | Rule 1 위반 |
| PVD | Sheet Resistance | 1.95 | ✅ 우수 | - |
| Diffusion | Oxide Thickness | 1.73 | ✅ 양호 | - |

### 주요 이탈 분석

#### 1. Etch CD Uniformity (Cpk: 1.28)
- **위반 규칙**: Western Electric Rule 2 — 연속 7개 점이 중심선 한쪽에 위치
- **원인 추정**: RF Power 점진적 저하에 따른 식각 균일도 편향
- **조치 권고**: RF Generator 출력 재교정, Matching Network 점검

#### 2. CMP Removal Rate (Cpk: 1.15)
- **위반 규칙**: 없음 (관리 한계 내이나 Cpk 저하 추세)
- **원인 추정**: 연마 패드 마모 (사용 시간: 320hr / 권장 교체: 350hr)
- **조치 권고**: 다음 PM 시 패드 교체 예정 확인, 슬러리 농도 점검

#### 3. CMP Uniformity (Cpk: 1.31)
- **위반 규칙**: Western Electric Rule 1 — 1개 점이 3σ 밖
- **원인 추정**: 패드 컨디셔닝 불균일
- **조치 권고**: 컨디셔너 디스크 상태 확인

### 공정 능력 트렌드
- **개선 추세**: CVD Thickness (Cpk 1.72→1.85), Litho Overlay (2.05→2.12)
- **악화 추세**: CMP Removal Rate (Cpk 1.35→1.15), Etch CD Uniformity (1.45→1.28)

### 종합 의견
전체 9개 SPC 항목 중 6개(67%)가 양호 이상이며, 3개 항목에서 주의가 필요합니다.
CMP 관련 2개 항목은 패드 교체 PM으로 개선이 예상되며, Etch CD Uniformity는 RF Generator 교정이 선행되어야 합니다.

---
*이 리포트는 AI 데모 모드로 생성되었습니다.*`;

// Chat responses — keyword-matched Q&A
export const MOCK_CHAT_RESPONSES: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['etch', 'rf', '파워', 'power', 'rf power', '식각'],
    answer: `## ETCH-001 RF Power 이상 분석

현재 ETCH-001에서 RF Forward Power 저하가 감지되고 있습니다.

### 현재 상태
- **측정값**: 1,780W (목표: 1,850W, 편차: -3.8%)
- **추세**: 지난 2시간 동안 점진적 감소
- **관련 파라미터**: Chamber Pressure +2.1% (UCL 근접)

### 예상 원인
1. **RF Generator 열화** (가능성 65%) — 현재 누적 가동 2,840시간으로 PM 주기(3,000시간) 임박
2. **Matching Network 불량** (가능성 20%) — Reflected Power 간헐적 증가 패턴과 상관
3. **가스 유량 변동** (가능성 10%) — MFC 교정 시점 초과

### 권고 조치
- **즉시**: RF Generator 출력 수동 교정 시도
- **오늘 내**: Matching Network 임피던스 재설정
- **이번 주**: PM 일정 앞당기기 검토 권장

CD spec-out 위험이 있으니 해당 LOT 샘플링 측정을 강화하세요.

---
*AI 데모 모드 응답입니다.*`,
  },
  {
    keywords: ['cmp', '연마', '패드', 'removal', 'uniformity', '균일도'],
    answer: `## CMP 공정 현황

### CMP-001 (Reflexion LK #1)
- **상태**: RUN — 가동 중
- **패드 수명**: 잔여 D-3 (약 72시간 후 교체 권장)
- **Removal Rate Cpk**: 1.15 (주의 — 하한 근접)
- **Uniformity Cpk**: 1.31 (Rule 1 위반 발생)

### CMP-002 (Reflexion LK #2)
- **상태**: PM 진행 중 (잔여 약 4시간)
- PM 완료 후 Qualification Run 필요

### 주요 관심 사항
패드 마모 진행에 따라 Removal Rate Cpk가 1.35 → 1.15로 하락하는 추세입니다.
슬러리 유량 및 컨디셔너 디스크 상태 점검이 함께 필요합니다.

### 조치 계획
1. CMP-001 패드 교체: D-3 예정 (일정 확인 완료)
2. CMP-002 PM 완료 후 즉시 Qual Run
3. 슬러리 농도 점검 (이번 Shift 내)

---
*AI 데모 모드 응답입니다.*`,
  },
  {
    keywords: ['알람', 'alarm', 'critical', '경보', '이상'],
    answer: `## 현재 활성 알람 현황

### CRITICAL (2건)
| 번호 | 설비 | 알람명 | 내용 |
|------|------|--------|------|
| A-001 | CMP-002 | PM_ALARM | 정기 PM 진행 중 (예정된 알람) |
| A-002 | ETCH-001 | RF_POWER_LOW | RF Forward Power 3.8% 저하 |

### WARNING (5건)
| 번호 | 설비 | 알람명 |
|------|------|--------|
| W-001 | ETCH-001 | RF_TREND_WARNING — 2시간 연속 하락 추세 |
| W-002 | ETCH-002 | RF_TREND_WARNING — 모니터링 중 |
| W-003 | CVD-001 | TEMP_DEVIATION — Zone 3 편차 ±0.8°C |
| W-004 | PVD-001 | FLOW_VARIATION — Ar 유량 ±1.2% |
| W-005 | DIFF-001 | FLOW_VARIATION — N2 유량 ±0.9% |

### INFO (3건)
- CMP-001 패드 교체 D-3 알림
- PVD-001 타겟 수명 78% 도달 알림
- ETCH-003 다음 PM 예정 알림

### 즉시 조치 필요
**ETCH-001 RF Power 저하(A-002)**가 가장 시급합니다.
CD 품질에 직접 영향을 줄 수 있으므로 엔지니어 현장 확인을 권장합니다.

---
*AI 데모 모드 응답입니다.*`,
  },
  {
    keywords: ['spc', '관리도', 'cpk', '공정 능력', '이탈', 'ooc'],
    answer: `## SPC 관리도 현황 요약

### 전체 현황
- **총 관리 항목**: 9개
- **정상 (IN_CONTROL)**: 6개 (67%)
- **주의 (WARNING)**: 2개 (22%)
- **이탈 (OOC)**: 1개 (11%)

### 이탈/주의 항목

#### OOC — Etch CD Uniformity (Cpk: 1.28)
Western Electric Rule 2 위반 — 연속 7점이 중심선 아래 위치.
RF Power 저하와 연동 분석 필요.

#### WARNING — CMP Removal Rate (Cpk: 1.15)
Cpk 하한(1.33) 미달 직전. 패드 마모 진행 중.

#### WARNING — CMP Uniformity (Cpk: 1.31)
Rule 1 위반 1건 발생. 컨디셔너 상태 확인 필요.

### 우수 항목
- **Litho Overlay**: Cpk 2.12 — 최우수
- **CVD Thickness**: Cpk 1.85 — 우수
- **PVD Sheet Resistance**: Cpk 1.95 — 우수

### 권고
Etch CD Uniformity가 RF Power 이슈와 연동되어 있으므로
RF Generator 교정 완료 후 SPC 추이를 재확인하세요.

---
*AI 데모 모드 응답입니다.*`,
  },
  {
    keywords: ['설비', 'equipment', '현황', '가동', '상태'],
    answer: `## 설비 가동 현황

### 실시간 상태 (${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} 기준)

| 설비 | 공정 | 상태 | 가동률 |
|------|------|------|--------|
| ETCH-001 | Etch | 🟢 RUN | 94.2% |
| ETCH-002 | Etch | 🟢 RUN | 91.8% |
| CVD-001 | CVD | 🟢 RUN | 88.5% |
| LITHO-001 | Litho | 🟢 RUN | 96.1% |
| CMP-001 | CMP | 🟢 RUN | 85.3% |
| CMP-002 | CMP | 🔴 DOWN | 0% (PM) |
| PVD-001 | PVD | 🟢 RUN | 92.7% |
| DIFF-001 | Diffusion | 🟢 RUN | 97.3% |

### KPI 요약
- **전체 OEE**: 91.4%
- **가동 설비**: 7/8대 (87.5%)
- **비가동**: 1대 (CMP-002, 정기 PM)
- **활성 알람**: 10건 (Critical 2, Warning 5, Info 3)

### 특이사항
- **ETCH-001**: RF Power 저하 — 엔지니어 모니터링 중
- **CMP-002**: PM 잔여 약 4시간 → Qual Run 후 복귀 예정
- **CMP-001**: 패드 교체 D-3 — 다음 PM 예정

---
*AI 데모 모드 응답입니다.*`,
  },
];

export const MOCK_CHAT_DEFAULT = `현재 FAB 전체 상태를 요약해 드리겠습니다.

## 현재 FAB 상태 요약

### 설비 가동 현황
- **가동 중 (RUN)**: 7대
- **정지 (DOWN/PM)**: 1대 (CMP-002, PM 진행 중)
- **전체 OEE**: 91.4%

### 주요 모니터링 항목
1. **ETCH-001**: RF Power 점진적 저하 추세 감지 — 모니터링 강화 중
2. **CMP-002**: 정기 PM 진행 중 (잔여 약 4시간)
3. **CMP-001**: 연마 패드 교체 D-3 — 균일도 모니터링 중

### SPC 요약
- 전체 9개 항목 중 **6개 양호**, **3개 주의/이탈**
- 가장 낮은 Cpk: CMP Removal Rate (1.15)

### 활성 알람
- CRITICAL: 2건
- WARNING: 5건
- INFO: 3건

특정 설비나 공정에 대해 더 자세히 알고 싶으시면 말씀해 주세요.

---
*AI 데모 모드 응답입니다.*`;

/**
 * Keyword-based chat response matcher.
 * Returns the best-match mock answer, or the default response.
 */
export function pickChatResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const entry of MOCK_CHAT_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }
  return MOCK_CHAT_DEFAULT;
}
