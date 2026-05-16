import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GasReading, RobotStatus, DangerLevel, getWorstStatus } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const SOCKET_IO_URL = 'http://192.168.137.243:5000';

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
  };
  battery: number;
  orientation: number;
  powerbank?: number;
}

const normalizeDangerLevel = (value?: string): DangerLevel => {
  if (!value) return 'Safe';
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
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
      return 'Safe';
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
    direction: latestData?.orientation ?? Math.floor(Math.random() * 360),
    gasLocation: 'Sector A-1',
    distance: 10.0,
    levelArea,
    mostDetectedGas,
    gasConcentration,
    isEvacuationNeeded: levelArea === 'High' || levelArea === 'Dangerous',
  };
};

interface UseRealtimeSensorDataOptions {
  maxReadings?: number;
}

export const useRealtimeSensorData = (options: UseRealtimeSensorDataOptions = {}) => {
  const { maxReadings = 20 } = options;

  const [readings, setReadings] = useState<GasReading[]>([]);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);
  const [battery, setBattery] = useState<number | null>(null);
  const [powerbankBattery, setPowerbankBattery] = useState<number | null>(null);
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
    };

    setReadings(prev => {
      const updated = [reading, ...prev].slice(0, maxReadings);
      setRobotStatus(generateRobotStatus(updated, data));
      return updated;
    });

    setBattery(data.battery);
    setPowerbankBattery(data.powerbank ?? data.battery);
    setLastUpdate(new Date());
  }, [maxReadings]);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionError(null);

    const socket = io(SOCKET_IO_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
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
  }, [isAutoUpdating, processData]);

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
    powerbankBattery,
    isConnected,
    lastUpdate,
    connectionError,
    isAutoUpdating,
    connect,
    disconnect,
    toggleRefresh,
  };
};
