import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.avineesh.lifeos',
  appName: 'LifeOS',
  webDir: 'dist',
  server: {
    url: 'https://lifeos-gujjeti-avineeshs-projects.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '527411007566-7gburgck4bkde6pevhn6in759lmr0cg2.apps.googleusercontent.com',
      clientId: '527411007566-7gburgck4bkde6pevhn6in759lmr0cg2.apps.googleusercontent.com',
      forceCodeForRefreshToken: false
    }
  }
};

export default config;
