// Simulates SSE streaming with realistic typing speed.
// Used in demo mode when LLM API key is not configured.

export interface DemoStreamOptions {
  /** Characters per chunk (default: 4) */
  chunkSize?: number;
  /** Base delay in ms between chunks (default: 25) */
  delayMs?: number;
  /** Random jitter added to each delay: 0 ~ jitterMs (default: 15) */
  jitterMs?: number;
}

/**
 * Creates a ReadableStream that emits SSE-formatted chunks,
 * compatible with the existing API route SSE format:
 *   data: {"content":"..."}\n\n
 *   ...
 *   data: [DONE]\n\n
 */
export function createDemoStream(
  text: string,
  options: DemoStreamOptions = {},
): ReadableStream<Uint8Array> {
  const chunkSize = options.chunkSize ?? 4;
  const delayMs = options.delayMs ?? 25;
  const jitterMs = options.jitterMs ?? 15;

  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (index >= text.length) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        return;
      }

      const end = Math.min(index + chunkSize, text.length);
      const chunk = text.slice(index, end);
      index = end;

      const payload = JSON.stringify({ content: chunk });
      controller.enqueue(encoder.encode(`data: ${payload}\n\n`));

      // Natural delay with slight randomness — simulates typing rhythm
      const delay = delayMs + Math.random() * jitterMs;
      await new Promise<void>((r) => setTimeout(r, delay));
    },
  });
}

/** SSE Response headers — identical to what the real LLM routes return */
export const SSE_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};
