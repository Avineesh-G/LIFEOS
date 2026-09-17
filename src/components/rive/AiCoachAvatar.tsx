import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Sparkles } from 'lucide-react';
import LifeOSRive from './LifeOSRive';
import { useRiveController } from '../../hooks/useRiveController';

export interface AiCoachAvatarProps {
  state?: 'idle' | 'thinking' | 'speaking' | 'success';
  size?: number;
  className?: string;
}

/**
 * Premium Interactive AI Coach Avatar (Zero-Emoji).
 * Uses Rive WebGL state machine with a gorgeous procedural fallback.
 */
export default function AiCoachAvatar({
  state = 'idle',
  size = 48,
  className = '',
}: AiCoachAvatarProps) {
  const { onRiveReady, setBoolean, fireTrigger } = useRiveController('Avatar_State_Machine');

  useEffect(() => {
    if (state === 'thinking') {
      setBoolean('isThinking', true);
      setBoolean('isSpeaking', false);
    } else if (state === 'speaking') {
      setBoolean('isThinking', false);
      setBoolean('isSpeaking', true);
    } else if (state === 'success') {
      setBoolean('isThinking', false);
      setBoolean('isSpeaking', false);
      fireTrigger('triggerSuccess');
    } else {
      setBoolean('isThinking', false);
      setBoolean('isSpeaking', false);
    }
  }, [state, setBoolean, fireTrigger]);

  // High-End Procedural Fallback (Zero Emojis, pure vector glass orb)
  const fallbackOrb = (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-accent/20 via-purple-500/15 to-transparent border border-accent/30 shadow-lg shadow-accent/15"
    >
      {/* Outer Glow Halo */}
      <div className={`absolute inset-0 rounded-2xl bg-accent/10 blur-md ${state === 'thinking' ? 'animate-ping opacity-30' : ''}`} />

      {/* Internal Core */}
      <div className="relative z-10 flex items-center justify-center text-accent">
        {state === 'thinking' ? (
          <Sparkles size={size * 0.45} className="animate-spin text-accent" />
        ) : (
          <Cpu size={size * 0.45} className="text-accent" />
        )}
      </div>
    </div>
  );

  const activeAnimation = state === 'thinking' ? 'vapor_3' : state === 'speaking' ? 'vapor_2' : 'vapor_1';

  return (
    <div style={{ width: size, height: size }} className={`relative shrink-0 ${className}`}>
      <LifeOSRive
        src="/animations/ai_avatar.riv"
        artboard="MainArtboard"
        animations={activeAnimation}
        onRiveReady={onRiveReady}
        fallback={fallbackOrb}
      />
    </div>
  );
}
