import { createLlmClient, getLlmConfig } from '@/lib/llm-client';
import { SPC_REPORT_SYSTEM_PROMPT } from '@/lib/prompts';
import { getSpcData } from '@/lib/spc-data';
import { createDemoStream, SSE_HEADERS } from '@/lib/demo-stream';
import { MOCK_SPC_REPORT } from '@/lib/mock-responses';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { process, scenario, demo } = body as { process?: string; scenario?: string; demo?: boolean };

    const config = getLlmConfig();
    const isDemoMode = demo === true || !config.apiKey;

    // Demo mode: stream pre-written mock response
    if (isDemoMode) {
      return new Response(createDemoStream(MOCK_SPC_REPORT), { headers: SSE_HEADERS });
    }

    const now = new Date();

    // Gather SPC data (optionally filtered by process and scenario)
    const spcItems = getSpcData(
      process as Parameters<typeof getSpcData>[0],
      scenario,
    );

    // Build comprehensive SPC context for the LLM
    const spcContext = spcItems.map((s) => ({
      key: s.key,
      name: s.name,
      process: s.process,
      unit: s.unit,
      target: s.target,
      usl: s.usl,
      lsl: s.lsl,
      ucl: s.ucl,
      lcl: s.lcl,
      mean: s.mean,
      std: s.std,
      cp: s.cp,
      cpk: s.cpk,
      pp: s.pp,
      ppk: s.ppk,
      latest: s.latest,
      status: s.status,
      sampleSize: s.sampleSize,
      oocViolationCount: s.oocViolations.length,
      oocViolations: s.oocViolations,
      description: s.description,
      measurementTool: s.measurementTool,
    }));

    // Aggregate KPIs for the report
    const cpkValues = spcItems
      .map((s) => s.cpk)
      .filter((v): v is number => v !== undefined);
    const avgCpk =
      cpkValues.length > 0
        ? +(cpkValues.reduce((a, b) => a + b, 0) / cpkValues.length).toFixed(3)
        : 0;
    const minCpk = cpkValues.length > 0 ? Math.min(...cpkValues) : 0;

    const oocItems = spcItems.filter((s) => s.status === 'OOC');
    const warningItems = spcItems.filter((s) => s.status === 'WARNING');
    const inControlItems = spcItems.filter((s) => s.status === 'IN_CONTROL');
    const totalOocViolations = spcItems.reduce((sum, s) => sum + s.oocViolations.length, 0);

    const reportContext = {
      reportType: 'spc',
      generatedAt: now.toISOString(),
      filter: {
        process: process ?? 'ALL',
        scenario: scenario ?? 'NORMAL',
      },
      kpi: {
        totalItems: spcItems.length,
        inControlCount: inControlItems.length,
        warningCount: warningItems.length,
        oocCount: oocItems.length,
        avgCpk,
        minCpk,
        totalOocViolations,
      },
      spcItems: spcContext,
    };

    const userMessage = [
      `SPC 분석 리포트를 생성해 주세요.`,
      `- 생성 시각: ${now.toISOString()}`,
      `- 공정 필터: ${process ?? '전체'}`,
      `- 시나리오: ${scenario ?? 'NORMAL'}`,
      '',
      '## SPC 데이터 스냅샷',
      '```json',
      JSON.stringify(reportContext, null, 2),
      '```',
      '',
      '위 데이터를 기반으로 지정된 섹션 구성에 따라 완전한 한국어 SPC 분석 리포트를 작성해 주세요.',
    ].join('\n');

    const client = createLlmClient();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.chat.completions.create({
            model: config.model,
            messages: [
              { role: 'system', content: SPC_REPORT_SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 8192,
            temperature: 0.2, // Low temperature for consistent report format
            stream: true,
          });

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ content })}\n\n`,
                ),
              );
            }
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: message })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
