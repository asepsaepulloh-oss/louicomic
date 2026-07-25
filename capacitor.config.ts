import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.louicomic.app',
  appName: 'LouiComic',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
