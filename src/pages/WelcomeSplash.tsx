import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { AnimatedSparkles } from '../components/AnimatedIcons';

interface WelcomeSplashProps {
  user: User;
  onDone: () => void;
}

export default function WelcomeSplash({ user, onDone }: WelcomeSplashProps) {
  const [phase, setPhase] = useState<'namaste' | 'welcome' | 'done'>('namaste');

  const firstName = user.displayName?.split(' ')[0] || 'there';

  const h = new Date().getHours();
  const timeGreet = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    // Show namaste animation for 1.2s, then welcome for 1.8s, then enter app
    const t1 = setTimeout(() => setPhase('welcome'), 1200);
    const t2 = setTimeout(() => setPhase('done'), 3000);
    const t3 = setTimeout(() => onDone(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-bg-light dark:bg-bg-dark flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">

        {/* Phase 1: Namaste Hands */}
        {phase === 'namaste' && (
          <motion.div
            key="namaste"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              className="flex justify-center mb-6 text-accent"
            >
              <AnimatedSparkles size={72} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-2xl font-bold text-text-light dark:text-text-dark"
            >
              Namaste
            </motion.p>
          </motion.div>
        )}

        {/* Phase 2: Welcome user */}
        {phase === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center px-6"
          >
            {/* Logo */}
            <motion.img
              src="/icon-512.jpg"
              alt="LifeOS"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-20 h-20 rounded-2xl shadow-xl mx-auto mb-5"
            />

            {/* Greeting */}
            <p className="text-sm font-medium text-text-light/50 dark:text-text-dark/50 mb-1 uppercase tracking-widest">
              {timeGreet}
            </p>
            <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">
              {firstName}!
            </h1>
            <p className="text-text-light/60 dark:text-text-dark/60">
              Welcome back to LifeOS 🚀
            </p>

            {/* Animated dots */}
            <div className="flex justify-center gap-2 mt-8">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
