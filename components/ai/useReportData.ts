'use client';

import { useState, useCallback } from 'react';
import type { KpiData, SpcItem, Alarm } from '@/lib/types';

export interface ReportData {
  kpi: KpiData | null;
  spcItems: SpcItem[];
  alarms: Alarm[];
  loading: boolean;
  error: string | null;
}

export function useReportData() {
  const [data, setData] = useState<ReportData>({
    kpi: null,
    spcItems: [],
    alarms: [],
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [overviewRes, spcRes, alarmsRes] = await Promise.all([
        fetch('/api/fdc/overview'),
        fetch('/api/spc'),
        fetch('/api/alarms?includeSummary=true&limit=10'),
      ]);

      if (!overviewRes.ok || !spcRes.ok || !alarmsRes.ok) {
        throw new Error('데이터 로드 실패');
      }

      const [overviewJson, spcJson, alarmsJson] = await Promise.all([
        overviewRes.json(),
        spcRes.json(),
        alarmsRes.json(),
      ]);

      setData({
        kpi: overviewJson as KpiData,
        spcItems: (spcJson.items ?? []) as SpcItem[],
        alarms: (alarmsJson.alarms ?? []) as Alarm[],
        loading: false,
        error: null,
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '데이터 로드 실패',
      }));
    }
  }, []);

  return { ...data, fetchData };
}
