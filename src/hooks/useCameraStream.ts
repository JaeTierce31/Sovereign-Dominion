import { useEffect, useState } from 'react';

export function useCameraStream(): MediaStream | null {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    }).then(s => {
      if (active) setStream(s);
    }).catch(err => {
      console.warn('Camera unavailable:', err);
    });

    return () => {
      active = false;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return stream;
}
