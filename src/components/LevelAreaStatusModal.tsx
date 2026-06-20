import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { DangerLevel, GasReading, getDangerLevelColor } from '@/data/mockData';
import { formatGasPpm } from '@/lib/utils';

const LEVEL_MODAL_INTERVAL_MS = 60 * 1000;
const LEVEL_MODAL_CHECK_MS = 1000;

let lastLevelModalInteractionAt = Date.now();

interface LevelAreaStatusModalProps {
  level: DangerLevel;
  reading?: GasReading;
}

const LevelAreaStatusModal = ({ level, reading }: LevelAreaStatusModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayTimestamp, setDisplayTimestamp] = useState(() => new Date().toLocaleString());
  const [displayLevel, setDisplayLevel] = useState(level);
  const [displayReading, setDisplayReading] = useState(reading);
  const latestLevelRef = useRef(level);
  const latestReadingRef = useRef(reading);

  useEffect(() => {
    latestLevelRef.current = level;
    latestReadingRef.current = reading;
  }, [level, reading]);

  useEffect(() => {
    const showLevelModal = () => {
      lastLevelModalInteractionAt = Date.now();
      setDisplayLevel(latestLevelRef.current);
      setDisplayReading(latestReadingRef.current);
      setDisplayTimestamp(latestReadingRef.current?.timestamp || new Date().toLocaleString());
      setIsOpen(true);
    };

    const interval = window.setInterval(() => {
      if (Date.now() - lastLevelModalInteractionAt >= LEVEL_MODAL_INTERVAL_MS) {
        showLevelModal();
      }
    }, LEVEL_MODAL_CHECK_MS);

    return () => window.clearInterval(interval);
  }, []);

  const closeModal = () => {
    lastLevelModalInteractionAt = Date.now();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-card border border-border shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level Area Status</p>
            <h3 className={`text-2xl font-bold ${getDangerLevelColor(displayLevel)}`}>
              {displayLevel}
            </h3>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close level area status popup"
            onClick={closeModal}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground mb-1">CO2</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {displayReading?.co2Valid === false ? 'Invalid' : formatGasPpm(displayReading?.co2)}
                {displayReading?.co2Valid !== false && <span className="text-sm text-muted-foreground"> ppm</span>}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground mb-1">CO</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatGasPpm(displayReading?.co)} <span className="text-sm text-muted-foreground">ppm</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground mb-1">LPG</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatGasPpm(displayReading?.lpg)} <span className="text-sm text-muted-foreground">ppm</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground mb-1">H2S</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatGasPpm(displayReading?.h2s)} <span className="text-sm text-muted-foreground">ppm</span>
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
