import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DangerLevel, GasReading, getDangerLevelColor } from '@/data/mockData';
import { formatGasPpm } from '@/lib/utils';

const LEVEL_MODAL_INTERVAL_MS = 60 * 1000;

interface LevelAreaStatusModalProps {
  level: DangerLevel;
  reading?: GasReading;
}

const LevelAreaStatusModal = ({ level, reading }: LevelAreaStatusModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayTimestamp, setDisplayTimestamp] = useState(() => new Date().toLocaleString());

  useEffect(() => {
    const showLevelModal = () => {
      setDisplayTimestamp(reading?.timestamp || new Date().toLocaleString());
      setIsOpen(true);
    };

    showLevelModal();
    const interval = window.setInterval(showLevelModal, LEVEL_MODAL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [reading?.timestamp]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-card border border-border shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level Area Status</p>
            <h3 className={`text-2xl font-bold ${getDangerLevelColor(level)}`}>
              {level}
            </h3>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close level area status popup"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground mb-1">CO2</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {reading?.co2Valid === false ? 'Invalid' : formatGasPpm(reading?.co2)}
                {reading?.co2Valid !== false && <span className="text-sm text-muted-foreground"> ppm</span>}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground mb-1">CO</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatGasPpm(reading?.co)} <span className="text-sm text-muted-foreground">ppm</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground mb-1">LPG</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatGasPpm(reading?.lpg)} <span className="text-sm text-muted-foreground">ppm</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground mb-1">H2S</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatGasPpm(reading?.h2s)} <span className="text-sm text-muted-foreground">ppm</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 border border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">Timestamp</span>
            <span className="text-sm font-mono text-foreground text-right">{displayTimestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelAreaStatusModal;
