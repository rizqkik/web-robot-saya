import { useState, useEffect, useCallback, useRef } from 'react';
import { GasReading, RobotStatus, DangerLevel, getWorstStatus } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

// ============================================
// CONFIGURE YOUR WEBSOCKET URL HERE
// ============================================
const WEBSOCKET_URL = 'ws://localhost:8080/sensor-stream';
// Example URLs:
// - Local: 'ws://localhost:8080/sensor-stream'
// - Production: 'wss://your-robot-server.com/sensor-stream'
// ============================================

interface IncomingSensorData {
  id?: number;
  timestamp?: string;
  co2: number;
  co: number;
  lpg: number;
  h2s: number;
  status?: DangerLevel;
  direction?: number; // From MPU6050 gyro sensor
  distance?: number; // From AS5600 encoders
  gasLocation?: string; // Current location/sector
}

const calculateStatus = (data: IncomingSensorData): DangerLevel => {
  // If status is provided by the robot, use it
  if (data.status) return data.status;
  
  // Otherwise calculate based on gas levels
  if (data.lpg > 900 || data.co > 8 || data.h2s > 1) return 'Dangerous';
  if (data.lpg > 700 || data.co > 6 || data.h2s > 0.7) return 'High';
  if (data.lpg > 500 || data.co > 4 || data.h2s > 0.4) return 'Moderate';
  if (data.lpg > 300 || data.co > 2 || data.h2s > 0.2) return 'Low';
  return 'Safe';
};

const generateRobotStatus = (readings: GasReading[], latestData?: IncomingSensorData): RobotStatus => {
  const latestReading = readings[0];
  const worstStatus = getWorstStatus(readings);
  
  let mostDetectedGas = 'LPG';
  let maxConcentration = latestReading?.lpg || 0;
  
  if (latestReading) {
    if (latestReading.co2 > maxConcentration) {
      mostDetectedGas = 'CO2';
      maxConcentration = latestReading.co2;
    }
    if (latestReading.co * 100 > maxConcentration) {
      mostDetectedGas = 'CO';
      maxConcentration = latestReading.co * 100;
    }
    if (latestReading.h2s * 1000 > maxConcentration) {
      mostDetectedGas = 'H2S';
      maxConcentration = latestReading.h2s * 1000;
    }
  }

  return {
    direction: latestData?.direction ?? Math.floor(Math.random() * 360), // From MPU6050
    gasLocation: latestData?.gasLocation ?? 'Sector A-1', // Current location
    distance: latestData?.distance ?? 10.0, // From AS5600 encoders
    levelArea: worstStatus,
    mostDetectedGas,
    gasConcentration: latestReading?.lpg || 0,
    isEvacuationNeeded: worstStatus === 'High' || worstStatus === 'Dangerous',
  };
};

interface UseRealtimeSensorDataOptions {
  maxReadings?: number;
  reconnectInterval?: number;
  enableSimulation?: boolean; // Fallback to simulation if WebSocket fails
}

export const useRealtimeSensorData = (options: UseRealtimeSensorDataOptions = {}) => {
  const { maxReadings = 20, reconnectInterval = 5000, enableSimulation = true } = options;
  
  const [readings, setReadings] = useState<GasReading[]>([]);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const readingIdRef = useRef(1);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Process incoming sensor data
  const processData = useCallback((data: IncomingSensorData) => {
    const reading: GasReading = {
      id: data.id || readingIdRef.current++,
      timestamp: data.timestamp || new Date().toLocaleString(),
      co2: data.co2,
      co: data.co,
      lpg: data.lpg,
      h2s: data.h2s,
      status: calculateStatus(data),
    };
    
    setReadings(prev => {
      const updated = [reading, ...prev].slice(0, maxReadings);
      setRobotStatus(generateRobotStatus(updated, data));
      return updated;
    });
    
    setLastUpdate(new Date());
    console.log('[WebSocket] Sensor data received:', reading);
  }, [maxReadings]);

  // Simulation fallback
  const startSimulation = useCallback(() => {
    if (!enableSimulation) return;
    
    console.log('[Simulation] Starting fallback simulation...');
    toast({
      title: "Simulation Mode",
      description: "Using simulated data. Real WebSocket connection failed.",
      variant: "destructive",
    });
    
    simulationIntervalRef.current = setInterval(() => {
      const simulatedData: IncomingSensorData = {
        co2: Math.floor(250 + Math.random() * 350),
        co: parseFloat((0.5 + Math.random() * 9).toFixed(1)),
        lpg: Math.floor(100 + Math.random() * 900),
        h2s: parseFloat((0.01 + Math.random() * 1.5).toFixed(2)),
      };
      processData(simulatedData);
    }, 3000);
  }, [enableSimulation, processData]);

  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  // WebSocket connection
  const connect = useCallback(() => {
    // Clear any existing connections
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopSimulation();
    setConnectionError(null);
    
    console.log('[WebSocket] Connecting to:', WEBSOCKET_URL);
    
    try {
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        
        toast({
          title: "Connected",
          description: "Real-time sensor stream active",
        });
        
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data: IncomingSensorData = JSON.parse(event.data);
          processData(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionError('Connection error');
      };
      
      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt reconnection
        if (!reconnectTimeoutRef.current) {
          console.log(`[WebSocket] Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, reconnectInterval);
        }
        
        // Start simulation as fallback after first failed attempt
        if (enableSimulation && readings.length === 0) {
          startSimulation();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setConnectionError('Failed to connect');
      setIsConnected(false);
      
      // Fallback to simulation
      if (enableSimulation) {
        startSimulation();
      }
    }
  }, [processData, reconnectInterval, enableSimulation, startSimulation, stopSimulation, readings.length]);

  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Stop simulation
    stopSimulation();
    
    setIsConnected(false);
    console.log('[WebSocket] Disconnected manually');
  }, [stopSimulation]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    readings,
    robotStatus,
    isConnected,
    lastUpdate,
    connectionError,
    connect,
    disconnect,
  };
};
