import React from 'react';
import { Violation } from '../compliance/complianceChecker';

interface Props {
  hudText: string;
  violations: Violation[];
  onShowMaterials: () => void;
}

export function Hud({ hudText, violations, onShowMaterials }: Props) {
  if (!hudText) return null;

  return (
    <div className="absolute bottom-10 left-4 z-20 flex flex-col gap-2">
      <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-mono">
        {hudText}
      </div>
      {violations.length > 0 && (
        <div className="bg-red-900/80 text-red-300 px-4 py-2 rounded-lg text-xs">
          ⚠ {violations.length} code violation{violations.length > 1 ? 's' : ''}
        </div>
      )}
      <button
        onClick={onShowMaterials}
        className="bg-blue-600/80 text-white px-4 py-2 rounded-lg text-xs hover:bg-blue-600 transition"
      >
        Show Materials
      </button>
    </div>
  );
}
