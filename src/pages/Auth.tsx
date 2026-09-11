import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '527411007566-7gburgck4bkde6pevhn6in759lmr0cg2.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      }).catch(err => console.warn('GoogleAuth init warning:', err));
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setUnauthorizedDomain(false);
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.initialize({
          clientId: '527411007566-7gburgck4bkde6pevhn6in759lmr0cg2.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: false,
        });
        await GoogleAuth.signOut().catch(() => {});
        const googleUser: any = await GoogleAuth.signIn();
        const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
        if (!idToken) {
          throw new Error('Google Sign-In did not return an ID token.');
        }
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomain(true);
      } else if (err.code !== 'auth/popup-closed-by-user' && err.message !== 'The user canceled the sign-in flow.') {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(window.location.hostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-light dark:bg-bg-dark p-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col items-center text-center mb-10 w-full max-w-sm">
        <div className="w-20 h-20 rounded-[22px] bg-surface-light dark:bg-surface-dark border border-border-light/80 dark:border-border-dark/80 flex items-center justify-center shadow-m3-subtle mb-5 p-3.5">
          <img src="/icon-monochrome.svg" alt="LifeOS Logo" className="w-full h-full object-contain dark:invert" />
        </div>
        <h1 className="text-4xl font-black text-primary-light dark:text-primary-dark mb-2 tracking-tight font-sans">
          LifeOS
        </h1>
        <p className="text-secondary-light dark:text-secondary-dark font-medium text-sm">
          Your personal life operating system
        </p>
      </div>

      <div className="w-full max-w-sm relative z-10">
        
        {/* Main Card */}
        <div className="card p-7 sm:p-8 shadow-m3-subtle mb-4">
          
          <h2 className="text-2xl font-black text-primary-light dark:text-primary-dark mb-3 font-sans">
            Get started
          </h2>
          
          <p className="text-secondary-light dark:text-secondary-dark text-sm leading-relaxed mb-6">
            Sign in with your Google account to seamlessly sync your gym, study, tasks, and nutrition across all your devices.
          </p>

          {/* Unauthorized Domain Error Notice */}
          {unauthorizedDomain && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-[20px] text-amber-900 dark:text-amber-200 text-xs space-y-2.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <span>⚠️</span> Domain Not Authorized in Firebase
              </div>
              <p className="leading-relaxed opacity-90">
                To sign in on the web, please add this domain to your Firebase Authorized Domains:
              </p>
              <div className="flex items-center justify-between gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 font-mono text-[11px] select-all">
                <span className="truncate">{typeof window !== 'undefined' ? window.location.hostname : 'lifeos-gujjeti-avineeshs-projects.vercel.app'}</span>
                <button
                  onClick={handleCopyDomain}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-sans font-bold text-[10px] hover:opacity-90 active:scale-95 shrink-0 shadow-sm"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <a
                href="https://console.firebase.google.com/project/lifeos-f4de3/authentication/settings"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-accent hover:underline text-[11px] pt-0.5"
              >
                Open Firebase Console &rarr;
              </a>
            </div>
          )}

          {/* Generic Error */}
          {error && !unauthorizedDomain && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-[18px] text-red-600 dark:text-red-400 text-xs text-center font-bold">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-primary-light dark:bg-primary-dark hover:opacity-90 text-primary-dark dark:text-primary-light rounded-full px-5 py-3.5 font-bold text-sm transition-all disabled:opacity-50 active:scale-[0.97] shadow-sm font-sans"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-dark/30 dark:border-primary-light/30 border-t-primary-dark dark:border-t-primary-light rounded-full animate-spin" />
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

          <p className="mt-6 text-center text-xs text-muted-light dark:text-muted-dark leading-relaxed font-mono">
            A Google account is required to use LifeOS.<br/>
            Your data is stored securely in your private cloud partition.
          </p>
        </div>
      </div>
    </div>
  );
}
