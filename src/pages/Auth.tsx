import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GlassSurface } from '../ui/glass/GlassSurface';
import { Button } from '../ui/controls/Button';
import { SpinnerGap, ShieldCheck } from '../ui/tokens/icons';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '527411007566-7gburgck4bkde6pevhn6in759lmr0cg2.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      }).catch((err) => console.warn('GoogleAuth init warning:', err));
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
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
      console.warn('Sign-in error:', err);
      if (
        err.code !== 'auth/popup-closed-by-user' &&
        !err.message?.includes('canceled') &&
        !err.message?.includes('cancelled')
      ) {
        setError('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-[#0A84FF]/30">
      {/* Subtle Atmospheric Glass Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#0A84FF]/20 via-[#BF5AF2]/20 to-[#FF375F]/20 blur-3xl pointer-events-none" />

      {/* Top Branding */}
      <div className="relative z-10 flex flex-col items-center text-center mb-8 w-full max-w-sm">
        <div className="w-20 h-20 rounded-[24px] bg-[#1C1C1E] border border-white/12 flex items-center justify-center shadow-2xl mb-4 p-3.5">
          <img
            src="/icon-monochrome.svg"
            alt="LifeOS Logo"
            className="w-full h-full object-contain invert"
          />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
          LifeOS
        </h1>
        <p className="text-white/60 font-medium text-xs mt-1">
          Your personal life operating system
        </p>
      </div>

      {/* Sign In Glass Card */}
      <div className="w-full max-w-sm relative z-10">
        <GlassSurface className="p-7 rounded-[32px] border border-white/12 shadow-2xl flex flex-col items-center text-center">
          <h2 className="text-xl font-bold text-white mb-2">Welcome</h2>
          <p className="text-white/60 text-xs leading-relaxed mb-6">
            Sign in with Google to securely sync your routines, tasks, and history across all your devices.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-300 text-xs w-full text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center gap-3 active:scale-95 transition-transform cursor-pointer shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <SpinnerGap size={20} className="animate-spin text-black" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck size={14} weight="bold" className="text-emerald-400" />
            <span>End-to-end encrypted partition</span>
          </div>
        </GlassSurface>
      </div>
    </div>
  );
}
