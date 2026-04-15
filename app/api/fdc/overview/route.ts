import { NextRequest, NextResponse } from 'next/server';
import { getFdcData, getEquipmentList } from '@/lib/fdc-data';
import { getAlarmData } from '@/lib/alarm-data';
import { getSpcData } from '@/lib/spc-data';
import type { EquipmentStatus, Severity } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') ?? undefined;

    const equipment = getEquipmentList();
    const fdcParams = getFdcData(undefined, scenario);
    const alarms = getAlarmData();
    const spcItems = getSpcData(undefined, scenario);

    // Equipment by status
    const equipmentByStatus = equipment.reduce(
      (acc, eq) => {
        acc[eq.status] = (acc[eq.status] || 0) + 1;
        return acc;
      },
      {} as Record<EquipmentStatus, number>,
    );

    // Ensure all statuses are present
    const equipmentByStatusFull: Record<EquipmentStatus, number> = {
      RUN: equipmentByStatus['RUN'] || 0,
      IDLE: equipmentByStatus['IDLE'] || 0,
      DOWN: equipmentByStatus['DOWN'] || 0,
      PM: equipmentByStatus['PM'] || 0,
      ENGINEERING: equipmentByStatus['ENGINEERING'] || 0,
    };

    // Active alarms count
    const activeAlarms = alarms.filter((a) => a.status === 'ACTIVE').length;

    // Alarms by severity (all, not just active)
    const alarmsBySeverity = alarms.reduce(
      (acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      },
      {} as Record<Severity, number>,
    );

    const alarmsBySeverityFull: Record<Severity, number> = {
      CRITICAL: alarmsBySeverity['CRITICAL'] || 0,
      WARNING: alarmsBySeverity['WARNING'] || 0,
      INFO: alarmsBySeverity['INFO'] || 0,
    };

    // OOS parameters count
    const oosParameters = fdcParams.filter((p) => p.status === 'OOS').length;

    // Average Cpk from SPC items that have a cpk value
    const cpkValues = spcItems
      .map((s) => s.cpk)
      .filter((v): v is number => v !== undefined);
    const avgCpk =
      cpkValues.length > 0
        ? +( cpkValues.reduce((s, v) => s + v, 0) / cpkValues.length).toFixed(3)
        : 0;

    // OEE approximation: running / total * 100
    const runCount = equipmentByStatusFull.RUN;
    const oee = equipment.length > 0
      ? +((runCount / equipment.length) * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      totalEquipment: equipment.length,
      activeAlarms,
      oosParameters,
      avgCpk,
      oee,
      equipmentByStatus: equipmentByStatusFull,
      alarmsBySeverity: alarmsBySeverityFull,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
