import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export type OrbiVariant = 
  | 'tasks-done' 
  | 'tasks-empty' 
  | 'habits-fresh' 
  | 'finance-calm' 
  | 'notes-spark' 
  | 'notifications-sleep' 
  | 'search-empty';

interface OrbiCompanionProps {
  variant?: OrbiVariant;
  size?: number;
  className?: string;
  animate?: boolean;
  interactive?: boolean;
  onTap?: () => void;
}

const ORBI_ENCOURAGEMENTS = [
  "You've got this!",
  "One step at a time.",
  "Stay focused and flow.",
  "Proud of your effort.",
  "Breathe and reset.",
  "Making great progress.",
];

/**
 * OrbiCompanion - The signature LifeOS Astral Mascot.
 * Dynamically theme-aware vector component consuming Material 3 tokens.
 */
export const OrbiCompanion: React.FC<OrbiCompanionProps> = ({
  variant = 'tasks-done',
  size = 140,
  className = '',
  animate = true,
  interactive = true,
  onTap,
}) => {
  const [bubbleText, setBubbleText] = React.useState<string | null>(null);
  const [spinKey, setSpinKey] = React.useState(0);

  const handleMascotTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive) return;

    setSpinKey(prev => prev + 1);
    const randomQuote = ORBI_ENCOURAGEMENTS[Math.floor(Math.random() * ORBI_ENCOURAGEMENTS.length)];
    setBubbleText(randomQuote);

    if (onTap) onTap();

    setTimeout(() => {
      setBubbleText(null);
    }, 2800);
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Interactive Speech Bubble Easter Egg with clean icon */}
      {bubbleText && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.8 }}
          animate={{ opacity: 1, y: -size * 0.58, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="absolute z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-primary-container,#ffd8e4)] text-[var(--md-on-primary-container,#3e001d)] border border-[var(--md-outline-variant)] shadow-md text-xs font-bold whitespace-nowrap"
        >
          <Sparkles size={12} className="text-[var(--md-primary)] shrink-0" />
          <span>{bubbleText}</span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[var(--md-primary-container,#ffd8e4)] border-r border-b border-[var(--md-outline-variant)]" />
        </motion.div>
      )}

      <motion.div
        key={spinKey}
        onClick={handleMascotTap}
        whileTap={interactive ? { scale: 0.88, rotate: -8 } : undefined}
        style={{ width: size, height: size, cursor: interactive ? 'pointer' : 'default' }}
        initial={spinKey > 0 ? { rotate: -15, scale: 1.15 } : false}
        animate={
          animate
            ? {
                y: [-3, 4, -3],
                rotate: [-1, 1.5, -1],
                scale: 1,
              }
            : undefined
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Theme Dynamic Gradients */}
          <radialGradient id="orbi-body-grad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--md-primary-container, #ffd8e4)" stopOpacity="0.95" />
            <stop offset="50%" stopColor="var(--md-surface-container-high, #2b2930)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--md-surface-container-lowest, #0f0d13)" stopOpacity="0.85" />
          </radialGradient>

          <radialGradient id="orbi-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--md-primary, #b51a55)" stopOpacity="0.35" />
            <stop offset="60%" stopColor="var(--md-primary, #b51a55)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--md-primary, #b51a55)" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="orbi-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--md-primary, #b51a55)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--md-tertiary, #ffb0cd)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--md-secondary, #e8b9d5)" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="gold-flame" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff7a00" />
            <stop offset="50%" stopColor="#ffb800" />
            <stop offset="100%" stopColor="#fff3b0" />
          </linearGradient>

          <linearGradient id="coffee-steam" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="var(--md-primary, #b51a55)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--md-primary, #b51a55)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Glow Aura */}
        <circle cx="80" cy="80" r="70" fill="url(#orbi-aura)" />

        {/* Floating Ring / Orbital Ring for Astral Look */}
        {(variant === 'tasks-done' || variant === 'tasks-empty') && (
          <ellipse
            cx="80"
            cy="92"
            rx="62"
            ry="16"
            stroke="url(#orbi-ring-grad)"
            strokeWidth="2.5"
            strokeDasharray="6 3"
            transform="rotate(-12 80 92)"
            opacity="0.85"
          />
        )}

        {/* Mascot Body Base (Soft Organic Squircle Capsule) */}
        <path
          d="M44 80 C44 48 58 36 80 36 C102 36 116 48 116 80 C116 112 102 124 80 124 C58 124 44 112 44 80 Z"
          fill="url(#orbi-body-grad)"
          stroke="var(--md-outline-variant, rgba(255,255,255,0.15))"
          strokeWidth="1.5"
        />

        {/* Glass Highlight on Forehead */}
        <path
          d="M58 48 C66 42 94 42 102 48 C96 52 64 52 58 48 Z"
          fill="#ffffff"
          opacity="0.25"
        />

        {/* Variant 1: Tasks Done (Zen Relaxation with Happy Arced Eyes + Steam Mug) */}
        {variant === 'tasks-done' && (
          <g>
            {/* Happy Closed Arced Eyes */}
            <path
              d="M62 76 Q69 70 76 76"
              stroke="var(--md-primary, #ffffff)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M84 76 Q91 70 98 76"
              stroke="var(--md-primary, #ffffff)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cute Rosy Cheeks */}
            <circle cx="58" cy="83" r="4.5" fill="var(--md-tertiary, #ff8da1)" opacity="0.65" />
            <circle cx="102" cy="83" r="4.5" fill="var(--md-tertiary, #ff8da1)" opacity="0.65" />
            {/* Small Gentle Smile */}
            <path
              d="M76 84 Q80 88 84 84"
              stroke="var(--md-on-surface, #ffffff)"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Cozy Warm Mug in Little Hands */}
            <g transform="translate(68, 92)">
              <rect x="0" y="4" width="24" height="18" rx="5" fill="var(--md-primary, #b51a55)" />
              <path d="M24 8 C28 8 28 16 24 16" stroke="var(--md-primary, #b51a55)" strokeWidth="2.5" fill="none" />
              <path d="M7 11 Q12 14 17 11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
              {/* Rising Steam */}
              <path d="M8 1 Q10 -3 8 -6" stroke="url(#coffee-steam)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M16 2 Q14 -2 16 -5" stroke="url(#coffee-steam)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>

            {/* Floating Sparkles */}
            <path d="M36 52 L38 46 L40 52 L46 54 L40 56 L38 62 L36 56 L30 54 Z" fill="var(--md-primary, #ffb0cd)" opacity="0.8" />
            <path d="M124 64 L125.5 59 L127 64 L132 65.5 L127 67 L125.5 72 L124 67 L119 65.5 Z" fill="var(--md-tertiary, #ffd8e4)" opacity="0.75" />
          </g>
        )}

        {/* Variant 2: Tasks Fresh / Empty (Curious Big Eyes + Floating Sparkle Slate) */}
        {variant === 'tasks-empty' && (
          <g>
            {/* Wide Curious Glossy Eyes */}
            <circle cx="68" cy="74" r="5.5" fill="var(--md-on-surface, #ffffff)" />
            <circle cx="70" cy="72" r="2" fill="#ffffff" />
            <circle cx="92" cy="74" r="5.5" fill="var(--md-on-surface, #ffffff)" />
            <circle cx="94" cy="72" r="2" fill="#ffffff" />
            <circle cx="58" cy="82" r="4" fill="var(--md-tertiary, #ff8da1)" opacity="0.5" />
            <circle cx="102" cy="82" r="4" fill="var(--md-tertiary, #ff8da1)" opacity="0.5" />
            <path d="M77 84 Q80 87 83 84" stroke="var(--md-on-surface, #ffffff)" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Floating Checklist Clip */}
            <g transform="translate(108, 48) rotate(12)">
              <rect width="22" height="28" rx="4" fill="var(--md-surface-container-highest, #36343b)" stroke="var(--md-primary, #b51a55)" strokeWidth="1.5" />
              <line x1="5" y1="8" x2="17" y2="8" stroke="var(--md-primary, #ffb0cd)" strokeWidth="2" strokeLinecap="round" />
              <line x1="5" y1="14" x2="14" y2="14" stroke="var(--md-outline, #938f99)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="5" y1="20" x2="16" y2="20" stroke="var(--md-outline, #938f99)" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* Variant 3: Habits Fresh (Heroic Flame Streak Badge) */}
        {variant === 'habits-fresh' && (
          <g>
            <circle cx="67" cy="72" r="5.5" fill="var(--md-on-surface, #ffffff)" />
            <circle cx="69" cy="70" r="2" fill="#ffffff" />
            <circle cx="93" cy="72" r="5.5" fill="var(--md-on-surface, #ffffff)" />
            <circle cx="95" cy="70" r="2" fill="#ffffff" />
            <path d="M75 82 Q80 88 85 82" stroke="var(--md-primary, #b51a55)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Glowing Flame Orb in Hands */}
            <g transform="translate(62, 88)">
              <circle cx="18" cy="16" r="14" fill="#ff7a00" opacity="0.25" />
              <path
                d="M18 4 C22 10 26 14 26 20 C26 25 22 28 18 28 C14 28 10 25 10 20 C10 15 15 10 18 4 Z"
                fill="url(#gold-flame)"
              />
              <path
                d="M18 12 C20 15 22 18 22 21 C22 24 20 26 18 26 C16 26 14 24 14 21 C14 18 16 15 18 12 Z"
                fill="#ffffff"
                opacity="0.8"
              />
            </g>

            {/* Sparks */}
            <circle cx="38" cy="62" r="2.5" fill="#ffb800" />
            <circle cx="122" cy="56" r="3" fill="#ff7a00" />
          </g>
        )}

        {/* Variant 4: Finance Calm (Golden Coin Bubble & Peaceful Expression) */}
        {variant === 'finance-calm' && (
          <g>
            {/* Satisfied Content Eyes */}
            <path d="M63 75 Q70 69 77 75" stroke="var(--md-primary, #ffffff)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M83 75 Q90 69 97 75" stroke="var(--md-primary, #ffffff)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="58" cy="82" r="4" fill="var(--md-tertiary, #ff8da1)" opacity="0.6" />
            <circle cx="102" cy="82" r="4" fill="var(--md-tertiary, #ff8da1)" opacity="0.6" />
            <path d="M77 83 Q80 87 83 83" stroke="var(--md-on-surface, #ffffff)" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Floating Golden Coin Bubble */}
            <g transform="translate(64, 88)">
              <circle cx="16" cy="14" r="13" fill="url(#gold-flame)" stroke="#ffffff" strokeWidth="1.5" />
              <text x="16" y="19" textAnchor="middle" fill="#523600" fontSize="13" fontWeight="bold" fontFamily="sans-serif">₹</text>
            </g>
          </g>
        )}

        {/* Variant 5: Notes Spark (Idea Quill / Creative Pencil) */}
        {variant === 'notes-spark' && (
          <g>
            <circle cx="68" cy="74" r="5" fill="var(--md-on-surface, #ffffff)" />
            <circle cx="70" cy="72" r="1.8" fill="#ffffff" />
            <circle cx="92" cy="74" r="5" fill="var(--md-on-surface, #ffffff)" />
            <circle cx="94" cy="72" r="1.8" fill="#ffffff" />
            <path d="M76 83 Q80 87 84 83" stroke="var(--md-primary, #b51a55)" strokeWidth="2.2" strokeLinecap="round" fill="none" />

            {/* Glowing Lightbulb above */}
            <g transform="translate(72, 14)">
              <circle cx="8" cy="8" r="7" fill="var(--md-tertiary, #ffb0cd)" opacity="0.9" />
              <path d="M6 15 L10 15" stroke="var(--md-outline, #938f99)" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="-2" x2="8" y2="0" stroke="var(--md-tertiary, #ffb0cd)" strokeWidth="2" strokeLinecap="round" />
              <line x1="-1" y1="4" x2="1" y2="5" stroke="var(--md-tertiary, #ffb0cd)" strokeWidth="2" strokeLinecap="round" />
              <line x1="15" y1="4" x2="17" y2="5" stroke="var(--md-tertiary, #ffb0cd)" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Magic Quill / Pen */}
            <g transform="translate(104, 76) rotate(-25)">
              <rect width="7" height="24" rx="2" fill="var(--md-primary, #b51a55)" />
              <path d="M0 24 L3.5 30 L7 24 Z" fill="var(--md-tertiary, #ffd8e4)" />
            </g>
          </g>
        )}

        {/* Variant 6: Notifications Sleep (Under Moon with Floating Z's) */}
        {variant === 'notifications-sleep' && (
          <g>
            {/* Peaceful Sleeping Eyes */}
            <path d="M63 76 Q70 81 77 76" stroke="var(--md-outline, #938f99)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M83 76 Q90 81 97 76" stroke="var(--md-outline, #938f99)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            
            {/* Crescent Moon */}
            <path
              d="M120 32 C114 32 108 36 106 42 C114 42 120 48 120 56 C124 54 128 48 128 42 C128 36 124 32 120 32 Z"
              fill="var(--md-tertiary, #ffb0cd)"
            />

            {/* Floating Sleep Z's */}
            <text x="110" y="70" fill="var(--md-primary, #b51a55)" fontSize="11" fontWeight="bold" fontFamily="sans-serif" opacity="0.85">Z</text>
            <text x="118" y="60" fill="var(--md-tertiary, #ffb0cd)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" opacity="0.7">z</text>
            <text x="124" y="52" fill="var(--md-primary-container, #ffd8e4)" fontSize="7" fontWeight="bold" fontFamily="sans-serif" opacity="0.5">z</text>
          </g>
        )}

        {/* Variant 7: Search Empty (Detective Lens) */}
        {variant === 'search-empty' && (
          <g>
            <circle cx="68" cy="74" r="5" fill="var(--md-on-surface, #ffffff)" />
            <circle cx="70" cy="72" r="1.8" fill="#ffffff" />
            <circle cx="92" cy="74" r="5" fill="var(--md-on-surface, #ffffff)" />
            <circle cx="94" cy="72" r="1.8" fill="#ffffff" />
            <path d="M77 84 Q80 82 83 84" stroke="var(--md-on-surface, #ffffff)" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Magnifying Glass */}
            <g transform="translate(98, 70) rotate(-15)">
              <circle cx="12" cy="12" r="10" stroke="var(--md-primary, #b51a55)" strokeWidth="3" fill="var(--md-primary-container, #ffd8e4)" fillOpacity="0.2" />
              <line x1="20" y1="20" x2="30" y2="30" stroke="var(--md-primary, #b51a55)" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>
      </motion.div>
    </div>
  );
};
