/**
 * Format CFS number with commas: 14021 -> "14,021"
 */
export function formatCFS(cfs: number): string {
  return cfs.toLocaleString('en-US');
}

/**
 * Format a date string (YYYY-MM-DD) to a friendly display: "Monday, April 7, 2026"
 */
export function formatDateFull(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date string to short form: "Mon, Apr 7"
 */
export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format temperature with degree symbol: 105 -> "105°F"
 */
export function formatTemp(temp: number): string {
  return `${Math.round(temp)}°F`;
}
