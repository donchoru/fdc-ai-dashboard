import OpenAI from 'openai';
import type { LlmConfig } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Default configuration — Gemini via OpenAI-compatible endpoint
// Override at runtime via setLlmConfig() or environment variables
// ─────────────────────────────────────────────────────────────────────────────

let config: LlmConfig = {
  baseUrl: process.env.LLM_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai',
  apiKey: process.env.GEMINI_API_KEY ?? '',
  model: process.env.LLM_MODEL ?? 'gemini-2.0-flash',
  maxTokens: 4096,
  temperature: 0.3,
};

export function getLlmConfig(): LlmConfig {
  return { ...config };
}

export function setLlmConfig(newConfig: Partial<LlmConfig>): void {
  config = { ...config, ...newConfig };
}

export function createLlmClient(): OpenAI {
  if (!config.apiKey) {
    console.warn(
      '[llm-client] No API key set. Set GEMINI_API_KEY environment variable or call setLlmConfig({ apiKey }).',
    );
  }
  return new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed chat completion helper — wraps OpenAI SDK with config
// ─────────────────────────────────────────────────────────────────────────────

export interface CompletionOptions {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: false;
}

export async function chatCompletion(options: CompletionOptions): Promise<string> {
  const client = createLlmClient();
  const response = await client.chat.completions.create({
    model: options.model ?? config.model,
    messages: options.messages,
    max_tokens: options.maxTokens ?? config.maxTokens,
    temperature: options.temperature ?? config.temperature,
    stream: false,
  });
  return response.choices[0]?.message?.content ?? '';
}

export async function* chatCompletionStream(
  options: Omit<CompletionOptions, 'stream'>,
): AsyncGenerator<string> {
  const client = createLlmClient();
  const stream = await client.chat.completions.create({
    model: options.model ?? config.model,
    messages: options.messages,
    max_tokens: options.maxTokens ?? config.maxTokens,
    temperature: options.temperature ?? config.temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
