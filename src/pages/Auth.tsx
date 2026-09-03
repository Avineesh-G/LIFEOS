import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useState } from 'react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-bg-light dark:bg-bg-dark p-4">
      
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        
        <div className="bg-white/40 dark:bg-surface-dark/40 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-accent blur-xl opacity-40 rounded-3xl" />
              <img src="/icon-512.png" alt="LifeOS" className="w-24 h-24 rounded-3xl shadow-xl relative z-10" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-text-light dark:text-text-dark mb-2 tracking-tight">
              LifeOS
            </h1>
            <p className="text-text-light/60 dark:text-text-dark/60 text-sm">
              Your personal life operating system
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-border-light dark:border-border-dark rounded-2xl px-5 py-4 text-text-light dark:text-text-dark font-medium shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50 backdrop-blur-md group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Authenticating...' : 'Continue with Google'}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-text-light/40 dark:text-text-dark/40">
          Your data is securely stored and only accessible to you.
        </p>
      </div>
    </div>
  );
}
