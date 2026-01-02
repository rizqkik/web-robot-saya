import { AlertTriangle } from 'lucide-react';

interface AlertBannerProps {
  show: boolean;
}

const AlertBanner = ({ show }: AlertBannerProps) => {
  if (!show) return null;

  return (
    <div className="w-full bg-destructive text-destructive-foreground py-4 px-6 rounded-lg animate-pulse-glow flex items-center justify-center gap-4">
      <AlertTriangle className="w-6 h-6 animate-bounce" />
      <span className="font-bold text-lg tracking-wide">
        NEED EVACUATION ASAP!! STAY AWAY FROM THE AREA
      </span>
      <AlertTriangle className="w-6 h-6 animate-bounce" />
    </div>
  );
};

export default AlertBanner;
