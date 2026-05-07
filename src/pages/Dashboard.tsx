import { useEffect, useState } from 'react';
import { Battery, Wind, AlertTriangle, X } from 'lucide-react';
import Compass from '@/components/Compass';
import VideoFeed from '@/components/VideoFeed';
import AlertBanner from '@/components/AlertBanner';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useSensorData } from '@/contexts/SensorDataContext';
import { GasReading, getWorstStatus, getDangerLevelColor } from '@/data/mockData';

const LEVEL_MODAL_INTERVAL_MS = 5 * 60 * 1000;

type BatteryStatus = 'Full' | 'Good' | 'Low' | 'Critical';
type AreaModalLevel = 'Safe' | 'Moderate' | 'High' | 'Dangerous' | 'Critical';

const getRandomBatteryValue = () => Math.floor(Math.random() * 101);

const clampBatteryValue = (value: number) => Math.min(Math.max(value, 0), 100);

const getBatteryStatus = (value: number): BatteryStatus => {
  if (value > 90) return 'Full';
  if (value > 60) return 'Good';
  if (value >= 30) return 'Low';
  return 'Critical';
};

const getBatteryClasses = (value: number) => {
  if (value > 60) {
    return {
      bar: 'bg-success',
      text: 'text-success',
      border: 'border-success/30',
      background: 'bg-success/10',
    };
  }

  if (value >= 30) {
    return {
      bar: 'bg-warning',
      text: 'text-warning',
      border: 'border-warning/30',
      background: 'bg-warning/10',
    };
  }

  return {
    bar: 'bg-destructive',
    text: 'text-destructive',
    border: 'border-destructive/30',
    background: 'bg-destructive/10',
  };
};

const getModalDangerLevel = (currentStatus: string, latestReading?: GasReading): AreaModalLevel => {
  if (latestReading && (latestReading.co2 > 1000 || latestReading.co > 10 || latestReading.lpg > 1000 || latestReading.h2s > 1.5)) {
    return 'Critical';
  }

  if (currentStatus === 'Low') return 'Moderate';
  if (currentStatus === 'Safe' || currentStatus === 'Moderate' || currentStatus === 'High' || currentStatus === 'Dangerous') {
    return currentStatus;
  }

  return 'Safe';
};

const getModalDangerLevelColor = (level: AreaModalLevel) => {
  if (level === 'Critical') return 'text-destructive';
  return getDangerLevelColor(level);
};

const formatGasValue = (value?: number) => (typeof value === 'number' ? value.toFixed(2) : 'N/A');

