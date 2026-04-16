import { NextRequest, NextResponse } from 'next/server';
import { getLlmConfig, setLlmConfig } from '@/lib/llm-client';
import type { LlmConfig } from '@/lib/types';

function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export async function GET() {
  try {
    const config = getLlmConfig();
    return NextResponse.json({
      baseUrl: config.baseUrl,
      apiKey: maskApiKey(config.apiKey),
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      configured: Boolean(config.apiKey),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseUrl, apiKey, model, maxTokens, temperature } = body as Partial<LlmConfig>;

    // Validate temperature if provided
    if (temperature !== undefined) {
      if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
        return NextResponse.json(
          { error: 'temperature must be a number between 0 and 2' },
          { status: 400 },
        );
      }
    }

    // Validate maxTokens if provided
    if (maxTokens !== undefined) {
      if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 65536) {
        return NextResponse.json(
          { error: 'maxTokens must be a number between 1 and 65536' },
          { status: 400 },
        );
      }
    }

    const updates: Partial<LlmConfig> = {};
    if (baseUrl !== undefined) updates.baseUrl = baseUrl;
    if (apiKey !== undefined) updates.apiKey = apiKey;
    if (model !== undefined) updates.model = model;
    if (maxTokens !== undefined) updates.maxTokens = maxTokens;
    if (temperature !== undefined) updates.temperature = temperature;

    setLlmConfig(updates);

    const updated = getLlmConfig();
    return NextResponse.json({
      message: 'LLM configuration updated',
      config: {
        baseUrl: updated.baseUrl,
        apiKey: maskApiKey(updated.apiKey),
        model: updated.model,
        maxTokens: updated.maxTokens,
        temperature: updated.temperature,
        configured: Boolean(updated.apiKey),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
