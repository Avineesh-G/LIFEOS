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
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-light dark:bg-bg-dark p-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col items-center text-center mb-10 w-full max-w-sm">
        <img src="/icon-512.png" alt="LifeOS Logo" className="w-20 h-20 rounded-3xl shadow-sm mb-5" />
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark mb-2 tracking-tight">
          LifeOS
        </h1>
        <p className="text-secondary-light dark:text-secondary-dark font-medium">
          Your personal life operating system
        </p>
      </div>

      <div className="w-full max-w-sm relative z-10">
        
        {/* Main Card */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[24px] p-7 shadow-sm mb-4">
          
          <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">
            Get started
          </h2>
          
          <p className="text-secondary-light dark:text-secondary-dark text-[15px] leading-relaxed mb-6">
            Sign in with your Google account to seamlessly sync your gym, study, and nutrition data across all your devices.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#1A1A1A] dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black rounded-xl px-5 py-3.5 font-medium transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Authenticating...' : 'Continue with Google'}
          </button>

          <p className="mt-6 text-center text-[13px] text-muted-light dark:text-muted-dark leading-relaxed">
            A Google account is required to use LifeOS.<br/>
            No guest access — your data stays safe in your account.
          </p>
        </div>
      </div>
    </div>
  );
}
