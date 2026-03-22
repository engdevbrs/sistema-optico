// SVG illustrations for the landing page — lightweight, no external dependencies

interface IllustrationProps {
  className?: string
  opacity?: number
}

export function EyeIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      <ellipse cx="200" cy="150" rx="140" ry="80" stroke="var(--btn-primary-bg)" strokeWidth="3" fill="none" opacity="0.15" />
      <ellipse cx="200" cy="150" rx="120" ry="65" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="none" opacity="0.1" />
      <circle cx="200" cy="150" r="50" fill="var(--badge-primary-bg)" stroke="var(--btn-primary-bg)" strokeWidth="2.5" />
      <circle cx="200" cy="150" r="35" fill="var(--btn-primary-bg)" opacity="0.2" />
      <circle cx="200" cy="150" r="20" fill="var(--btn-primary-bg)" opacity="0.6" />
      <circle cx="200" cy="150" r="10" fill="var(--btn-primary-bg)" />
      <circle cx="212" cy="140" r="6" fill="white" opacity="0.8" />
      <circle cx="190" cy="158" r="3" fill="white" opacity="0.4" />
      <path d="M60 150 Q130 60 200 70 Q270 60 340 150" stroke="var(--btn-primary-bg)" strokeWidth="2.5" fill="none" opacity="0.3" strokeLinecap="round" />
      <path d="M60 150 Q130 240 200 230 Q270 240 340 150" stroke="var(--btn-primary-bg)" strokeWidth="2.5" fill="none" opacity="0.3" strokeLinecap="round" />
      <circle cx="80" cy="100" r="3" fill="var(--btn-primary-bg)" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="320" cy="100" r="2.5" fill="var(--btn-primary-bg)" opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="350" cy="200" r="2" fill="var(--btn-primary-bg)" opacity="0.25">
        <animate attributeName="opacity" values="0.25;0.5;0.25" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export function GlassesIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      <ellipse cx="60" cy="50" rx="38" ry="30" stroke="var(--btn-primary-bg)" strokeWidth="2.5" fill="var(--badge-primary-bg)" fillOpacity="0.3" />
      <ellipse cx="140" cy="50" rx="38" ry="30" stroke="var(--btn-primary-bg)" strokeWidth="2.5" fill="var(--badge-primary-bg)" fillOpacity="0.3" />
      <path d="M98 45 Q100 38 102 45" stroke="var(--btn-primary-bg)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M22 42 L5 35" stroke="var(--btn-primary-bg)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M178 42 L195 35" stroke="var(--btn-primary-bg)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <ellipse cx="48" cy="42" rx="10" ry="6" fill="white" opacity="0.15" transform="rotate(-15 48 42)" />
      <ellipse cx="128" cy="42" rx="10" ry="6" fill="white" opacity="0.15" transform="rotate(-15 128 42)" />
    </svg>
  )
}

export function CheckupIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      <rect x="40" y="20" width="120" height="160" rx="8" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="var(--badge-primary-bg)" fillOpacity="0.2" />
      <text x="60" y="60" fontSize="28" fontWeight="bold" fill="var(--btn-primary-bg)" opacity="0.8">E</text>
      <text x="60" y="90" fontSize="22" fontWeight="bold" fill="var(--btn-primary-bg)" opacity="0.6">F P</text>
      <text x="60" y="115" fontSize="16" fontWeight="bold" fill="var(--btn-primary-bg)" opacity="0.45">T O Z</text>
      <text x="60" y="137" fontSize="12" fontWeight="bold" fill="var(--btn-primary-bg)" opacity="0.3">L P E D</text>
      <text x="60" y="155" fontSize="9" fontWeight="bold" fill="var(--btn-primary-bg)" opacity="0.2">P E C F D</text>
      <line x1="140" y1="85" x2="95" y2="85" stroke="var(--status-danger)" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <animate attributeName="y1" values="60;85;110;85;60" dur="5s" repeatCount="indefinite" />
        <animate attributeName="y2" values="60;85;110;85;60" dur="5s" repeatCount="indefinite" />
      </line>
    </svg>
  )
}

// New optics-themed decorative SVGs

export function ContactLensIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      <circle cx="60" cy="60" r="45" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="none" opacity="0.2" />
      <circle cx="60" cy="60" r="35" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="var(--badge-primary-bg)" fillOpacity="0.15" />
      <circle cx="60" cy="60" r="20" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="none" opacity="0.3" />
      <circle cx="60" cy="60" r="8" fill="var(--btn-primary-bg)" opacity="0.4" />
      <circle cx="65" cy="55" r="3" fill="white" opacity="0.5" />
      {/* Curved lines suggesting a lens */}
      <path d="M25 60 Q60 25 95 60" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="none" opacity="0.15" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;8" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

