import { NextRequest, NextResponse } from 'next/server';
import { getFdcData } from '@/lib/fdc-data';
import type { ProcessType } from '@/lib/types';

const VALID_PROCESSES: ProcessType[] = ['etch', 'cvd', 'litho', 'cmp', 'pvd', 'diffusion'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get('equipmentId');
    const process = searchParams.get('process') as ProcessType | null;
    const scenario = searchParams.get('scenario') ?? undefined;

    // Validate process param if provided
    if (process && !VALID_PROCESSES.includes(process)) {
      return NextResponse.json(
        { error: `Invalid process. Must be one of: ${VALID_PROCESSES.join(', ')}` },
        { status: 400 },
      );
    }

    let parameters = getFdcData(process ?? undefined, scenario);

    // Filter by equipmentId if provided
    if (equipmentId) {
      parameters = parameters.filter((p) => p.equipmentId === equipmentId);
    }

    const oosCcount = parameters.filter((p) => p.status === 'OOS').length;
    const warningCount = parameters.filter((p) => p.status === 'WARNING').length;

    return NextResponse.json({
      parameters,
      count: parameters.length,
      summary: {
        oos: oosCcount,
        warning: warningCount,
        normal: parameters.length - oosCcount - warningCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
