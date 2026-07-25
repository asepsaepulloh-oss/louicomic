import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.louicomic.app',
  appName: 'LouiComic',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      '*.clerk.com',
      '*.clerk.accounts.dev',
      'clerk.comic.louiv.me',
      'comic.louiv.me',
      '*.google.com',
      '*.googleusercontent.com',
      '*.github.com'
    ]
  }
};

export default config;

