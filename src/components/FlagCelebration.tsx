import type { CSSProperties } from 'react';

export const FLAG_CELEBRATION_DURATION = 2000;

type FlagCelebrationProps = { active: boolean; sequence: number; reduceMotion: boolean; label?: string };

const sparkColors = ['#F3AC2C', '#35A685', '#EC686F', '#408ED0', '#AC70C1', '#EB8B42'];
const rays = Array.from({ length: 20 }, (_, index) => {
  const angle = (index / 20) * Math.PI * 2;
  const innerRadius = index % 2 ? 60 : 77;
  const outerRadius = index % 2 ? 101 : 114;
  return {
    x1: 130 + Math.cos(angle) * innerRadius,
    y1: 130 + Math.sin(angle) * innerRadius,
    x2: 130 + Math.cos(angle) * outerRadius,
    y2: 130 + Math.sin(angle) * outerRadius,
    innerX1: 130 + Math.cos(angle + .1) * 22,
    innerY1: 130 + Math.sin(angle + .1) * 22,
    innerX2: 130 + Math.cos(angle + .1) * (index % 2 ? 46 : 57),
    innerY2: 130 + Math.sin(angle + .1) * (index % 2 ? 46 : 57),
    color: sparkColors[index % sparkColors.length],
  };
});
const bursts = [
  { position: 'top-left', delay: 0 },
  { position: 'middle-right', delay: 80 },
  { position: 'bottom-left', delay: 180 },
  { position: 'top-right', delay: 260 },
  { position: 'middle-left', delay: 360 },
  { position: 'bottom-right', delay: 420 },
];

// Every particle is confined to an edge band, including its short fall and drift.
const confetti = Array.from({ length: 52 }, (_, index) => {
  const edge = index < 32 ? (index % 2 ? 'right' : 'left') : (index % 2 ? 'bottom' : 'top');
  const slot = index < 32 ? Math.floor(index / 2) : Math.floor((index - 32) / 2);
  return {
    edge,
    color: sparkColors[index % sparkColors.length],
    x: index < 32 ? 4 + (slot % 4) * 3.7 : 24 + slot * 5.7,
    y: index < 32 ? 9 + Math.floor(slot / 4) * 20 : 0,
    delay: (index * 31) % 390,
    rotation: index * 47,
    drift: (index % 5 - 2) * 10,
  };
});

/** This decoration never catches a touch, including touches on the continue button. */
export function FlagCelebration({ active, sequence, reduceMotion, label = 'הדגל מוכן! זיקוקים שמחים' }: FlagCelebrationProps) {
  if (!active) return null;
  return <div
    key={sequence}
    className={`flag-celebration${reduceMotion ? ' flag-celebration-reduced' : ''}`}
    role="status"
    aria-label={label}
  >
    {bursts.map(({ position, delay }) => <svg
      key={position}
      className={`flag-firework flag-firework-${position}`}
      viewBox="0 0 260 260"
      fill="none"
      aria-hidden="true"
      style={{ '--burst-delay': `${delay}ms` } as CSSProperties}
    >
      {rays.map((ray, rayIndex) => <g key={rayIndex}>
        <line x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} stroke={ray.color} strokeWidth={rayIndex % 2 ? 5 : 7} strokeLinecap="round" />
        <line x1={ray.innerX1} y1={ray.innerY1} x2={ray.innerX2} y2={ray.innerY2} stroke={sparkColors[(rayIndex + 2) % sparkColors.length]} strokeWidth={rayIndex % 2 ? 4 : 6} strokeLinecap="round" />
        <circle cx={ray.x2} cy={ray.y2} r={rayIndex % 2 ? 3 : 4.5} fill={ray.color} />
      </g>)}
      <path d="M130 120 133 127 140 130 133 133 130 140 127 133 120 130 127 127Z" fill="#F3AC2C" />
    </svg>)}
    {confetti.map((particle, index) => <i
      key={index}
      className={`flag-confetti flag-confetti-${particle.edge}${index % 3 === 0 ? ' flag-confetti-round' : ''}`}
      aria-hidden="true"
      style={{
        '--confetti-x': `${particle.x}%`,
        '--confetti-y': `${particle.y}%`,
        '--confetti-color': particle.color,
        '--confetti-delay': `${particle.delay}ms`,
        '--confetti-rotation': `${particle.rotation}deg`,
        '--confetti-drift': `${particle.drift}px`,
      } as CSSProperties}
    />)}
  </div>;
}
