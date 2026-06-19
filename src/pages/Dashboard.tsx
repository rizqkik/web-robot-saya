import { Battery, Wind, AlertTriangle, Gamepad2 } from 'lucide-react';
import Compass from '@/components/Compass';
import VideoFeed from '@/components/VideoFeed';
import AlertBanner from '@/components/AlertBanner';
import ConnectionStatus from '@/components/ConnectionStatus';
import LevelAreaStatusModal from '@/components/LevelAreaStatusModal';
import { useSensorData } from '@/contexts/SensorDataContext';
import { DangerLevel, getDangerLevelColor } from '@/data/mockData';
import { getBackendConfig } from '@/lib/backendConfig';
import { formatGasPpm } from '@/lib/utils';

type BatteryStatus = 'Full' | 'Good' | 'Low' | 'Critical' | 'Unknown';

const getBatteryStatus = (value?: number | null): BatteryStatus => {
  if (typeof value !== 'number') return 'Unknown';
  if (value > 90) return 'Full';
  if (value > 60) return 'Good';
  if (value >= 30) return 'Low';
  return 'Critical';
};

const getBatteryClasses = (value?: number | null) => {
  if (typeof value !== 'number') {
    return {
      bar: 'bg-muted-foreground',
      text: 'text-muted-foreground',
      border: 'border-border',
      background: 'bg-muted/30',
    };
  }

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

const formatMotorValue = (value?: number) => (typeof value === 'number' ? value : 'N/A');

const BatteryIndicator = ({ title, value }: { title: string; value?: number | null }) => {
  const status = getBatteryStatus(value);
  const classes = getBatteryClasses(value);
  const displayValue = typeof value === 'number' ? `${value}%` : 'N/A';
  const barWidth = typeof value === 'number' ? value : 0;

  return (
    <div className={`p-4 rounded-lg bg-card border ${classes.border} transition-all duration-300`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold font-mono ${classes.text}`}>{displayValue}</p>
        </div>
        <div className={`p-2 rounded-lg border ${classes.border} ${classes.background}`}>
          <Battery className={`w-5 h-5 ${classes.text}`} />
        </div>
      </div>

      <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${classes.bar}`}
          style={{ width: `${barWidth}%` }}
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
  const { readings, robotStatus, isConnected, battery } = useSensorData();
  const { videoFeedUrl } = getBackendConfig();

  const currentStatus: DangerLevel = robotStatus?.levelArea ?? 'Safe';
  const isHighDanger = currentStatus === 'High' || currentStatus === 'Dangerous';
  const isUnknownStatus = currentStatus === 'Unknown';
  const latestReading = readings[0];

  const status = robotStatus || {
    direction: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    gasLocation: 'Awaiting data...',
    distance: 0,
    levelArea: 'Safe' as const,
    mostDetectedGas: 'N/A',
    gasConcentration: 0,
    isEvacuationNeeded: false,
    controlConnected: false,
    motorDrive: undefined,
    motorSteer: undefined,
    controlAgeMs: null,
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
          {/* Robot Attitude Card */}
          <div className="p-6 rounded-lg bg-card border border-border relative overflow-hidden">
            <div className={`absolute inset-0 transition-opacity duration-500 ${
              isConnected ? 'opacity-0' : 'opacity-50 bg-background'
            }`} />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
              Robot Orientation
            </h2>
            <Compass
              direction={status.direction}
              yaw={status.yaw}
              pitch={status.pitch}
              roll={status.roll}
            />
          </div>

          {/* Battery Status */}
          <div className="grid grid-cols-1 gap-4">
            <BatteryIndicator title="Robot Battery" value={battery} />
          </div>

          {/* Robot Control Status */}
          <div className={`p-5 rounded-lg bg-card border transition-all duration-300 ${
            status.controlConnected ? 'border-success/30' : 'border-warning/40'
          }`}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Robot Control
                </h2>
                <div className="flex items-center gap-2">
                  <Gamepad2 className={`w-5 h-5 ${status.controlConnected ? 'text-success' : 'text-warning'}`} />
                  <span className={`text-lg font-bold ${status.controlConnected ? 'text-success' : 'text-warning'}`}>
                    {status.controlConnected ? 'Linked' : 'Standby'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Command age</p>
                <p className="text-sm font-mono text-foreground">
                  {typeof status.controlAgeMs === 'number' && status.controlAgeMs >= 0 ? `${status.controlAgeMs} ms` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1">Drive Motor</p>
                <p className="text-xl font-bold font-mono text-foreground">{formatMotorValue(status.motorDrive)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1">Steering Motor</p>
                <p className="text-xl font-bold font-mono text-foreground">{formatMotorValue(status.motorSteer)}</p>
              </div>
            </div>
          </div>

          {/* Level Area Status */}
          <div className={`p-6 rounded-lg bg-card border transition-all duration-300 ${
            isHighDanger ? 'border-destructive/50 animate-pulse-glow' : isUnknownStatus ? 'border-warning/40' : 'border-border'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Level Area Status
                </h2>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-8 h-8 ${getDangerLevelColor(currentStatus)} ${
                    isHighDanger || isUnknownStatus ? 'animate-pulse' : ''
                  }`} />
                  <span className={`text-3xl font-bold transition-all duration-300 ${getDangerLevelColor(currentStatus)}`}>
                    {currentStatus}
                  </span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                isHighDanger
                  ? 'bg-destructive/20 border border-destructive/30'
                  : isUnknownStatus
                    ? 'bg-warning/20 border border-warning/30'
                    : 'bg-success/20 border border-success/30'
              }`}>
                <span className={`text-sm font-bold ${
                  isHighDanger ? 'text-destructive' : isUnknownStatus ? 'text-warning' : 'text-success'
                }`}>
                  {isHighDanger ? 'CRITICAL' : isUnknownStatus ? 'CHECK SYSTEM' : 'NORMAL'}
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
            <VideoFeed isActive={isConnected} streamUrl={isConnected ? videoFeedUrl : undefined} />
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
                  {formatGasPpm(status.gasConcentration)}
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

      <LevelAreaStatusModal level={currentStatus} reading={latestReading} />

      {/* Alert Banner */}
      <AlertBanner show={isHighDanger && isConnected} />
    </div>
  );
};

export default Dashboard;