export function PhoropeterIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      {/* Main body */}
      <rect x="20" y="30" width="120" height="80" rx="10" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="var(--badge-primary-bg)" fillOpacity="0.1" />
      {/* Left eyepiece */}
      <circle cx="55" cy="70" r="22" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="none" opacity="0.3" />
      <circle cx="55" cy="70" r="15" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="var(--badge-primary-bg)" fillOpacity="0.2" />
      <circle cx="55" cy="70" r="5" fill="var(--btn-primary-bg)" opacity="0.3" />
      {/* Right eyepiece */}
      <circle cx="105" cy="70" r="22" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="none" opacity="0.3" />
      <circle cx="105" cy="70" r="15" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="var(--badge-primary-bg)" fillOpacity="0.2" />
      <circle cx="105" cy="70" r="5" fill="var(--btn-primary-bg)" opacity="0.3" />
      {/* Bridge */}
      <line x1="77" y1="70" x2="83" y2="70" stroke="var(--btn-primary-bg)" strokeWidth="2" opacity="0.4" />
      {/* Top mount */}
      <line x1="80" y1="30" x2="80" y2="15" stroke="var(--btn-primary-bg)" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <circle cx="80" cy="12" r="4" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="none" opacity="0.3" />
      {/* Dials */}
      <circle cx="30" cy="50" r="6" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="none" opacity="0.2">
        <animateTransform attributeName="transform" type="rotate" from="0 30 50" to="360 30 50" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="130" cy="50" r="6" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="none" opacity="0.2">
        <animateTransform attributeName="transform" type="rotate" from="360 130 50" to="0 130 50" dur="6s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export function DropperIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 80 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      {/* Bottle */}
      <rect x="22" y="40" width="36" height="60" rx="6" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="var(--badge-primary-bg)" fillOpacity="0.15" />
      {/* Neck */}
      <rect x="30" y="25" width="20" height="18" rx="3" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="none" opacity="0.3" />
      {/* Cap */}
      <path d="M32 25 Q40 10 48 25" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="var(--badge-primary-bg)" fillOpacity="0.2" strokeLinecap="round" />
      {/* Drop */}
      <circle cx="40" cy="115" r="5" fill="var(--btn-primary-bg)" opacity="0.3">
        <animate attributeName="cy" values="105;120;105" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Liquid level */}
      <rect x="26" y="65" width="28" height="31" rx="4" fill="var(--btn-primary-bg)" opacity="0.1" />
    </svg>
  )
}

export function SunglassesIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 220 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      {/* Left lens - darker tint */}
      <path d="M20 45 Q20 20 60 20 L90 20 Q100 20 100 35 L100 55 Q100 75 80 75 L45 75 Q20 75 20 45Z"
        stroke="var(--btn-primary-bg)" strokeWidth="2" fill="var(--btn-primary-bg)" fillOpacity="0.15" />
      {/* Right lens */}
      <path d="M120 45 Q120 20 150 20 L180 20 Q200 20 200 35 L200 55 Q200 75 175 75 L140 75 Q120 75 120 45Z"
        stroke="var(--btn-primary-bg)" strokeWidth="2" fill="var(--btn-primary-bg)" fillOpacity="0.15" />
      {/* Bridge */}
      <path d="M100 35 Q110 28 120 35" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Temples */}
      <path d="M20 35 L5 30" stroke="var(--btn-primary-bg)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M200 35 L215 30" stroke="var(--btn-primary-bg)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* Lens sheen */}
      <path d="M35 30 Q50 25 55 40" stroke="white" strokeWidth="1.5" fill="none" opacity="0.2" strokeLinecap="round" />
      <path d="M135 30 Q150 25 155 40" stroke="white" strokeWidth="1.5" fill="none" opacity="0.2" strokeLinecap="round" />
    </svg>
  )
}

export function LensFrameIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      {/* Outer frame */}
      <rect x="10" y="25" width="80" height="50" rx="25" stroke="var(--btn-primary-bg)" strokeWidth="2" fill="none" opacity="0.25" />
      {/* Inner frame */}
      <rect x="18" y="33" width="64" height="34" rx="17" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="var(--badge-primary-bg)" fillOpacity="0.1" />
      {/* Lens */}
      <ellipse cx="50" cy="50" rx="20" ry="12" fill="var(--btn-primary-bg)" opacity="0.08" />
      {/* Reflection */}
      <path d="M38 42 Q45 38 48 44" stroke="white" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
      {/* Temple hinge dots */}
      <circle cx="12" cy="50" r="2" fill="var(--btn-primary-bg)" opacity="0.3" />
      <circle cx="88" cy="50" r="2" fill="var(--btn-primary-bg)" opacity="0.3" />
    </svg>
  )
}

export function CrosshairEyeIllustration({ className, opacity = 1 }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      {/* Crosshair */}
      <line x1="50" y1="10" x2="50" y2="90" stroke="var(--btn-primary-bg)" strokeWidth="1" opacity="0.15" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="var(--btn-primary-bg)" strokeWidth="1" opacity="0.15" />
      {/* Circles */}
      <circle cx="50" cy="50" r="35" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="none" opacity="0.15" strokeDasharray="6 4" />
      <circle cx="50" cy="50" r="22" stroke="var(--btn-primary-bg)" strokeWidth="1.5" fill="none" opacity="0.2" />
      <circle cx="50" cy="50" r="10" fill="var(--btn-primary-bg)" opacity="0.15" />
      <circle cx="50" cy="50" r="4" fill="var(--btn-primary-bg)" opacity="0.4" />
      {/* Corner marks */}
      <path d="M15 15 L15 25 M15 15 L25 15" stroke="var(--btn-primary-bg)" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <path d="M85 15 L85 25 M85 15 L75 15" stroke="var(--btn-primary-bg)" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <path d="M15 85 L15 75 M15 85 L25 85" stroke="var(--btn-primary-bg)" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <path d="M85 85 L85 75 M85 85 L75 85" stroke="var(--btn-primary-bg)" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
    </svg>
  )
}

export function WaveDivider({ flip, color }: { flip?: boolean; color?: string }) {
  return (
    <div style={{ transform: flip ? 'rotate(180deg)' : undefined, lineHeight: 0, marginTop: '-1px', marginBottom: '-1px' }}>
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        <path
          d="M0 40 Q360 80 720 40 T1440 40 V80 H0Z"
          fill={color ?? 'var(--bg-surface)'}
        />
      </svg>
    </div>
  )
}
