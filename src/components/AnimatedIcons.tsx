import React from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Dumbbell, 
  Zap, 
  Sparkles, 
  User, 
  Activity, 
  CheckCircle2, 
  HeartPulse, 
  Wallet,
  Coffee,
  Moon,
  Trophy,
  ShieldCheck,
  Target,
  Calendar
} from 'lucide-react';

interface AnimatedIconProps {
  className?: string;
  size?: number;
}

export function AnimatedFlame({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1.15, 1], rotate: [-2, 2, -2] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className={`text-orange-500 flex items-center justify-center ${className}`}
    >
      <Flame size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedDumbbell({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ rotate: [-10, 10, -10] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      className={`text-indigo-500 flex items-center justify-center ${className}`}
    >
      <Dumbbell size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedZap({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ opacity: [1, 0.5, 1], scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className={`text-amber-500 flex items-center justify-center ${className}`}
    >
      <Zap size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedSparkles({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      className={`text-purple-500 flex items-center justify-center ${className}`}
    >
      <Sparkles size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedUser({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ y: [-2, 2, -2] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className={`text-sky-500 flex items-center justify-center ${className}`}
    >
      <User size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedActivity({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      className={`text-rose-500 flex items-center justify-center ${className}`}
    >
      <Activity size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedHeartPulse({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1.2, 1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", times: [0, 0.2, 0.4, 0.6, 1] }}
      className={`text-red-500 flex items-center justify-center ${className}`}
    >
      <HeartPulse size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedWallet({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ y: [-2, 2, -2], rotate: [-2, 2, -2] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      className={`text-emerald-500 flex items-center justify-center ${className}`}
    >
      <Wallet size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedMoon({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ rotate: [-5, 5, -5] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      className={`text-blue-400 flex items-center justify-center ${className}`}
    >
      <Moon size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedTrophy({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className={`text-yellow-500 flex items-center justify-center ${className}`}
    >
      <Trophy size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedTarget({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      className={`text-emerald-500 flex items-center justify-center ${className}`}
    >
      <Target size={size} strokeWidth={2.5} />
    </motion.div>
  );
}

export function AnimatedCalendar({ className, size = 20 }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      className={`text-indigo-500 flex items-center justify-center ${className}`}
    >
      <Calendar size={size} strokeWidth={2.5} />
    </motion.div>
  );
}


/** 
 * Maps a string key to one of the animated components. 
 * Used for dynamically rendering AI-returned icon keys.
 */
export function DynamicAnimatedIcon({ iconKey, className, size = 20 }: { iconKey: string } & AnimatedIconProps) {
  switch (iconKey.toLowerCase()) {
    case 'flame': return <AnimatedFlame className={className} size={size} />;
    case 'dumbbell': return <AnimatedDumbbell className={className} size={size} />;
    case 'zap': return <AnimatedZap className={className} size={size} />;
    case 'sparkles': return <AnimatedSparkles className={className} size={size} />;
    case 'user': return <AnimatedUser className={className} size={size} />;
    case 'activity': return <AnimatedActivity className={className} size={size} />;
    case 'heart': return <AnimatedHeartPulse className={className} size={size} />;
    case 'wallet': return <AnimatedWallet className={className} size={size} />;
    case 'moon': return <AnimatedMoon className={className} size={size} />;
    case 'trophy': return <AnimatedTrophy className={className} size={size} />;
    case 'target': return <AnimatedTarget className={className} size={size} />;
    default: return <AnimatedActivity className={className} size={size} />; // fallback
  }
}