const BatteryIndicator = ({ title, value }: { title: string; value: number }) => {
  const status = getBatteryStatus(value);
  const classes = getBatteryClasses(value);

  return (
    <div className={`p-4 rounded-lg bg-card border ${classes.border} transition-all duration-300`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold font-mono ${classes.text}`}>{value}%</p>
        </div>
        <div className={`p-2 rounded-lg border ${classes.border} ${classes.background}`}>
          <Battery className={`w-5 h-5 ${classes.text}`} />
        </div>
      </div>

      <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${classes.bar}`}
          style={{ width: `${value}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Status</span>
        <span className={`font-bold ${classes.text}`}>{status}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { readings, robotStatus, isConnected } = useSensorData();
  const [robotBattery, setRobotBattery] = useState(getRandomBatteryValue);
  const [powerbankBattery, setPowerbankBattery] = useState(getRandomBatteryValue);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [levelModalTimestamp, setLevelModalTimestamp] = useState(() => new Date().toLocaleString());

  const currentStatus = readings.length > 0 ? getWorstStatus(readings) : 'Safe';
  const isHighDanger = currentStatus === 'High' || currentStatus === 'Dangerous';
  const latestReading = readings[0];
  const modalDangerLevel = getModalDangerLevel(currentStatus, latestReading);

  useEffect(() => {
    const interval = setInterval(() => {
      setRobotBattery((previousValue) => clampBatteryValue(previousValue + Math.floor(Math.random() * 7) - 3));
      setPowerbankBattery((previousValue) => clampBatteryValue(previousValue + Math.floor(Math.random() * 5) - 2));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const showLevelModal = () => {
      setLevelModalTimestamp(new Date().toLocaleString());
      setIsLevelModalOpen(true);
    };

    showLevelModal();
    const interval = setInterval(showLevelModal, LEVEL_MODAL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Use default values if no data yet
  const status = robotStatus || {
    direction: 0,
    gasLocation: 'Awaiting data...',
    distance: 0,
    levelArea: 'Safe' as const,
    mostDetectedGas: 'N/A',
    gasConcentration: 0,
    isEvacuationNeeded: false,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Area Level and Control</h1>
          <p className="text-muted-foreground">Real-time monitoring dashboard</p>
        </div>
        <ConnectionStatus />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Navigation & Status */}
        <div className="space-y-6">
          {/* Compass Card */}
          <div className="p-6 rounded-lg bg-card border border-border relative overflow-hidden">
            <div className={`absolute inset-0 transition-opacity duration-500 ${
              isConnected ? 'opacity-0' : 'opacity-50 bg-background'
            }`} />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
              Robot Orientation
            </h2>
            <Compass direction={status.direction} />
          </div>

          {/* Battery Status Grid */}
          <div className="grid grid-cols-2 gap-4">
            <BatteryIndicator title="Robot Battery" value={robotBattery} />
            <BatteryIndicator title="Powerbank" value={powerbankBattery} />
          </div>

          {/* Level Area Status */}
          <div className={`p-6 rounded-lg bg-card border transition-all duration-300 ${
            isHighDanger ? 'border-destructive/50 animate-pulse-glow' : 'border-border'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Level Area Status
                </h2>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-8 h-8 ${getDangerLevelColor(currentStatus)} ${
                    isHighDanger ? 'animate-pulse' : ''
                  }`} />
                  <span className={`text-3xl font-bold transition-all duration-300 ${getDangerLevelColor(currentStatus)}`}>
                    {currentStatus}
                  </span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                isHighDanger ? 'bg-destructive/20 border border-destructive/30' : 'bg-success/20 border border-success/30'
              }`}>
                <span className={`text-sm font-bold ${isHighDanger ? 'text-destructive' : 'text-success'}`}>
                  {isHighDanger ? 'CRITICAL' : 'NORMAL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Video & Gas Info */}
        <div className="space-y-6">
          {/* Video Feed */}
          <div className="p-6 rounded-lg bg-card border border-border">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Camera POV
            </h2>
            <VideoFeed isActive={isConnected} streamUrl={isConnected ? 'http://localhost:5001/video_feed' : undefined} />
          </div>

          {/* Gas Concentration */}
          <div className={`p-6 rounded-lg bg-card border transition-all duration-300 ${
            status.gasConcentration > 700 ? 'border-warning/50' : 'border-border'
          }`}>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Gas Concentration
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className={`w-5 h-5 ${status.gasConcentration > 700 ? 'text-warning animate-pulse' : 'text-warning'}`} />
                  <span className="text-muted-foreground">Gas Most Detected</span>
                </div>
                <span className="text-4xl font-bold text-warning font-mono">
                  {status.mostDetectedGas}
                </span>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm mb-1">Concentration</p>
                <p className="text-3xl font-bold font-mono text-primary transition-all duration-300">
                  {status.gasConcentration.toFixed(2)}
                  <span className="text-lg text-muted-foreground ml-1">ppm</span>
                </p>
              </div>
            </div>

            {/* Gas Level Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>0 ppm</span>
                <span>1000 ppm</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success via-warning to-destructive transition-all duration-500"
                  style={{ width: `${Math.min((status.gasConcentration / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLevelModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setIsLevelModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-card border border-border shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level Area Status</p>
                <h3 className={`text-2xl font-bold ${getModalDangerLevelColor(modalDangerLevel)}`}>
                  {modalDangerLevel}
                </h3>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close level area status popup"
                onClick={() => setIsLevelModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">CO2</p>
                  <p className="text-xl font-bold font-mono text-foreground">{formatGasValue(latestReading?.co2)} <span className="text-sm text-muted-foreground">ppm</span></p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">CO</p>
                  <p className="text-xl font-bold font-mono text-foreground">{formatGasValue(latestReading?.co)} <span className="text-sm text-muted-foreground">ppm</span></p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">LPG</p>
                  <p className="text-xl font-bold font-mono text-foreground">{formatGasValue(latestReading?.lpg)} <span className="text-sm text-muted-foreground">ppm</span></p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">H2S</p>
                  <p className="text-xl font-bold font-mono text-foreground">{formatGasValue(latestReading?.h2s)} <span className="text-sm text-muted-foreground">ppm</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 border border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Timestamp</span>
                <span className="text-sm font-mono text-foreground text-right">{levelModalTimestamp}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Banner */}
      <AlertBanner show={isHighDanger && isConnected} />
    </div>
  );
};

export default Dashboard;
