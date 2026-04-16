import { NextResponse } from 'next/server';
import { getAnomalyScenarios, getFdcData } from '@/lib/fdc-data';

export async function GET() {
  try {
    const scenarios = getAnomalyScenarios();

    // Determine currently "active" anomalies by checking if any FDC parameters
    // are OOS under each scenario
    const activeScenarios = scenarios
      .filter((scenario) => {
        const params = getFdcData(undefined, scenario.id);
        return params.some((p) => p.status === 'OOS' || p.status === 'WARNING');
      })
      .map((s) => s.id);

    return NextResponse.json({
      scenarios,
      active: activeScenarios,
      count: scenarios.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
