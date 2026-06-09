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

const Wheel = ({ className = "" }: { className?: string }) => (
  <div
    className={`absolute h-10 w-10 rounded-full border-4 border-slate-950 bg-slate-800 shadow-lg ${className}`}
    style={{ transform: "translateZ(18px)" }}
  >
    <div className="absolute inset-1 rounded-full border-2 border-cyan-400/70 bg-slate-900" />
    <div className="absolute left-1/2 top-1/2 h-1 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-500" />
    <div className="absolute left-1/2 top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-500" />
  </div>
);

const Compass = ({ direction, pitch = 0, roll = 0, yaw }: CompassProps) => {
  const yawValue = normalizeAngle(yaw ?? direction);
  const pitchValue = clamp(pitch, -55, 55);
  const rollValue = clamp(roll, -55, 55);

  const modelTransform = `
    rotateX(${62 - pitchValue}deg)
    rotateZ(${yawValue}deg)
    rotateY(${rollValue}deg)
  `;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative h-72 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-card via-muted/20 to-card shadow-inner">
        <div
          className="absolute inset-5 rounded-lg border border-border/70 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />

        <div className="absolute left-5 top-5 rounded border border-primary/20 bg-background/80 px-2 py-1 text-[10px] font-mono uppercase tracking-normal text-muted-foreground">
          MPU6050 Attitude
        </div>

        <div className="absolute right-5 top-5 flex gap-2 text-[10px] font-mono uppercase tracking-normal text-muted-foreground">
          <span>X Pitch</span>
          <span>Y Roll</span>
          <span>Z Yaw</span>
        </div>

        <div className="absolute inset-x-0 top-10 bottom-16 flex items-center justify-center [perspective:900px]">
          <div
            className="relative h-36 w-52 transition-transform duration-500 ease-out"
            style={{
              transform: modelTransform,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-24 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-2xl"
              style={{ transform: "translateZ(-34px)" }}
            />

            <div
              className="absolute left-1/2 top-1/2 h-24 w-40 -translate-x-1/2 -translate-y-1/2 rounded-md bg-slate-950/20 blur-md"
              style={{ transform: "translateZ(-28px)" }}
            />

            <Wheel className="-left-1 top-1" />
            <Wheel className="right-0 top-1" />
            <Wheel className="-left-1 bottom-1" />
            <Wheel className="right-0 bottom-1" />

            <div
              className="absolute left-8 right-8 top-8 bottom-8 rounded-md border border-slate-900 bg-slate-950 shadow-xl"
              style={{ transform: "translateZ(20px)" }}
            />

            <div
              className="absolute left-10 right-10 top-6 h-20 rounded-md border border-slate-600 bg-slate-700 shadow-md"
              style={{ transform: "translateZ(30px)" }}
            />

            <div
              className="absolute left-14 right-14 top-1 h-16 rounded border border-cyan-500/50 bg-cyan-950/70 shadow-[0_0_18px_hsl(var(--primary)/0.25)]"
              style={{ transform: "translateZ(48px)" }}
            >
              <div className="absolute inset-x-4 top-3 h-2 rounded bg-slate-500" />
              <div className="absolute left-3 top-8 h-4 w-4 rounded bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              <div className="absolute right-3 top-8 h-4 w-4 rounded bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.9)]" />
            </div>

            <div
              className="absolute left-1/2 top-3 h-11 w-2 -translate-x-1/2 rounded-full bg-slate-300 shadow"
              style={{ transform: "translateZ(58px)" }}
            />

            <div
              className="absolute left-1/2 -top-5 h-0 w-0 -translate-x-1/2 border-l-[11px] border-r-[11px] border-b-[24px] border-l-transparent border-r-transparent border-b-primary drop-shadow"
              style={{ transform: "translateZ(62px)" }}
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border bg-background/80 px-3 py-2">
            <div className="text-[10px] uppercase tracking-normal text-muted-foreground">Yaw Z</div>
            <div className="font-mono text-lg font-bold text-primary">{formatAngle(yawValue)}</div>
          </div>
          <div className="rounded-md border border-border bg-background/80 px-3 py-2">
            <div className="text-[10px] uppercase tracking-normal text-muted-foreground">Pitch X</div>
            <div className="font-mono text-lg font-bold text-foreground">{formatAngle(pitchValue)}</div>
          </div>
          <div className="rounded-md border border-border bg-background/80 px-3 py-2">
            <div className="text-[10px] uppercase tracking-normal text-muted-foreground">Roll Y</div>
            <div className="font-mono text-lg font-bold text-foreground">{formatAngle(rollValue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compass;
