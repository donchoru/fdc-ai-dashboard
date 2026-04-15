import { NextRequest, NextResponse } from 'next/server';
import { getSpcData, getSpcScenarios } from '@/lib/spc-data';
import type { ProcessType } from '@/lib/types';

const VALID_PROCESSES: ProcessType[] = ['etch', 'cvd', 'litho', 'cmp', 'pvd', 'diffusion'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const process = searchParams.get('process') as ProcessType | null;
    const scenario = searchParams.get('scenario') ?? undefined;
    const includeScenarios = searchParams.get('includeScenarios') === 'true';

    // Validate process param if provided
    if (process && !VALID_PROCESSES.includes(process)) {
      return NextResponse.json(
        { error: `Invalid process. Must be one of: ${VALID_PROCESSES.join(', ')}` },
        { status: 400 },
      );
    }

    const spcItems = getSpcData(process ?? undefined, scenario);

    // Aggregate Cpk stats
    const cpkValues = spcItems
      .map((s) => s.cpk)
      .filter((v): v is number => v !== undefined);
    const avgCpk =
      cpkValues.length > 0
        ? +( cpkValues.reduce((a, b) => a + b, 0) / cpkValues.length).toFixed(3)
        : null;
    const minCpk =
      cpkValues.length > 0 ? +Math.min(...cpkValues).toFixed(3) : null;

    const statusSummary = spcItems.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const response: Record<string, unknown> = {
      items: spcItems,
      count: spcItems.length,
      cpkSummary: {
        avg: avgCpk,
        min: minCpk,
      },
      statusSummary: {
        IN_CONTROL: statusSummary['IN_CONTROL'] || 0,
        WARNING: statusSummary['WARNING'] || 0,
        OOC: statusSummary['OOC'] || 0,
      },
    };

    if (includeScenarios) {
      response.scenarios = getSpcScenarios();
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
