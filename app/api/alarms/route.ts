import { NextRequest, NextResponse } from 'next/server';
import { getAlarmData, getAlarmSummary } from '@/lib/alarm-data';
import type { ProcessType, Severity, AlarmStatus } from '@/lib/types';

const VALID_SEVERITIES: Severity[] = ['CRITICAL', 'WARNING', 'INFO'];
const VALID_STATUSES: AlarmStatus[] = ['ACTIVE', 'ACKNOWLEDGED', 'CLEARED'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') as Severity | null;
    const equipmentId = searchParams.get('equipmentId');
    const process = searchParams.get('process') as ProcessType | null;
    const status = searchParams.get('status') as AlarmStatus | null;
    const limitParam = searchParams.get('limit');
    const includeSummary = searchParams.get('includeSummary') === 'true';
    const scenario = searchParams.get('scenario') ?? undefined;

    // Validate severity
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate limit
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be a positive integer.' },
        { status: 400 },
      );
    }

    let alarms = getAlarmData({
      severity: severity ?? undefined,
      equipmentId: equipmentId ?? undefined,
      process: process ?? undefined,
      status: status ?? undefined,
      scenario,
    });

    // Sort by timestamp descending (most recent first)
    alarms = alarms.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply limit
    if (limit !== undefined) {
      alarms = alarms.slice(0, limit);
    }

    const response: Record<string, unknown> = {
      alarms,
      count: alarms.length,
    };

    if (includeSummary) {
      response.summary = getAlarmSummary();
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
