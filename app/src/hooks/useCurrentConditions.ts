import { useMemo } from 'react';
import type { DailyFlowData, CurrentConditions, FlowStatus, RideStatus } from '../types/flow';
import { GOOD_FLOW_CFS, computeHourlyRideStatus } from '../utils/thresholds';
import { getCurrentHourPT, mstHourToPT, formatHour } from '../utils/timezone';

/**
 * Derives the current river conditions from today's flow data.
 * Accounts for the 1-hour downstream delay and trailing caution logic.
 */
export function useCurrentConditions(flowData: DailyFlowData | null): (CurrentConditions & { rideStatus: RideStatus }) | null {
  return useMemo(() => {
    if (!flowData) return null;

    const currentHourPT = getCurrentHourPT();
    const today = new Date();

    // Build a map of PT hour -> dam flow
    const ptFlowMap = new Map<number, number>();
    for (const h of flowData.hours) {
      const ptHour = mstHourToPT(h.hour, today);
      ptFlowMap.set(ptHour, h.parkerFlow);
    }

    // Get the full ride status map
    const rideMap = computeHourlyRideStatus(flowData);
    const currentRide = rideMap.get(currentHourPT);

    const flowAtDam = currentRide?.damFlow ?? 0;
    const flowAtHouse = currentRide?.houseFlow ?? 0;
    const rideStatus: RideStatus = currentRide?.rideStatus ?? 'no-go';

    // Determine the dashboard-level FlowStatus
    const houseAbove = flowAtHouse >= GOOD_FLOW_CFS;
    const damAbove = flowAtDam >= GOOD_FLOW_CFS;

    let nextChangeTime: string | null = null;
    let status: FlowStatus = 'low';

    if (houseAbove || rideStatus === 'good') {
      status = 'good';
      // Check if it's about to drop
      for (let i = 1; i <= 2; i++) {
        const futureHour = (currentHourPT + i) % 24;
        const futureFlow = ptFlowMap.get(futureHour) ?? 0;
        if (futureFlow < GOOD_FLOW_CFS) {
          status = 'falling';
          const dropHourAtHouse = (futureHour + 1) % 24;
          nextChangeTime = formatHour(dropHourAtHouse);
          break;
        }
      }
    } else if (rideStatus === 'caution' || rideStatus === 'extreme-caution') {
      // In a trailing caution period — flow was good recently
      status = 'falling';
      // Look ahead for when it might come back
      for (let i = 1; i <= 6; i++) {
        const futureHour = (currentHourPT + i) % 24;
        const futureFlow = ptFlowMap.get(futureHour) ?? 0;
        if (futureFlow >= GOOD_FLOW_CFS) {
          const riseHourAtHouse = (futureHour + 1) % 24;
          nextChangeTime = formatHour(riseHourAtHouse);
          break;
        }
      }
    } else {
      // Below threshold, no caution period
      if (damAbove) {
        status = 'rising';
        nextChangeTime = formatHour((currentHourPT + 1) % 24);
      } else {
        let foundRise = false;
        for (let i = 1; i <= 6; i++) {
          const futureHour = (currentHourPT + i) % 24;
          const futureFlow = ptFlowMap.get(futureHour) ?? 0;
          if (futureFlow >= GOOD_FLOW_CFS) {
            status = 'rising';
            const riseHourAtHouse = (futureHour + 1) % 24;
            nextChangeTime = formatHour(riseHourAtHouse);
            foundRise = true;
            break;
          }
        }
        if (!foundRise) {
          status = 'low';
        }
      }
    }

    return {
      status,
      rideStatus,
      flowAtDam,
      flowAtHouse,
      currentHourPT,
      message: '',
      nextChangeTime,
    };
  }, [flowData]);
}
