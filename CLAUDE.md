# FDC AI Dashboard — 반도체 FDC 이상탐지 + AI 분석 POC

## 개요
반도체 팹 FDC(Fault Detection & Classification) 데이터를 시각화하고,
생성형 AI가 자동으로 이상 분석 리포트를 작성하는 데모 대시보드.
FLOPI와 별개 프로젝트. 회사 내부 의사결정자에게 AI 역량을 보여주기 위한 POC.

## 기술 스택
- **Next.js 16** + Tailwind v4 + Recharts 3 + OpenAI SDK
- **디자인**: 라이트 글래스모피즘
- **LLM**: OpenAI Compatible API (기본 Gemini 2.0 Flash, 교체 가능)
- **데이터**: SEMI 표준 기반 합성 데이터 (SEMI E164, ITRS/IRDS 5nm node)
- **장비 벤더**: LAM Research, Applied Materials, ASML, TEL, KLA

## 포트
- 개발/프로덕션: **3020**

## 프로젝트 구조
```
fdc-ai-dashboard/
├── app/
│   ├── layout.tsx, globals.css, page.tsx (→ /dashboard redirect)
│   ├── dashboard/
│   │   ├── layout.tsx        # 사이드바 + 헤더 + 시나리오 드롭다운
│   │   └── page.tsx          # Overview (KPI, 장비 그리드, 도넛, 알람 타임라인)
│   ├── equipment/[equipmentId]/page.tsx  # 장비 상세 (Trace 차트, SPC, 알람)
│   ├── spc/page.tsx          # SPC 관리도 (Western Electric Rules)
│   ├── alarms/page.tsx       # 알람 목록 + 상관 분석
│   ├── reports/page.tsx      # AI 리포트 생성 (SSE 스트리밍) ★킬러 기능
│   ├── chat/page.tsx         # AI 채팅 (SSE 스트리밍)
│   └── api/
│       ├── fdc/{overview,equipment,parameters,anomalies}/route.ts
│       ├── spc/route.ts
│       ├── alarms/{route.ts, correlations/route.ts}
│       ├── ai/{analyze,chat,report}/route.ts  # SSE 스트리밍
│       └── config/route.ts   # LLM 설정 조회/변경
├── components/
│   ├── cards/    (GlassCard, KpiCard, EquipmentCard)
│   ├── charts/   (TraceChart, SpcChart, StatusDonut, AlarmTimeline)
│   ├── badges/   (SeverityBadge, StatusBadge, ProcessBadge)
│   ├── tables/   (AlarmTable, ParameterTable)
│   ├── ai/       (AiReportPanel, AiChatBox, ReportViewer)
│   └── filters/  (ProcessFilter, TimeRangeFilter)
└── lib/
    ├── types.ts, constants.ts
    ├── fdc-data.ts           # 6공정 FDC 파라미터 (SEMI E164 기반)
    ├── spc-data.ts           # 10개 SPC 항목 + Cpk + Western Electric Rules
    ├── alarm-data.ts         # 20건 알람 + 4개 상관 체인
    ├── trace-generator.ts    # AR(1) 자기회귀 시계열 생성
    ├── llm-client.ts         # OpenAI SDK 래퍼 (baseURL 교체 가능)
    └── prompts.ts            # AI 시스템 프롬프트
```

## 실행
```bash
cd /workspace/fdc-ai-dashboard
npm run dev    # → localhost:3020
```

## LLM 설정
기본값: Gemini 2.0 Flash (`generativelanguage.googleapis.com/v1beta/openai`)
사이드바 Settings에서 엔드포인트/모델/키 변경 가능.
교체 가능: Ollama, vLLM, OpenAI, Azure OpenAI 등 — baseURL만 변경.

## 이상 시나리오 (데모용)
헤더 드롭다운으로 활성화:
1. `etch_cd_shift` — RF 파워 저하 + 압력 드리프트 → CD 시프트
2. `cvd_particle` — 챔버 압력 불안정 → 파티클 검출
3. `litho_overlay` — 정렬 오차 + 포커스 드리프트 → 오버레이 불량
4. `cmp_scratch` — 패드 마모 → 균일도 불량
5. `pvd_target_eol` — 타겟 수명 말기 → 면저항 변동
6. `diffusion_temp_gradient` — Zone 온도 불균형 → 산화막 두께 이탈

## 데이터 출처
- 장비 스펙: SEMI E164-0218, ITRS/IRDS 2024 More Moore
- SPC: AIAG SPC Manual 2nd Ed., Western Electric Rules
- 알람 코드: SEMI E5/PV16 체계
- 장비 모델: LAM 2300 Kiyo45, ASML NXE:3600, AMAT Producer SE, TEL Alpha-303i 등

@AGENTS.md
