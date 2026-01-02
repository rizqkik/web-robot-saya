import { Activity, Download, RefreshCw, Pause, Play } from 'lucide-react';
import GasDataTable from '@/components/GasDataTable';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useSensorData } from '@/contexts/SensorDataContext';
import { getWorstStatus } from '@/data/mockData';
import { Button } from '@/components/ui/button';

const DataLogs = () => {
  const { readings, isConnected, lastUpdate, connect, disconnect } = useSensorData();
  const worstStatus = readings.length > 0 ? getWorstStatus(readings) : 'Safe';

  const dangerousCount = readings.filter(r => r.status === 'Dangerous' || r.status === 'High').length;
  const safeCount = readings.filter(r => r.status === 'Safe' || r.status === 'Low').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg transition-all duration-300 ${
            isConnected ? 'bg-primary/10 glow-primary' : 'bg-muted'
          }`}>
            <Activity className={`w-6 h-6 ${isConnected ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Real-Time Gas Data</h1>
            <p className="text-muted-foreground">Historical sensor readings and status logs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={isConnected ? disconnect : connect}
          >
            {isConnected ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isConnected ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Connection Status Bar */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
        <ConnectionStatus />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Readings</p>
          <p className="text-2xl font-bold font-mono text-primary">{readings.length}</p>
        </div>
        <div className={`p-4 rounded-lg bg-card border transition-all duration-300 ${
          dangerousCount > 0 ? 'border-destructive/50 animate-pulse' : 'border-border'
        }`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dangerous Events</p>
          <p className="text-2xl font-bold font-mono text-destructive">{dangerousCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Safe Readings</p>
          <p className="text-2xl font-bold font-mono text-success">{safeCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Status</p>
          <p className={`text-2xl font-bold font-mono ${
            worstStatus === 'Dangerous' || worstStatus === 'High' 
              ? 'text-destructive' 
              : worstStatus === 'Moderate' 
                ? 'text-warning' 
                : 'text-success'
          }`}>
            {worstStatus}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'
            }`} />
            <span className="text-sm font-medium text-muted-foreground">
              {isConnected ? 'Live Data Feed - Updating every 3 seconds' : 'Data Feed Paused'}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Last update: {lastUpdate?.toLocaleTimeString() || 'N/A'}
          </span>
        </div>
        {readings.length > 0 ? (
          <GasDataTable data={readings} />
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Waiting for sensor data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataLogs;
