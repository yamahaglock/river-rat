import { useState, useEffect, useCallback } from 'react';
import type { DailyFlowData } from '../types/flow';
import { getTodayPT } from '../utils/timezone';

/**
 * Fetches flow data from static JSON files in /data/.
 * In dev, Vite serves these from public/data/.
 * In production, these are static files deployed alongside the app.
 *
 * Run `npx tsx scripts/fetch-pdf.ts` to populate/update the data.
 */

/**
 * Find the closest available date to the target.
 * Prefers today, then the nearest past date, then the nearest future date.
 */
function findClosestDate(target: string, available: string[]): string {
  if (available.length === 0) return target;

  // Find nearest date by absolute distance, preferring past over future
  let closest = available[0];
  let closestDist = Infinity;

  for (const d of available) {
    const dist = Math.abs(new Date(d).getTime() - new Date(target).getTime());
    const isFuture = d > target;
    // Slight penalty for future dates so we prefer past/current
    const adjusted = isFuture ? dist + 1 : dist;
    if (adjusted < closestDist) {
      closestDist = adjusted;
      closest = d;
    }
  }

  return closest;
}

interface FlowIndex {
  available: string[];
  updatedAt: string;
}

async function fetchIndex(): Promise<FlowIndex> {
  const res = await fetch('/data/index.json');
  if (!res.ok) throw new Error('No flow data available. Run: npx tsx scripts/fetch-pdf.ts');
  return res.json();
}

async function fetchDayData(date: string): Promise<DailyFlowData | null> {
  const res = await fetch(`/data/${date}.json`);
  if (!res.ok) return null;
  return res.json();
}

export function useFlowData(initialDate?: string) {
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayPT());
  const [flowData, setFlowData] = useState<DailyFlowData | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const index = await fetchIndex();
      setAvailableDates(index.available);

      // If requested date isn't available, fall back to the closest available date
      const targetDate = index.available.includes(date)
        ? date
        : findClosestDate(date, index.available);

      if (targetDate !== date) {
        setSelectedDate(targetDate);
      }

      const data = await fetchDayData(targetDate);
      setFlowData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flow data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const goToDate = (date: string) => setSelectedDate(date);

  const goToPrevDay = () => {
    const idx = availableDates.indexOf(selectedDate);
    if (idx > 0) setSelectedDate(availableDates[idx - 1]);
  };

  const goToNextDay = () => {
    const idx = availableDates.indexOf(selectedDate);
    if (idx < availableDates.length - 1) setSelectedDate(availableDates[idx + 1]);
  };

  const goToToday = () => setSelectedDate(getTodayPT());

  const hasPrev = availableDates.indexOf(selectedDate) > 0;
  const hasNext = availableDates.indexOf(selectedDate) < availableDates.length - 1;
  const isToday = selectedDate === getTodayPT();

  return {
    flowData,
    selectedDate,
    availableDates,
    loading,
    error,
    goToDate,
    goToPrevDay,
    goToNextDay,
    goToToday,
    hasPrev,
    hasNext,
    isToday,
    refetch: () => fetchData(selectedDate),
  };
}
