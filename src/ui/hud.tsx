import React from 'react';

interface HudProps {
  text?: string;
  violations?: number;
  fps?: number;
  gpsAccuracy?: number;
}

export function HudOverlay({ text, violations, fps, gpsAccuracy }: HudProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {fps !== undefined && (
        <div className="absolute top-4 left-4 text-xs text-green-400 font-mono bg-black/50 px-2 py-1 rounded">
          {fps} fps
        </div>
      )}
      {gpsAccuracy !== undefined && (
        <div className="absolute top-4 right-4 text-xs text-blue-400 font-mono bg-black/50 px-2 py-1 rounded">
          GPS ±{gpsAccuracy.toFixed(2)}m
        </div>
      )}
      {text && (
        <div className="absolute bottom-20 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-mono max-w-xs">
          {text}
        </div>
      )}
      {violations !== undefined && violations > 0 && (
        <div className="absolute bottom-32 left-4 bg-red-900/80 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-xs max-w-xs">
          ⚠ {violations} code violation{violations > 1 ? 's' : ''} detected
        </div>
      )}
      <div className="absolute bottom-4 right-4 text-xs text-gray-600">
        Sovereign Dominion
      </div>
    </div>
  );
}
