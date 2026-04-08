import type { FlowStatus, RideStatus } from '../types/flow';

const goodMessages = [
  "River's pumping! Send it!",
  "Good to ride — get out there!",
  "Water's up! Time for jet skis!",
  "Perfect flow — grab the tubes!",
];

const risingMessages = [
  "Water's coming... grab your gear!",
  "Flow is rising — almost go time!",
  "Getting there — start gearing up!",
];

const fallingMessages = [
  "Flow dropping soon — last call!",
  "Ride while you can — water's falling!",
  "Heads up — flow is winding down",
];

const cautionMessages = [
  "Rideable with caution — flow just dropped",
  "Still good but watch the shallows",
  "Slight caution — water is dropping",
];

const extremeCautionMessages = [
  "Extreme caution — flow is getting low",
  "Barely rideable — watch for shallow spots",
  "Last chance to ride — water fading fast",
];

const lowMessages = [
  "Desert mode — better grab the golf cart",
  "Low water — snack time!",
  "River's resting — hit the 4-wheelers",
  "Too shallow — time for shore snacks",
];

function randomPick(arr: string[]): string {
  const hourSeed = new Date().getHours();
  return arr[hourSeed % arr.length];
}

export function getStatusMessage(status: FlowStatus): string {
  switch (status) {
    case 'good': return randomPick(goodMessages);
    case 'rising': return randomPick(risingMessages);
    case 'falling': return randomPick(fallingMessages);
    case 'low': return randomPick(lowMessages);
  }
}

export function getStatusEmoji(status: FlowStatus): string {
  switch (status) {
    case 'good': return '🚀';
    case 'rising': return '📈';
    case 'falling': return '📉';
    case 'low': return '🏜️';
  }
}

export function getRideStatusLabel(status: RideStatus): string {
  switch (status) {
    case 'good': return 'Good to ride';
    case 'caution': return 'Slight Caution';
    case 'extreme-caution': return 'Extreme Caution';
    case 'no-go': return 'No go';
  }
}

export function getRideStatusMessage(status: RideStatus): string {
  switch (status) {
    case 'good': return randomPick(goodMessages);
    case 'caution': return randomPick(cautionMessages);
    case 'extreme-caution': return randomPick(extremeCautionMessages);
    case 'no-go': return randomPick(lowMessages);
  }
}

export function getRideStatusEmoji(status: RideStatus): string {
  switch (status) {
    case 'good': return '🟢';
    case 'caution': return '🟡';
    case 'extreme-caution': return '🟠';
    case 'no-go': return '🔴';
  }
}
