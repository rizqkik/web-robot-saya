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

const RobotAttitudeModel = () => (
  <svg
    viewBox="0 0 360 260"
    role="img"
    aria-label="3D robot attitude model"
    className="h-full w-full drop-shadow-2xl"
  >
    <defs>
      <linearGradient id="wheelBlue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <linearGradient id="bodyTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1f2937" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="boardTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="sensorBoard" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <ellipse cx="182" cy="218" rx="126" ry="20" fill="#020617" opacity="0.18" />

    <g>
      <ellipse cx="72" cy="165" rx="35" ry="29" fill="#020617" />
      <ellipse cx="72" cy="165" rx="26" ry="21" fill="#111827" stroke="#334155" strokeWidth="6" />
      <ellipse cx="72" cy="165" rx="15" ry="12" fill="url(#wheelBlue)" opacity="0.85" />
      <line x1="52" y1="165" x2="92" y2="165" stroke="#64748b" strokeWidth="3" />
      <line x1="72" y1="147" x2="72" y2="183" stroke="#64748b" strokeWidth="3" />

      <ellipse cx="270" cy="156" rx="35" ry="29" fill="#020617" />
      <ellipse cx="270" cy="156" rx="26" ry="21" fill="#111827" stroke="#334155" strokeWidth="6" />
      <ellipse cx="270" cy="156" rx="15" ry="12" fill="url(#wheelBlue)" opacity="0.85" />
      <line x1="250" y1="156" x2="290" y2="156" stroke="#64748b" strokeWidth="3" />
      <line x1="270" y1="138" x2="270" y2="174" stroke="#64748b" strokeWidth="3" />

      <ellipse cx="101" cy="93" rx="27" ry="22" fill="#020617" />
      <ellipse cx="101" cy="93" rx="20" ry="16" fill="#111827" stroke="#334155" strokeWidth="5" />
      <ellipse cx="101" cy="93" rx="11" ry="9" fill="url(#wheelBlue)" opacity="0.75" />

      <ellipse cx="286" cy="84" rx="27" ry="22" fill="#020617" />
      <ellipse cx="286" cy="84" rx="20" ry="16" fill="#111827" stroke="#334155" strokeWidth="5" />
      <ellipse cx="286" cy="84" rx="11" ry="9" fill="url(#wheelBlue)" opacity="0.75" />
    </g>

    <g>
      <line x1="92" y1="136" x2="92" y2="184" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
      <line x1="250" y1="126" x2="250" y2="174" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
      <line x1="116" y1="86" x2="116" y2="140" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
      <line x1="276" y1="78" x2="276" y2="132" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
    </g>

    <polygon points="70,139 130,82 292,95 232,171" fill="url(#bodyTop)" stroke="#0f172a" strokeWidth="3" />
    <polygon points="70,139 232,171 232,193 70,160" fill="#020617" opacity="0.95" />
    <polygon points="232,171 292,95 292,117 232,193" fill="#111827" />
    <polygon points="86,143 127,106 165,111 124,151" fill="#0f172a" />
    <polygon points="164,146 232,154 232,188 164,176" fill="#f59e0b" opacity="0.95" />
    <polygon points="234,151 270,106 270,139 234,188" fill="#f97316" opacity="0.9" />

    <polygon points="96,102 139,69 284,80 241,122" fill="#4b5563" stroke="#0f172a" strokeWidth="2" />
    <polygon points="96,102 241,122 241,137 96,117" fill="#334155" />
    <polygon points="241,122 284,80 284,95 241,137" fill="#1f2937" />

    <polygon points="121,71 159,47 286,56 247,86" fill="url(#sensorBoard)" stroke="#0f172a" strokeWidth="2" />
    <polygon points="121,71 247,86 247,101 121,86" fill="#334155" />
    <polygon points="247,86 286,56 286,70 247,101" fill="#1e293b" />

    <g opacity="0.92">
      <rect x="149" y="55" width="22" height="13" rx="2" fill="#64748b" transform="rotate(5 160 61.5)" />
      <rect x="178" y="57" width="25" height="15" rx="2" fill="#475569" transform="rotate(5 190.5 64.5)" />
      <rect x="211" y="60" width="20" height="13" rx="2" fill="#64748b" transform="rotate(5 221 66.5)" />
      <rect x="245" y="62" width="21" height="15" rx="2" fill="#475569" transform="rotate(5 255.5 69.5)" />
      <rect x="137" y="76" width="25" height="5" rx="2" fill="#22c55e" filter="url(#softGlow)" />
      <rect x="230" y="81" width="24" height="5" rx="2" fill="#ef4444" filter="url(#softGlow)" />
    </g>

    <path d="M206 73 C218 93, 221 118, 214 142" fill="none" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
    <path d="M213 72 C228 94, 231 120, 224 147" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />

    <polygon points="73,137 104,116 131,122 98,149" fill="#030712" />
    <rect x="91" y="150" width="50" height="8" rx="4" fill="#334155" transform="rotate(10 116 154)" />
    <path d="M81 180 C96 199, 125 205, 151 198" fill="none" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />

    <g stroke="#94a3b8" strokeWidth="4" strokeLinecap="round">
      <line x1="78" y1="149" x2="101" y2="93" />
      <line x1="255" y1="142" x2="286" y2="84" />
      <line x1="93" y1="163" x2="232" y2="171" />
      <line x1="124" y1="104" x2="270" y2="93" />
    </g>
  </svg>
);

const Compass = ({ direction, pitch = 0, roll = 0, yaw }: CompassProps) => {
  const yawValue = normalizeAngle(yaw ?? direction);
  const pitchValue = clamp(pitch, -55, 55);
  const rollValue = clamp(roll, -55, 55);

  const attitudeTransform = `
    rotateX(${pitchValue * -0.65}deg)
    rotateY(${rollValue * 0.85}deg)
    rotateZ(${yawValue * 0.35}deg)
  `;

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="relative h-80 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-background via-muted/20 to-card shadow-inner">
        <div
          className="absolute inset-5 rounded-lg border border-border/70 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />

        <div className="absolute left-5 top-5 rounded border border-primary/20 bg-background/85 px-2 py-1 text-[10px] font-mono uppercase tracking-normal text-muted-foreground">
          MPU6050 Attitude
        </div>

        <div className="absolute right-5 top-5 flex gap-2 text-[10px] font-mono uppercase tracking-normal text-muted-foreground">
          <span>X Pitch</span>
          <span>Y Roll</span>
          <span>Z Yaw</span>
        </div>

        <div className="absolute inset-x-3 top-10 bottom-16 flex items-center justify-center [perspective:900px]">
          <div
            className="h-56 w-[21rem] max-w-full origin-center transition-transform duration-500 ease-out"
            style={{
              transform: attitudeTransform,
              transformStyle: "preserve-3d",
            }}
          >
            <RobotAttitudeModel />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
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
