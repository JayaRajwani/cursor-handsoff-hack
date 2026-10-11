/**
 * Custom hero illustration (original artwork, free to use):
 * a patient leaflet being drafted, a heartbeat line, a stethoscope
 * and a small neural-network pattern representing AI.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 480" className={className} role="img" aria-labelledby="hero-ill-title">
      <title id="hero-ill-title">
        Illustration of a patient information leaflet being designed with the help of an AI assistant
      </title>
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef3f9" />
          <stop offset="1" stopColor="#f0fdfa" />
        </linearGradient>
        <filter id="hero-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0b2545" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Soft background shape */}
      <rect x="20" y="30" width="520" height="420" rx="40" fill="url(#hero-bg)" />

      {/* Neural network pattern (top right) */}
      <g stroke="#0f766e" strokeOpacity="0.35" strokeWidth="1.5">
        <line x1="430" y1="70" x2="480" y2="110" />
        <line x1="430" y1="70" x2="470" y2="40" />
        <line x1="480" y1="110" x2="510" y2="70" />
        <line x1="470" y1="40" x2="510" y2="70" />
        <line x1="480" y1="110" x2="455" y2="150" />
        <line x1="430" y1="70" x2="455" y2="150" />
      </g>
      <g fill="#0f766e">
        <circle cx="430" cy="70" r="6" />
        <circle cx="480" cy="110" r="7" />
        <circle cx="470" cy="40" r="4.5" fillOpacity="0.7" />
        <circle cx="510" cy="70" r="5" fillOpacity="0.7" />
        <circle cx="455" cy="150" r="4.5" fillOpacity="0.6" />
      </g>

      {/* Leaflet / document card */}
      <g filter="url(#hero-shadow)">
        <rect x="150" y="70" width="260" height="340" rx="16" fill="#ffffff" />
      </g>
      <rect x="150" y="70" width="260" height="64" rx="16" fill="#0b2545" />
      <rect x="150" y="110" width="260" height="24" fill="#0b2545" />
      <rect x="172" y="90" width="120" height="10" rx="5" fill="#ffffff" fillOpacity="0.9" />
      <rect x="172" y="108" width="80" height="8" rx="4" fill="#2dd4bf" />

      {/* Heartbeat line across the leaflet */}
      <path
        d="M172 176h44l12-26 18 52 14-36 10 10h86"
        fill="none"
        stroke="#0f766e"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Text lines */}
      <g fill="#cbd5e1">
        <rect x="172" y="226" width="216" height="8" rx="4" />
        <rect x="172" y="244" width="190" height="8" rx="4" />
        <rect x="172" y="262" width="204" height="8" rx="4" />
      </g>
      {/* Checklist */}
      <g>
        <rect x="172" y="294" width="16" height="16" rx="4" fill="#e8f3ec" stroke="#2f7d4f" strokeWidth="1.5" />
        <path d="M176 302l3 3 6-6" fill="none" stroke="#2f7d4f" strokeWidth="2" strokeLinecap="round" />
        <rect x="198" y="298" width="140" height="8" rx="4" fill="#cbd5e1" />
        <rect x="172" y="322" width="16" height="16" rx="4" fill="#e8f3ec" stroke="#2f7d4f" strokeWidth="1.5" />
        <path d="M176 330l3 3 6-6" fill="none" stroke="#2f7d4f" strokeWidth="2" strokeLinecap="round" />
        <rect x="198" y="326" width="120" height="8" rx="4" fill="#cbd5e1" />
        <rect x="172" y="350" width="16" height="16" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="198" y="354" width="150" height="8" rx="4" fill="#cbd5e1" />
      </g>

      {/* AI assistant chat bubble (left) */}
      <g filter="url(#hero-shadow)">
        <rect x="44" y="210" width="150" height="86" rx="14" fill="#ffffff" />
      </g>
      <circle cx="70" cy="236" r="12" fill="#ccfbf1" />
      <path d="M64 236h4l2-5 3 10 2-5h3" fill="none" stroke="#0f766e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="90" y="230" width="84" height="7" rx="3.5" fill="#0b2545" fillOpacity="0.85" />
      <rect x="62" y="256" width="112" height="6" rx="3" fill="#cbd5e1" />
      <rect x="62" y="270" width="90" height="6" rx="3" fill="#cbd5e1" />

      {/* Stethoscope (bottom right) */}
      <g fill="none" stroke="#13315c" strokeWidth="5" strokeLinecap="round">
        <path d="M434 236v18c0 26 14 44 36 46" />
        <path d="M506 236v18c0 26-14 44-36 46" />
        <path d="M470 300v86" />
      </g>
      <circle cx="434" cy="232" r="6" fill="#13315c" />
      <circle cx="506" cy="232" r="6" fill="#13315c" />
      <circle cx="470" cy="408" r="20" fill="#ffffff" stroke="#13315c" strokeWidth="5" />
      <circle cx="470" cy="408" r="8" fill="#0f766e" />

      {/* Shield / privacy badge */}
      <g filter="url(#hero-shadow)">
        <circle cx="120" cy="380" r="34" fill="#ffffff" />
      </g>
      <path d="M120 360l18 7v12c0 11-8 19-18 23-10-4-18-12-18-23v-12z" fill="#0b2545" />
      <path d="M112 381l6 6 10-11" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
