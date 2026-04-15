import { createLlmClient, getLlmConfig } from '@/lib/llm-client';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';
import { getFdcData, getEquipmentList } from '@/lib/fdc-data';
import { getAlarmData } from '@/lib/alarm-data';
import { getSpcData } from '@/lib/spc-data';
import type { ChatMessage } from '@/lib/types';
import { createDemoStream, SSE_HEADERS } from '@/lib/demo-stream';
import { pickChatResponse } from '@/lib/mock-responses';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, demo } = body as { messages?: ChatMessage[]; demo?: boolean };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Missing or empty messages array' },
        { status: 400 },
      );
    }

    const config = getLlmConfig();
    const isDemoMode = demo === true || !config.apiKey;

    // Demo mode: pick keyword-matched response and stream it
    if (isDemoMode) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
      const mockResponse = pickChatResponse(lastUserMessage);
      return new Response(createDemoStream(mockResponse), { headers: SSE_HEADERS });
    }

    // Build current FAB status context as a system injection
    const equipment = getEquipmentList();
    const activeAlarms = getAlarmData({ status: 'ACTIVE' });
    const oosParams = getFdcData().filter((p) => p.status === 'OOS');
    const spcOoc = getSpcData().filter((s) => s.status !== 'IN_CONTROL');

    const contextMessage = [
      '## Current FAB Status (real-time snapshot)',
      '',
      `**Equipment**: ${equipment.length} total | RUN: ${equipment.filter((e) => e.status === 'RUN').length} | DOWN: ${equipment.filter((e) => e.status === 'DOWN').length} | PM: ${equipment.filter((e) => e.status === 'PM').length} | IDLE: ${equipment.filter((e) => e.status === 'IDLE').length} | ENG: ${equipment.filter((e) => e.status === 'ENGINEERING').length}`,
      '',
      `**Active Alarms (${activeAlarms.length}):**`,
      activeAlarms.length > 0
        ? activeAlarms
            .map(
              (a) =>
                `- [${a.severity}] ${a.equipmentId} — ${a.alarmName}: ${a.description.substring(0, 80)}...`,
            )
            .join('\n')
        : '- None',
      '',
      `**OOS Parameters (${oosParams.length}):**`,
      oosParams.length > 0
        ? oosParams
            .map(
              (p) =>
                `- ${p.equipmentId} ${p.parameter}: ${p.value} ${p.unit} (spec: ${p.spec})`,
            )
            .join('\n')
        : '- None',
      '',
      `**SPC Excursions (${spcOoc.length}):**`,
      spcOoc.length > 0
        ? spcOoc
            .map(
              (s) =>
                `- ${s.name} [${s.status}] Cpk=${s.cpk ?? 'N/A'} violations=${s.oocViolations.length}`,
            )
            .join('\n')
        : '- None',
    ].join('\n');

    // Build messages array: system prompt + context + user messages
    const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      { role: 'system', content: contextMessage },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const client = createLlmClient();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.chat.completions.create({
            model: config.model,
            messages: llmMessages,
            max_tokens: config.maxTokens,
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
