export interface RTKFix {
  lat: number;
  lng: number;
  altitude: number;
  accuracy: number;
  fixType: 'float' | 'fixed' | 'single';
  satellites: number;
  timestamp: number;
}

export class RTKReceiver {
  private onFix: (fix: RTKFix) => void;
  private watchId: number | null = null;

  constructor(onFix: (fix: RTKFix) => void) {
    this.onFix = onFix;
  }

  start() {
    if (!navigator.geolocation) {
      console.warn('Geolocation not available');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.onFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          altitude: pos.coords.altitude ?? 0,
          accuracy: pos.coords.accuracy,
          fixType: pos.coords.accuracy < 0.02 ? 'fixed' : pos.coords.accuracy < 1 ? 'float' : 'single',
          satellites: 0,
          timestamp: pos.timestamp,
        });
      },
      (err) => console.error('RTK error:', err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
