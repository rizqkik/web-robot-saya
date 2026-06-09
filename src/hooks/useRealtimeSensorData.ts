import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GasReading, RobotStatus, DangerLevel, getWorstStatus } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { getBackendConfig } from '@/lib/backendConfig';

interface IncomingSensorData {
  timestamp: string;
  sensor: {
    CO2: number;
    CO: number;
    LPG: number;
    H2S: number;
  };
  prediction: {
    area_level: string;
    details?: Record<string, string>;
  };
  battery?: {
    robot: number;
  } | number;
  battery_robot?: number;
  orientation?: number | string | {
    yaw?: number | string;
    pitch?: number | string;
    roll?: number | string;
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  imu?: {
    yaw?: number | string;
    pitch?: number | string;
    roll?: number | string;
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  mpu?: {
    yaw?: number | string;
    pitch?: number | string;
    roll?: number | string;
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  yaw?: number | string;
  pitch?: number | string;
  roll?: number | string;
  yaw_deg?: number | string;
  pitch_deg?: number | string;
  roll_deg?: number | string;
  co2_valid?: boolean;
  control_connected?: boolean;
  control_age_ms?: number;
  motor_left?: number;
  motor_right?: number;
  motor_drive?: number;
  motor_steer?: number;
}

const toFiniteNumber = (value?: number | string | null): number | null => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeHeading = (value?: number | string | null): number => {
  const numericValue = toFiniteNumber(value);
  if (numericValue === null) return 0;
  return Math.round(((numericValue % 360) + 360) % 360);
};

const normalizeTilt = (value?: number | string | null): number => {
  const numericValue = toFiniteNumber(value);
  if (numericValue === null) return 0;
  return Math.round(Math.min(90, Math.max(-90, numericValue)));
};

const getNestedOrientationValue = (
  source: IncomingSensorData['orientation'] | IncomingSensorData['imu'] | IncomingSensorData['mpu'],
  preferredKey: 'yaw' | 'pitch' | 'roll',
  fallbackKey: 'x' | 'y' | 'z',
) => {
  if (!source || typeof source !== 'object') return null;
  return source[preferredKey] ?? source[fallbackKey] ?? null;
};

const extractOrientation = (data?: IncomingSensorData) => {
  const orientation = data?.orientation;
  const orientationObject = typeof orientation === 'object' ? orientation : undefined;

  const yaw =
    data?.yaw ??
    data?.yaw_deg ??
    getNestedOrientationValue(orientationObject, 'yaw', 'z') ??
    getNestedOrientationValue(data?.imu, 'yaw', 'z') ??
    getNestedOrientationValue(data?.mpu, 'yaw', 'z') ??
    (typeof orientation === 'number' || typeof orientation === 'string' ? orientation : null);

  const pitch =
    data?.pitch ??
    data?.pitch_deg ??
    getNestedOrientationValue(orientationObject, 'pitch', 'x') ??
    getNestedOrientationValue(data?.imu, 'pitch', 'x') ??
    getNestedOrientationValue(data?.mpu, 'pitch', 'x');

  const roll =
    data?.roll ??
    data?.roll_deg ??
    getNestedOrientationValue(orientationObject, 'roll', 'y') ??
    getNestedOrientationValue(data?.imu, 'roll', 'y') ??
    getNestedOrientationValue(data?.mpu, 'roll', 'y');

  return {
    yaw: normalizeHeading(yaw),
    pitch: normalizeTilt(pitch),
    roll: normalizeTilt(roll),
  };
};

const normalizeDangerLevel = (value?: string): DangerLevel => {
  if (!value) return 'Unknown';
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'unknown':
    case 'invalid':
    case 'error':
      return 'Unknown';
    case 'safe':
      return 'Safe';
    case 'low':
      return 'Low';
    case 'moderate':
      return 'Moderate';
    case 'high':
      return 'High';
    case 'dangerous':
      return 'Dangerous';
    default:
      return 'Unknown';
  }
};

const calculateStatus = (data: IncomingSensorData): DangerLevel => {
  if (data.prediction) {
    return normalizeDangerLevel(data.prediction.area_level);
  }

  if (data.sensor.LPG > 900 || data.sensor.CO > 8 || data.sensor.H2S > 1) return 'Dangerous';
  if (data.sensor.LPG > 700 || data.sensor.CO > 6 || data.sensor.H2S > 0.7) return 'High';
  if (data.sensor.LPG > 500 || data.sensor.CO > 4 || data.sensor.H2S > 0.4) return 'Moderate';
  if (data.sensor.LPG > 300 || data.sensor.CO > 2 || data.sensor.H2S > 0.2) return 'Low';
  return 'Safe';
};

const generateRobotStatus = (readings: GasReading[], latestData?: IncomingSensorData): RobotStatus => {
  const latestReading = readings[0];
  const worstStatus = getWorstStatus(readings);
  const levelArea = latestData ? normalizeDangerLevel(latestData.prediction?.area_level) : worstStatus;
  const orientation = extractOrientation(latestData);

  let mostDetectedGas = 'LPG';
  let gasConcentration = latestReading?.lpg ?? 0;

  if (latestReading) {
    const gasValues = [
      { label: 'CO2', value: latestReading.co2 },
      { label: 'CO', value: latestReading.co * 100 },
      { label: 'LPG', value: latestReading.lpg },
      { label: 'H2S', value: latestReading.h2s * 1000 },
    ];

    const highest = gasValues.reduce((prev, current) => (current.value > prev.value ? current : prev), gasValues[0]);
    mostDetectedGas = highest.label;
    gasConcentration = latestReading[highest.label.toLowerCase() as keyof GasReading] as number || latestReading.lpg;
  }

  return {
    direction: orientation.yaw,
    yaw: orientation.yaw,
    pitch: orientation.pitch,
    roll: orientation.roll,
    gasLocation: 'Sector A-1',
    distance: 10.0,
    levelArea,
    mostDetectedGas,
    gasConcentration,
    isEvacuationNeeded: levelArea === 'High' || levelArea === 'Dangerous',
    controlConnected: latestData?.control_connected,
    motorDrive: latestData?.motor_drive ?? latestData?.motor_left,
    motorSteer: latestData?.motor_steer ?? latestData?.motor_right,
    controlAgeMs: latestData?.control_age_ms ?? null,
  };
};

interface UseRealtimeSensorDataOptions {
  maxReadings?: number;
  reconnectInterval?: number;
}

export const useRealtimeSensorData = (options: UseRealtimeSensorDataOptions = {}) => {
  const { maxReadings = 20, reconnectInterval = 2000 } = options;

  const [readings, setReadings] = useState<GasReading[]>([]);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);
  const [battery, setBattery] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isAutoUpdating, setIsAutoUpdating] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const readingIdRef = useRef(1);

