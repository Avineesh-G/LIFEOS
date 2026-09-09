import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.avineesh.lifeos',
  appName: 'LifeOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
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
