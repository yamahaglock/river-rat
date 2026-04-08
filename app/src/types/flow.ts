export interface HourlyFlow {
  hour: number;        // 1-24 MST as in PDF
  parkerFlow: number;  // CFS
  critFlow: number;
  gateFlow: number;
  generatorFlow: number;
  mwh: number;
}

export interface DailyFlowData {
  date: string;          // YYYY-MM-DD
  dayOfWeek: string;
  fetchedAt: string;     // ISO timestamp
  source: string;
  hours: HourlyFlow[];
  dailyAverage: number;
  isForecast?: boolean;  // true if this is tomorrow's data (not yet occurred)
}

export type FlowStatus = 'good' | 'rising' | 'falling' | 'low';

/** Per-hour ride safety level at the river house */
export type RideStatus = 'good' | 'caution' | 'extreme-caution' | 'no-go';

export interface CurrentConditions {
  status: FlowStatus;
  flowAtDam: number;
  flowAtHouse: number;
  currentHourPT: number;
  message: string;
  nextChangeTime: string | null;  // e.g., "3:00 PM" when flow will cross threshold
}

export interface FlowApiResponse {
  data: DailyFlowData | null;
  available: string[];  // list of available date strings
}
