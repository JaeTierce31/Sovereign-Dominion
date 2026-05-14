import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sovereign.dominion',
  appName: 'Sovereign Dominion',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Camera: { usageDescription: 'Required for AR design and spatial scanning' },
    PushNotifications: { presentationOptions: ['alert', 'badge', 'sound'] },
  },
};

export default config;