  const processData = useCallback((data: IncomingSensorData) => {
    const reading: GasReading = {
      id: readingIdRef.current++,
      timestamp: data.timestamp || new Date().toLocaleString(),
      co2: data.sensor.CO2,
      co: data.sensor.CO,
      lpg: data.sensor.LPG,
      h2s: data.sensor.H2S,
      status: normalizeDangerLevel(data.prediction?.area_level),
      co2Valid: data.co2_valid,
      predictionDetails: data.prediction?.details,
    };

    setReadings(prev => {
      const updated = [reading, ...prev].slice(0, maxReadings);
      setRobotStatus(generateRobotStatus(updated, data));
      return updated;
    });

    const batteryRobot = typeof data.battery === 'number'
      ? data.battery
      : data.battery?.robot ?? data.battery_robot;

    setBattery(typeof batteryRobot === 'number' ? batteryRobot : null);
    setLastUpdate(new Date());
  }, [maxReadings]);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionError(null);
    const { socketUrl } = getBackendConfig();

    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: reconnectInterval,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);

      toast({
        title: 'Connected',
        description: 'Real-time sensor stream active',
      });
    });

    socket.on('sensor_data', (data: IncomingSensorData) => {
      if (isAutoUpdating) {
        processData(data);
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason !== 'io client disconnect') {
        setConnectionError('Disconnected from server');
      }
    });

    socket.on('connect_error', (error) => {
      setConnectionError('Connection error');
      console.error('[Socket.IO] connect_error', error);
    });

    socket.on('error', (error) => {
      console.error('[Socket.IO] error', error);
    });
  }, [isAutoUpdating, processData, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setConnectionError('Disconnected');
  }, []);

  const toggleRefresh = useCallback(() => {
    setIsAutoUpdating(prev => {
      const next = !prev;
      if (next) {
        connect();
      } else {
        disconnect();
      }
      return next;
    });
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    readings,
    robotStatus,
    battery,
    isConnected,
    lastUpdate,
    connectionError,
    isAutoUpdating,
    connect,
    disconnect,
    toggleRefresh,
  };
};
