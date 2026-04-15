import { NextRequest, NextResponse } from 'next/server';
import { getEquipmentList, getEquipmentByProcess } from '@/lib/fdc-data';
import type { ProcessType } from '@/lib/types';

const VALID_PROCESSES: ProcessType[] = ['etch', 'cvd', 'litho', 'cmp', 'pvd', 'diffusion'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const line = searchParams.get('line');
    const process = searchParams.get('process') as ProcessType | null;
    // scenario param accepted for future use — equipment list is static for now
    // const scenario = searchParams.get('scenario') ?? undefined;

    // Validate process param if provided
    if (process && !VALID_PROCESSES.includes(process)) {
      return NextResponse.json(
        { error: `Invalid process. Must be one of: ${VALID_PROCESSES.join(', ')}` },
        { status: 400 },
      );
    }

    let equipment = process
      ? getEquipmentByProcess(process)
      : getEquipmentList();

    // Filter by line if provided
    if (line) {
      equipment = equipment.filter((eq) => eq.line === line);
    }

    return NextResponse.json({
      equipment,
      count: equipment.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
