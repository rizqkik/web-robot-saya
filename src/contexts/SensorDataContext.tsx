import { createContext, useContext, ReactNode } from 'react';
import { useRealtimeSensorData } from '@/hooks/useRealtimeSensorData';
import { GasReading, RobotStatus } from '@/data/mockData';

interface SensorDataContextType {
  readings: GasReading[];
  robotStatus: RobotStatus | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
}

const SensorDataContext = createContext<SensorDataContextType | null>(null);

export const SensorDataProvider = ({ children }: { children: ReactNode }) => {
  const sensorData = useRealtimeSensorData({
    maxReadings: 20,
    reconnectInterval: 5000,
    enableSimulation: true, // Fallback to simulation if WebSocket fails
  });

  return (
    <SensorDataContext.Provider value={sensorData}>
      {children}
    </SensorDataContext.Provider>
  );
};

export const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
};
