import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.avineesh.lifeos',
  appName: 'LifeOS',
  webDir: 'dist',
  server: {
    url: 'https://lifeos-gujjeti-avineeshs-projects.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['lifeos-gujjeti-avineeshs-projects.vercel.app']
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '527411007566-7gburgck4bkde6pevhn6in759lmr0cg2.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
