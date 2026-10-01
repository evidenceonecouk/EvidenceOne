/* Lightweight vector illustrations used as placeholders until brand artwork arrives. */

export function VerifyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="vi-card" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f2f3f5" />
        </linearGradient>
        <linearGradient id="vi-shield" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2b2f36" />
          <stop offset="1" stopColor="#16181b" />
        </linearGradient>
        <filter id="vi-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#16181b" floodOpacity="0.14" />
        </filter>
      </defs>
      {/* Back card: register entry */}
      <g filter="url(#vi-shadow)" transform="rotate(-6 120 110)">
        <rect x="40" y="46" width="170" height="112" rx="16" fill="url(#vi-card)" />
        <rect x="58" y="66" width="34" height="34" rx="9" fill="#cfe0fd" />
        <rect x="102" y="70" width="82" height="9" rx="4.5" fill="#d8dce0" />
        <rect x="102" y="86" width="56" height="8" rx="4" fill="#e6e8ea" />
        <rect x="58" y="116" width="134" height="8" rx="4" fill="#e6e8ea" />
        <rect x="58" y="132" width="96" height="8" rx="4" fill="#e6e8ea" />
      </g>
      {/* Front card: passport */}
      <g filter="url(#vi-shadow)" transform="rotate(5 220 120)">
        <rect x="150" y="62" width="128" height="150" rx="16" fill="#16181b" />
        <rect x="166" y="80" width="40" height="6" rx="3" fill="#ffffff" opacity="0.3" />
        <g transform="translate(196 116)">
          <rect width="36" height="36" rx="7" fill="none" stroke="#ffd84d" strokeOpacity="0.8" strokeWidth="2" />
          <rect x="6" y="6" width="10" height="10" rx="2" fill="#ffd84d" opacity="0.85" />
          <rect x="20" y="6" width="10" height="10" rx="2" fill="#ffd84d" opacity="0.85" />
          <rect x="6" y="20" width="10" height="10" rx="2" fill="#ffd84d" opacity="0.85" />
          <rect x="20" y="20" width="10" height="10" rx="2" fill="#ffd84d" opacity="0.85" />
        </g>
        <rect x="166" y="178" width="96" height="5" rx="2.5" fill="#ffffff" opacity="0.25" />
        <rect x="166" y="190" width="74" height="5" rx="2.5" fill="#ffffff" opacity="0.25" />
      </g>
      {/* Shield with completion tick */}
      <g filter="url(#vi-shadow)">
        <path d="M118 120 l30 -12 l30 12 v22 c0 20 -14 34 -30 40 c-16 -6 -30 -20 -30 -40 z" fill="url(#vi-shield)" />
        <circle cx="148" cy="146" r="15" fill="#ffd84d" />
        <path d="m141 146 5 5 9 -10" fill="none" stroke="#16181b" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Accents */}
      <circle cx="270" cy="40" r="10" fill="#dcd3fb" />
      <circle cx="40" cy="186" r="7" fill="#cdeee8" />
      <circle cx="292" cy="70" r="4" fill="#ffd84d" />
    </svg>
  )
}

export function ReviewIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden="true">
      <defs>
        <filter id="ri-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#16181b" floodOpacity="0.14" />
        </filter>
      </defs>
      <g filter="url(#ri-shadow)">
        <rect x="46" y="40" width="200" height="140" rx="18" fill="#ffffff" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(64 ${62 + i * 38})`}>
            <circle cx="12" cy="12" r="12" fill={['#ffe9a3', '#cfe0fd', '#cdeee8'][i]} />
            <rect x="34" y="4" width="86" height="8" rx="4" fill="#d8dce0" />
            <rect x="34" y="16" width="54" height="6" rx="3" fill="#e6e8ea" />
            <rect x="128" y="4" width="36" height="16" rx="8" fill={['#e9f0fd', '#f1ecfd', '#e6f4ec'][i]} />
          </g>
        ))}
      </g>
      {/* Clock badge for SLA */}
      <g filter="url(#ri-shadow)">
        <circle cx="250" cy="150" r="34" fill="#16181b" />
        <circle cx="250" cy="150" r="24" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="4" />
        <path d="M250 126 a24 24 0 0 1 22 33" fill="none" stroke="#ffd84d" strokeWidth="4" strokeLinecap="round" />
        <path d="M250 138 v13 l8 6" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* Sparkle for AI */}
      <g transform="translate(262 40)">
        <circle r="18" fill="#f1ecfd" />
        <path d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" fill="#6b3bd4" />
      </g>
      <circle cx="36" cy="190" r="7" fill="#ffd84d" />
    </svg>
  )
}

export function AdminIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden="true">
      <defs>
        <filter id="ai-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#16181b" floodOpacity="0.14" />
        </filter>
      </defs>
      <g filter="url(#ai-shadow)">
        <rect x="40" y="50" width="160" height="130" rx="18" fill="#ffffff" />
        <circle cx="100" cy="115" r="42" fill="none" stroke="#e6e8ea" strokeWidth="18" />
        <circle cx="100" cy="115" r="42" fill="none" stroke="#16181b" strokeWidth="18" strokeDasharray="132 264" transform="rotate(-90 100 115)" />
        <circle cx="100" cy="115" r="42" fill="none" stroke="#1f56c4" strokeWidth="18" strokeDasharray="79 264" strokeDashoffset="-132" transform="rotate(-90 100 115)" />
        <circle cx="100" cy="115" r="42" fill="none" stroke="#0b6e66" strokeWidth="18" strokeDasharray="53 264" strokeDashoffset="-211" transform="rotate(-90 100 115)" />
        <rect x="158" y="82" width="28" height="8" rx="4" fill="#d8dce0" />
        <rect x="158" y="102" width="22" height="8" rx="4" fill="#d8dce0" />
        <rect x="158" y="122" width="26" height="8" rx="4" fill="#d8dce0" />
      </g>
      <g filter="url(#ai-shadow)">
        <rect x="186" y="96" width="98" height="96" rx="16" fill="#16181b" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={202 + i * 18} y={170 - [30, 46, 38, 58][i]} width="10" height={[30, 46, 38, 58][i]} rx="3" fill={i === 3 ? '#ffd84d' : '#ffffff'} opacity={i === 3 ? 1 : 0.35} />
        ))}
      </g>
      <circle cx="266" cy="52" r="10" fill="#cfe0fd" />
      <circle cx="34" cy="40" r="6" fill="#cdeee8" />
    </svg>
  )
}
