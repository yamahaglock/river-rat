import type { DailyFlowData, RideStatus } from '../types/flow';
import { mstHourToPT } from './timezone';

export const GOOD_FLOW_CFS = 8_000;
export const RIVER_DELAY_HOURS = 1;

// Parker, AZ area coordinates for weather API
export const PARKER_LAT = 34.15;
export const PARKER_LON = -114.29;

/**
 * Compute the ride status for each PT hour (0-23) at the river house.
 *
 * Logic:
 * - House flow at hour H = dam flow at hour H-1 (1-hour downstream delay)
 * - "good": house flow >= 8,000 CFS
 * - "caution": house flow < 8,000 CFS but the PREVIOUS hour was "good"
 *   (flow just dropped — residual water still makes it rideable with slight caution)
 * - "extreme-caution": house flow < 8,000 CFS, previous hour was "caution"
 *   (second hour after drop — still rideable but be very careful)
 * - "no-go": everything else below threshold
 *
 * Based on real-world observation (2026-04-08): dam flow dropped at ~10 AM MST,
 * but jet skis were still usable 10-11 AM (caution) and 11-12 PM (extreme caution)
 * at the river house due to residual flow and travel delay.
 */
export function computeHourlyRideStatus(flowData: DailyFlowData): Map<number, { rideStatus: RideStatus; houseFlow: number; damFlow: number }> {
  const today = new Date();

  // Build dam flow by PT hour
  const damFlowByPT = new Map<number, number>();
  for (const h of flowData.hours) {
    const ptHour = mstHourToPT(h.hour, today);
    damFlowByPT.set(ptHour, h.parkerFlow);
  }

  // Build house flow by PT hour (1-hour delay from dam)
  const houseFlowByPT = new Map<number, number>();
  for (let pt = 0; pt < 24; pt++) {
    const sourcePT = pt === 0 ? 23 : pt - 1;
    houseFlowByPT.set(pt, damFlowByPT.get(sourcePT) ?? 0);
  }

  // First pass: mark good vs below-threshold
  const rawStatus = new Map<number, boolean>(); // true = good
  for (let pt = 0; pt < 24; pt++) {
    rawStatus.set(pt, (houseFlowByPT.get(pt) ?? 0) >= GOOD_FLOW_CFS);
  }

  // Second pass: apply trailing caution logic
  const result = new Map<number, { rideStatus: RideStatus; houseFlow: number; damFlow: number }>();

  for (let pt = 0; pt < 24; pt++) {
    const houseFlow = houseFlowByPT.get(pt) ?? 0;
    const damFlow = damFlowByPT.get(pt) ?? 0;

    if (rawStatus.get(pt)) {
      result.set(pt, { rideStatus: 'good', houseFlow, damFlow });
    } else {
      // Check trailing hours: was previous hour good? Was 2 hours ago good?
      const prevPT = pt === 0 ? 23 : pt - 1;
      const prevPrevPT = prevPT === 0 ? 23 : prevPT - 1;

      const prevWasGood = rawStatus.get(prevPT) ?? false;
      const prevPrevWasGood = rawStatus.get(prevPrevPT) ?? false;

      if (prevWasGood) {
        result.set(pt, { rideStatus: 'caution', houseFlow, damFlow });
      } else if (prevPrevWasGood) {
        result.set(pt, { rideStatus: 'extreme-caution', houseFlow, damFlow });
      } else {
        result.set(pt, { rideStatus: 'no-go', houseFlow, damFlow });
      }
    }
  }

  return result;
}
