export type DangerLevel = 'Safe' | 'Low' | 'Moderate' | 'High' | 'Dangerous';

export interface GasReading {
  id: number;
  timestamp: string;
  co2: number;
  co: number;
  lpg: number;
  h2s: number;
  status: DangerLevel;
}

export interface RobotStatus {
  direction: number; // 0-360 degrees
  gasLocation: string;
  distance: number;
  levelArea: DangerLevel;
  mostDetectedGas: string;
  gasConcentration: number;
  isEvacuationNeeded: boolean;
}

export const mockGasReadings: GasReading[] = [
  { id: 1, timestamp: '12/9/2025, 10:52:03 AM', co2: 420, co: 5.2, lpg: 800, h2s: 0.5, status: 'High' },
  { id: 2, timestamp: '12/9/2025, 10:51:58 AM', co2: 380, co: 3.1, lpg: 650, h2s: 0.3, status: 'Moderate' },
  { id: 3, timestamp: '12/9/2025, 10:51:53 AM', co2: 350, co: 2.8, lpg: 450, h2s: 0.2, status: 'Low' },
  { id: 4, timestamp: '12/9/2025, 10:51:48 AM', co2: 410, co: 4.5, lpg: 720, h2s: 0.4, status: 'Moderate' },
  { id: 5, timestamp: '12/9/2025, 10:51:43 AM', co2: 520, co: 8.2, lpg: 950, h2s: 1.2, status: 'Dangerous' },
  { id: 6, timestamp: '12/9/2025, 10:51:38 AM', co2: 300, co: 1.5, lpg: 200, h2s: 0.1, status: 'Safe' },
  { id: 7, timestamp: '12/9/2025, 10:51:33 AM', co2: 480, co: 6.8, lpg: 850, h2s: 0.8, status: 'High' },
  { id: 8, timestamp: '12/9/2025, 10:51:28 AM', co2: 290, co: 1.2, lpg: 180, h2s: 0.05, status: 'Safe' },
  { id: 9, timestamp: '12/9/2025, 10:51:23 AM', co2: 360, co: 3.5, lpg: 520, h2s: 0.25, status: 'Low' },
  { id: 10, timestamp: '12/9/2025, 10:51:18 AM', co2: 440, co: 5.8, lpg: 780, h2s: 0.6, status: 'High' },
];

export const mockRobotStatus: RobotStatus = {
  direction: 45, // NE
  gasLocation: 'Sector B-4',
  distance: 12.5,
  levelArea: 'High',
  mostDetectedGas: 'LPG',
  gasConcentration: 800.00,
  isEvacuationNeeded: true,
};

export const getWorstStatus = (readings: GasReading[]): DangerLevel => {
  const priority: DangerLevel[] = ['Dangerous', 'High', 'Moderate', 'Low', 'Safe'];
  for (const level of priority) {
    if (readings.some(r => r.status === level)) {
      return level;
    }
  }
  return 'Safe';
};

export const getDangerLevelColor = (level: DangerLevel): string => {
  switch (level) {
    case 'Safe': return 'text-success';
    case 'Low': return 'text-success/80';
    case 'Moderate': return 'text-warning';
    case 'High': return 'text-destructive';
    case 'Dangerous': return 'text-destructive';
    default: return 'text-foreground';
  }
};

export const getStatusBgClass = (level: DangerLevel): string => {
  switch (level) {
    case 'Safe': return 'status-safe';
    case 'Low': return 'status-low';
    case 'Moderate': return 'status-moderate';
    case 'High': return 'status-high';
    case 'Dangerous': return 'status-dangerous';
    default: return '';
  }
};
