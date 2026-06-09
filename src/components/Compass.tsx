import { lazy, Suspense } from 'react';

const RobotOrientation3D = lazy(() => import('@/components/RobotOrientation3D'));

interface CompassProps {
  direction: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

const normalizeAngle = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
};

const formatAngle = (value: number) => `${Math.round(value)} deg`;

const Compass = ({ direction, pitch = 0, roll = 0, yaw }: CompassProps) => {
  const yawValue = normalizeAngle(yaw ?? direction);
  const pitchValue = clamp(pitch, -55, 55);
  const rollValue = clamp(roll, -55, 55);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="relative h-80 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-background via-muted/20 to-card shadow-inner">
        <div
          className="absolute inset-5 rounded-lg border border-border/70 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />

        <div className="absolute left-5 top-5 z-10 rounded border border-primary/20 bg-background/85 px-2 py-1 text-[10px] font-mono uppercase tracking-normal text-muted-foreground">
          MPU6050 Attitude
        </div>

        <div className="absolute right-5 top-5 z-10 flex gap-2 text-[10px] font-mono uppercase tracking-normal text-muted-foreground">
          <span>X Pitch</span>
          <span>Y Roll</span>
          <span>Z Yaw</span>
        </div>

        <div className="absolute inset-x-3 top-10 bottom-16">
          <Suspense fallback={<div className="h-full w-full" />}>
            <RobotOrientation3D yaw={yawValue} pitch={pitchValue} roll={rollValue} />
          </Suspense>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border bg-background/85 px-3 py-2">
            <div className="text-[10px] uppercase tracking-normal text-muted-foreground">Yaw Z</div>
            <div className="font-mono text-lg font-bold text-primary">{formatAngle(yawValue)}</div>
          </div>
          <div className="rounded-md border border-border bg-background/85 px-3 py-2">
            <div className="text-[10px] uppercase tracking-normal text-muted-foreground">Pitch X</div>
            <div className="font-mono text-lg font-bold text-foreground">{formatAngle(pitchValue)}</div>
          </div>
          <div className="rounded-md border border-border bg-background/85 px-3 py-2">
            <div className="text-[10px] uppercase tracking-normal text-muted-foreground">Roll Y</div>
            <div className="font-mono text-lg font-bold text-foreground">{formatAngle(rollValue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compass;
