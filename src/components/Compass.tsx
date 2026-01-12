import { Cog } from 'lucide-react';

interface CompassProps {
  direction: number;
}

const Compass = ({ direction }: CompassProps) => {
  const directions = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ];

  return (
    <div className="relative w-full max-w-48 h-48 mx-auto">
      {/* Outer ring with glow */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/30 glow-primary" />
      
      {/* Inner circle with gradient */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-card to-secondary border border-border" />
      
      {/* Radar sweep effect */}
      <div 
        className="absolute inset-4 rounded-full overflow-hidden"
        style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)' }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/20 animate-radar origin-center"
        />
      </div>

      {/* Direction markers */}
      {directions.map(({ label, angle }) => {
        const isActive = Math.abs(direction - angle) < 45 || Math.abs(direction - angle) > 315;
        const radians = (angle - 90) * (Math.PI / 180);
        const x = 50 + 40 * Math.cos(radians);
        const y = 50 + 40 * Math.sin(radians);
        
        return (
          <div
            key={label}
            className={`absolute font-mono font-bold text-sm transition-all duration-300 ${
              isActive ? 'text-primary scale-110' : 'text-muted-foreground'
            }`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            } as React.CSSProperties}
          >
            {label}
          </div>
        );
      })}

      {/* Robot indicator (wheel icon) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative transition-transform duration-500"
          style={{ transform: `rotate(${direction}deg)` }}
        >
          {/* Direction arrow */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-primary" />
          
          {/* Robot wheel icon */}
          <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center glow-primary">
            <Cog className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Degree indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
        <span className="font-mono text-sm text-primary">{direction}°</span>
      </div>
    </div>
  );
};

export default Compass;
