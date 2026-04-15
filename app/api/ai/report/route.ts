import { createLlmClient, getLlmConfig } from '@/lib/llm-client';
import { REPORT_SYSTEM_PROMPT } from '@/lib/prompts';
import { getFdcData, getEquipmentList } from '@/lib/fdc-data';
import { getAlarmData, getAlarmSummary } from '@/lib/alarm-data';
import { getSpcData } from '@/lib/spc-data';

type ReportType = 'shift' | 'daily';

const SHIFT_HOURS: Record<string, { label: string; durationHours: number }> = {
  shift: { label: 'shift (8h)', durationHours: 8 },
  daily: { label: 'daily (24h)', durationHours: 24 },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body as { type?: ReportType };

    if (!type || !['shift', 'daily'].includes(type)) {
      return Response.json(
        { error: 'Missing or invalid type. Must be "shift" or "daily".' },
        { status: 400 },
      );
    }

    const config = getLlmConfig();
    if (!config.apiKey) {
      return Response.json(
        { error: 'LLM API key not configured. Set GEMINI_API_KEY environment variable.' },
        { status: 400 },
      );
    }

    const now = new Date();
    const { durationHours, label } = SHIFT_HOURS[type];
    const shiftStart = new Date(now.getTime() - durationHours * 60 * 60 * 1000);

    // Gather comprehensive FAB data
    const equipment = getEquipmentList();
    const allAlarms = getAlarmData();
    const activeAlarms = allAlarms.filter((a) => a.status === 'ACTIVE');
    const criticalAlarms = allAlarms.filter(
      (a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE',
    );
    const spcItems = getSpcData();
    const fdcParams = getFdcData();
    const alarmSummary = getAlarmSummary();

    // Equipment status summary
    const equipmentStatus = equipment.map((eq) => ({
      equipmentId: eq.equipmentId,
      name: eq.name,
      line: eq.line,
      process: eq.process,
      status: eq.status,
      waferCount: eq.waferCount,
      lastPmDate: eq.lastPmDate,
    }));

    // SPC summary (just enough for report, not full values arrays)
    const spcSummary = spcItems.map((s) => ({
      key: s.key,
      name: s.name,
      process: s.process,
      cpk: s.cpk,
      status: s.status,
      latest: s.latest,
      unit: s.unit,
      oocViolationCount: s.oocViolations.length,
      oocViolations: s.oocViolations,
    }));

    // OOS FDC parameters
    const oosFdcParams = fdcParams
      .filter((p) => p.status !== 'NORMAL')
      .map((p) => ({
        equipmentId: p.equipmentId,
        process: p.process,
        parameter: p.parameter,
        value: p.value,
        unit: p.unit,
        spec: p.spec,
        status: p.status,
      }));

    // KPI calculations
    const runCount = equipment.filter((e) => e.status === 'RUN').length;
    const downCount = equipment.filter((e) => e.status === 'DOWN').length;
    const cpkValues = spcItems
      .map((s) => s.cpk)
      .filter((v): v is number => v !== undefined);
    const avgCpk =
      cpkValues.length > 0
        ? +(cpkValues.reduce((a, b) => a + b, 0) / cpkValues.length).toFixed(3)
        : 0;

    const reportContext = {
      reportType: type,
      reportLabel: label,
      shiftStart: shiftStart.toISOString(),
      shiftEnd: now.toISOString(),
      kpi: {
        totalEquipment: equipment.length,
        runCount,
        downCount,
        oee: +((runCount / equipment.length) * 100).toFixed(1),
        activeAlarms: activeAlarms.length,
        criticalAlarms: criticalAlarms.length,
        oosParameters: oosFdcParams.length,
        avgCpk,
      },
      alarmSummary,
      activeAlarms: activeAlarms.map((a) => ({
        id: a.id,
        time: a.time,
        equipmentId: a.equipmentId,
        equipmentName: a.equipmentName,
        process: a.process,
        alarmCode: a.alarmCode,
        alarmName: a.alarmName,
        description: a.description,
        severity: a.severity,
        status: a.status,
        semiReference: a.semiReference,
      })),
      equipmentStatus,
      spcSummary,
      oosFdcParams,
    };

    const userMessage = [
      `Generate a complete ${label} engineering report for the period:`,
      `- Start: ${shiftStart.toISOString()}`,
      `- End: ${now.toISOString()}`,
      '',
      '## FAB Snapshot Data',
      '```json',
      JSON.stringify(reportContext, null, 2),
      '```',
      '',
      'Generate a complete, professional report following the specified format with all sections.',
    ].join('\n');

    const client = createLlmClient();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.chat.completions.create({
            model: config.model,
            messages: [
              { role: 'system', content: REPORT_SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
            max_tokens: config.maxTokens,
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
