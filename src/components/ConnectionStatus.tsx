import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useSensorData } from '@/contexts/SensorDataContext';

const ConnectionStatus = () => {
  const { isConnected, lastUpdate, connectionError, connect, disconnect } = useSensorData();

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Connection indicator */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
        isConnected 
          ? 'bg-success/10 border-success/30 text-success' 
          : connectionError
            ? 'bg-destructive/10 border-destructive/30 text-destructive'
            : 'bg-warning/10 border-warning/30 text-warning'
      }`}>
        {isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : connectionError ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">
          {isConnected ? 'CONNECTED' : connectionError ? 'ERROR' : 'SIMULATION'}
        </span>
      </div>

      {/* Error message */}
      {connectionError && (
        <span className="text-xs text-destructive">
          {connectionError} - using simulated data
        </span>
      )}

      {/* Last update */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
        <RefreshCw className={`w-4 h-4 text-primary ${isConnected ? 'animate-spin' : ''}`} 
          style={{ animationDuration: '3s' }} 
        />
        <span className="text-xs text-muted-foreground font-mono">
          Last: {formatTime(lastUpdate)}
        </span>
      </div>

      {/* Connect/Disconnect button */}
      <button
        onClick={isConnected ? disconnect : connect}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isConnected
            ? 'bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30'
            : 'bg-success/20 text-success hover:bg-success/30 border border-success/30'
        }`}
      >
        {isConnected ? 'Disconnect' : 'Reconnect'}
      </button>
    </div>
  );
};

export default ConnectionStatus;
