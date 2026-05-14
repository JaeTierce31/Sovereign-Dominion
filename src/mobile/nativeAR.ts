import { Capacitor } from '@capacitor/core';

export interface ARPlane {
  id: string;
  center: { x: number; y: number; z: number };
  extent: { width: number; height: number };
  normal: { x: number; y: number; z: number };
}

export async function startARSession(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('AR only available on native platforms');
    return false;
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'ios') {
    return startARKit();
  } else if (platform === 'android') {
    return startARCore();
  }
  return false;
}

async function startARKit(): Promise<boolean> {
  try {
    const { registerPlugin } = await import('@capacitor/core');
    const ARKitPlugin = registerPlugin<any>('ARKit');
    await ARKitPlugin.startSession({ planeDetection: 'horizontal' });
    return true;
  } catch (e) {
    console.error('ARKit error:', e);
    return false;
  }
}

async function startARCore(): Promise<boolean> {
  try {
    const { registerPlugin } = await import('@capacitor/core');
    const ARCorePlugin = registerPlugin<any>('ARCore');
    await ARCorePlugin.startSession();
    return true;
  } catch (e) {
    console.error('ARCore error:', e);
    return false;
  }
}
