import { NextRequest, NextResponse } from 'next/server';
import { getAlarmCorrelations, getAlarmData } from '@/lib/alarm-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get('equipmentId');

    const correlations = getAlarmCorrelations(equipmentId ?? undefined);

    // Enrich each correlation with the actual alarm objects in the sequence
    const allAlarms = getAlarmData();
    const alarmMap = new Map(allAlarms.map((a) => [a.id, a]));

    const enrichedCorrelations = correlations.map((corr) => ({
      ...corr,
      alarms: corr.alarmSequence
        .map((id) => alarmMap.get(id))
        .filter(Boolean),
    }));

    return NextResponse.json({
      correlations: enrichedCorrelations,
      count: enrichedCorrelations.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
