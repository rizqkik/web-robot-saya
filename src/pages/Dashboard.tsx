import { MapPin, Gauge, Wind, AlertTriangle } from 'lucide-react';
import Compass from '@/components/Compass';
import VideoFeed from '@/components/VideoFeed';
import AlertBanner from '@/components/AlertBanner';
import StatCard from '@/components/StatCard';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useSensorData } from '@/contexts/SensorDataContext';
import { getWorstStatus, getDangerLevelColor } from '@/data/mockData';

const Dashboard = () => {
  const { readings, robotStatus, isConnected } = useSensorData();
  
  const currentStatus = readings.length > 0 ? getWorstStatus(readings) : 'Safe';
  const isHighDanger = currentStatus === 'High' || currentStatus === 'Dangerous';

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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Gas Location"
              value={status.gasLocation}
              icon={MapPin}
              variant="default"
            />
            <StatCard
              title="Distance"
              value={status.distance}
              unit="m from control"
              icon={Gauge}
              variant="default"
            />
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
            <VideoFeed isActive={isConnected} streamUrl={isConnected ? 'http://localhost:5000/video_feed' : undefined} />
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

      {/* Alert Banner */}
      <AlertBanner show={isHighDanger && isConnected} />
    </div>
  );
};

export default Dashboard;
