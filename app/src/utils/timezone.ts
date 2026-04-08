import { RIVER_DELAY_HOURS } from './thresholds';

/**
 * Convert MST hour (1-24) to Pacific Time hour (0-23).
 * MST = UTC-7 year-round (Arizona has no DST).
 * PT = UTC-7 during PDT (Mar-Nov) or UTC-8 during PST (Nov-Mar).
 */
export function mstHourToPT(mstHour: number, date: Date): number {
  const offsetHours = isPDT(date) ? 0 : -1;
  let ptHour = (mstHour - 1) + offsetHours; // Convert 1-24 to 0-23, then apply offset
  if (ptHour < 0) ptHour += 24;
  if (ptHour > 23) ptHour -= 24;
  return ptHour;
}

/**
 * Get the flow at the river house for a given hour, accounting for the 1-hour downstream delay.
 * Flow at the house at hour H = flow at the dam at hour H - RIVER_DELAY_HOURS.
 */
export function getHouseFlowHour(damHourMST: number): number {
  const shifted = damHourMST - RIVER_DELAY_HOURS;
  return shifted < 1 ? shifted + 24 : shifted;
}

/**
 * Check if a given date falls within PDT (Pacific Daylight Time).
 * PDT: second Sunday of March to first Sunday of November.
 */
export function isPDT(date: Date): boolean {
  const year = date.getFullYear();

  // Second Sunday of March
  const march1 = new Date(year, 2, 1);
  const marchFirstSunday = (7 - march1.getDay()) % 7 + 1;
  const pdtStart = new Date(year, 2, marchFirstSunday + 7, 2, 0, 0); // 2 AM

  // First Sunday of November
  const nov1 = new Date(year, 10, 1);
  const novFirstSunday = (7 - nov1.getDay()) % 7 + 1;
  const pdtEnd = new Date(year, 10, novFirstSunday, 2, 0, 0); // 2 AM

  return date >= pdtStart && date < pdtEnd;
}

/**
 * Get the current hour in Pacific Time (0-23).
 */
export function getCurrentHourPT(): number {
  const now = new Date();
  const ptString = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false });
  return parseInt(ptString, 10);
}

/**
 * Get today's date as YYYY-MM-DD in Pacific Time.
 */
export function getTodayPT(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now);
  return parts; // en-CA gives YYYY-MM-DD
}

/**
 * Format an hour number (0-23) to a display string like "3 PM", "12 AM".
 */
export function formatHour(hour24: number): string {
  if (hour24 === 0) return '12 AM';
  if (hour24 === 12) return '12 PM';
  if (hour24 < 12) return `${hour24} AM`;
  return `${hour24 - 12} PM`;
}
