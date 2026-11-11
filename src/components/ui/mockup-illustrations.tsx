export function HeroCyberGrid() {
  return (
    <div className="absolute bottom-0 inset-x-0 h-48 overflow-hidden pointer-events-none select-none z-0">
      <svg
        className="w-full h-full opacity-40 mix-blend-screen"
        viewBox="0 0 1200 240"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="cyberGridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#0084FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="fadeVertical" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="40%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFF" stopOpacity="1" />
          </linearGradient>
          <mask id="gridMask">
            <rect width="1200" height="240" fill="url(#fadeVertical)" />
          </mask>
        </defs>

        <g mask="url(#gridMask)" stroke="url(#cyberGridGrad)" strokeWidth="1.2">
          {/* Horizontal curved wave lines */}
          <path d="M0,120 Q300,70 600,130 T1200,90" fill="none" opacity="0.4" />
          <path d="M0,140 Q300,90 600,150 T1200,110" fill="none" opacity="0.5" />
          <path d="M0,160 Q300,110 600,170 T1200,130" fill="none" opacity="0.6" />
          <path d="M0,180 Q300,130 600,190 T1200,150" fill="none" opacity="0.7" />
          <path d="M0,200 Q300,150 600,210 T1200,170" fill="none" opacity="0.8" />
          <path d="M0,220 Q300,170 600,230 T1200,190" fill="none" opacity="0.9" />
          <path d="M0,240 Q300,190 600,250 T1200,210" fill="none" opacity="1" />

          {/* Perspective vertical grid lines */}
          {Array.from({ length: 33 }).map((_, i) => {
            const x = i * 40 - 60;
            const targetX = (i - 16) * 75 + 600;
            return (
              <path
                key={i}
                d={`M${x},100 Q${(x + targetX) / 2},160 ${targetX},240`}
                fill="none"
                opacity={0.35 + (i % 3 === 0 ? 0.3 : 0)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function CurvedUnderline() {
  return (
    <svg
      className="absolute -bottom-2.5 left-0 w-full h-3 text-cyan-300 pointer-events-none"
      viewBox="0 0 220 14"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M3 10C55 2.5 165 2.5 217 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Illustration3DClapperboard({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-cyan-400/30 rounded-full blur-xl animate-pulse" />
      
      <svg viewBox="0 0 160 160" className="w-full h-full relative z-10 drop-shadow-2xl">
        <defs>
          <linearGradient id="clapBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FA6FF" />
            <stop offset="40%" stopColor="#1C77FF" />
            <stop offset="100%" stopColor="#0B4ECF" />
          </linearGradient>
          <linearGradient id="clapHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="clapHead" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <filter id="clapGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Clapper Base Board */}
        <g transform="rotate(-6 80 80)">
          {/* Main rectangular board with glossy rounded corners */}
          <rect
            x="24"
            y="56"
            width="112"
            height="80"
            rx="18"
            fill="url(#clapBody)"
            stroke="#93C5FD"
            strokeWidth="2.5"
          />

          {/* Top highlight glare */}
          <rect
            x="26"
            y="58"
            width="108"
            height="32"
            rx="16"
            fill="url(#clapHighlight)"
            opacity="0.45"
          />

          {/* Central Play Triangle (Glass 3D) */}
          <polygon
            points="74,82 74,110 98,96"
            fill="#FFFFFF"
            filter="url(#clapGlow)"
            opacity="0.95"
          />

          {/* Clapper Upper Stick (hinged) */}
          <g transform="rotate(-14 26 48)">
            <rect
              x="22"
              y="34"
              width="116"
              height="20"
              rx="8"
              fill="url(#clapHead)"
              stroke="#BFDBFE"
              strokeWidth="2"
            />
            {/* White stripes on stick */}
            <path d="M42,35 L34,53 M62,35 L54,53 M82,35 L74,53 M102,35 L94,53 M122,35 L114,53"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>

          {/* Metallic hinge pin */}
          <circle cx="28" cy="54" r="5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="28" cy="54" r="2" fill="#FFFFFF" />
        </g>

        {/* Small sparkle stars around */}
        <path d="M136,36 L139,44 L147,47 L139,50 L136,58 L133,50 L125,47 L133,44 Z" fill="#67E8F9" />
        <path d="M22,120 L24,125 L29,127 L24,129 L22,134 L20,129 L15,127 L20,125 Z" fill="#93C5FD" />
      </svg>
    </div>
  );
}

export function Illustration3DCalculator({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Ambient shadow glow */}
      <div className="absolute inset-0 bg-blue-300/30 rounded-3xl blur-lg" />

      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-md">
        <defs>
          <linearGradient id="calcBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="btnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>

        {/* Calculator Main Body (Soft 3D Rounded) */}
        <rect
          x="14"
          y="10"
          width="72"
          height="82"
          rx="18"
          fill="url(#calcBodyGrad)"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />

        {/* Inner LCD Screen */}
        <rect
          x="22"
          y="18"
          width="56"
          height="18"
          rx="7"
          fill="url(#screenGrad)"
          stroke="#BAE6FD"
          strokeWidth="1.2"
        />
        {/* Screen digit line indicator */}
        <rect x="52" y="24" width="20" height="4" rx="2" fill="#E0F2FE" opacity="0.8" />

        {/* Keypad Buttons (3x3 grid) */}
        {/* Row 1 */}
        <rect x="22" y="42" width="15" height="11" rx="4" fill="url(#btnGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        <rect x="42" y="42" width="15" height="11" rx="4" fill="url(#btnGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        <rect x="62" y="42" width="16" height="11" rx="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.8" />
        <path d="M68,47.5 H72 M70,45.5 V49.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

        {/* Row 2 */}
        <rect x="22" y="57" width="15" height="11" rx="4" fill="url(#btnGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        <rect x="42" y="57" width="15" height="11" rx="4" fill="url(#btnGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        <rect x="62" y="57" width="16" height="11" rx="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.8" />
        <path d="M68,62.5 H72" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

        {/* Row 3 */}
        <rect x="22" y="72" width="15" height="11" rx="4" fill="url(#btnGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        <rect x="42" y="72" width="15" height="11" rx="4" fill="url(#btnGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        <rect x="62" y="72" width="16" height="11" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="0.8" />
        <path d="M68,76 H72 M68,79 H72" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Illustration3DTag({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Ambient shadow glow */}
      <div className="absolute inset-0 bg-indigo-300/30 rounded-3xl blur-lg" />

      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-md">
        <defs>
          <linearGradient id="tagBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C7D2FE" />
            <stop offset="50%" stopColor="#A5B4FC" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="tagGleam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <g transform="rotate(18 50 50)">
          {/* Main Tag Shape */}
          <path
            d="M26,30 L52,14 C56,12 61,13 64,16 L84,36 C87,39 88,44 86,48 L70,74 C68,78 63,80 59,80 L30,80 C24,80 20,76 20,70 L20,41 C20,36 22,32 26,30 Z"
            fill="url(#tagBodyGrad)"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />

          {/* Glare on upper surface */}
          <path
            d="M26,30 L52,14 C55,13 58,13 60,15 L78,33 C80,35 80,37 79,39 L60,54 C58,56 55,56 53,55 L22,38 C21,36 23,32 26,30 Z"
            fill="url(#tagGleam)"
            opacity="0.5"
          />

          {/* Hole for string */}
          <circle cx="34" cy="38" r="4.5" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.5" />
          <circle cx="34" cy="38" r="2" fill="#4338CA" />

          {/* Large % Sign */}
          <text
            x="56"
            y="64"
            fill="#FFFFFF"
            fontSize="26"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
            textAnchor="middle"
            transform="rotate(-14 56 64)"
          >
            %
          </text>
        </g>
      </svg>
    </div>
  );
}
