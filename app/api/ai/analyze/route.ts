import { createLlmClient, getLlmConfig } from '@/lib/llm-client';
import { ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts';
import { getFdcData } from '@/lib/fdc-data';
import { getAlarmData } from '@/lib/alarm-data';
import { getSpcData } from '@/lib/spc-data';
import { createDemoStream, SSE_HEADERS } from '@/lib/demo-stream';
import { MOCK_ANALYSIS_REPORT } from '@/lib/mock-responses';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scenario, equipmentId, demo } = body as {
      scenario?: string;
      equipmentId?: string;
      demo?: boolean;
    };

    if (!scenario) {
      return Response.json(
        { error: 'Missing required field: scenario' },
        { status: 400 },
      );
    }

    const config = getLlmConfig();
    const isDemoMode = demo === true || !config.apiKey;

    // Demo mode: stream pre-written mock response
    if (isDemoMode) {
      return new Response(createDemoStream(MOCK_ANALYSIS_REPORT), { headers: SSE_HEADERS });
    }

    // Build context from FDC data, alarms, SPC for the scenario
    const fdcData = getFdcData(undefined, scenario);
    const alarms = getAlarmData({ equipmentId: equipmentId ?? undefined });
    const spcData = getSpcData();

    const oosParams = fdcData.filter((p) => p.status !== 'NORMAL');
    const activeAlarms = alarms.filter((a) => a.status === 'ACTIVE');
    const spcSummary = spcData.map((s) => ({
      name: s.name,
      process: s.process,
      cpk: s.cpk,
      status: s.status,
      oocViolations: s.oocViolations,
    }));

    const userMessage = [
      `Analyze the following FDC anomaly scenario: **${scenario}**`,
      equipmentId ? `Equipment under investigation: ${equipmentId}` : '',
      '',
      '## FDC Parameters (non-normal only)',
      '```json',
      JSON.stringify(oosParams, null, 2),
      '```',
      '',
      '## Active Alarms',
      '```json',
      JSON.stringify(activeAlarms, null, 2),
      '```',
      '',
      '## SPC Summary',
      '```json',
      JSON.stringify(spcSummary, null, 2),
      '```',
    ]
      .filter(Boolean)
      .join('\n');

    const client = createLlmClient();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.chat.completions.create({
            model: config.model,
            messages: [
              { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 8192,
            temperature: config.temperature,
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
