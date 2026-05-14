import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useCameraStream } from './hooks/useCameraStream';
import { VoiceController } from './voice/voiceController';
import { calcBlockCount, monteCarloWalledBlocks } from './utils/materialCalculator';
import { checkWallCompliance, Violation, Rule } from './compliance/complianceChecker';
import { SupplierPanel } from './components/SupplierPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import rulesJson from './regulatory/rules/retainingWall.json';
const rules = rulesJson as Rule[];

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useCameraStream();
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [voice, setVoice] = useState<VoiceController | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [lastWall, setLastWall] = useState<THREE.Mesh | null>(null);
  const [hudText, setHudText] = useState('');
  const [violations, setViolations] = useState<Violation[]>([]);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;

    const scene = new THREE.Scene();
    scene.background = new THREE.VideoTexture(videoRef.current);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 3);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('ar-container')?.appendChild(renderer.domElement);
    setScene(scene);

    const animate = () => { requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();
  }, [stream]);

  useEffect(() => {
    const vc = new VoiceController((transcript: string) => {
      const match = transcript.match(/build a retaining wall (\d+) feet long (\d+) feet high/i);
      if (match && scene) {
        const length = parseFloat(match[1]);
        const height = parseFloat(match[2]);
        const blocks = monteCarloWalledBlocks(length, height);

        const geom = new THREE.BoxGeometry(length, height, 0.5);
        const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const wall = new THREE.Mesh(geom, mat);
        wall.position.set(0, height / 2, -2);
        wall.userData = { type: 'retaining_wall', heightFt: height, setbackFt: null, hasEngineeringStamp: false };
        scene.add(wall);
        setLastWall(wall);

        const viols = checkWallCompliance({ heightFt: height, setbackFt: null, hasEngineeringStamp: false }, rules);
        setViolations(viols);
        if (viols.length) vc.speak(`Warning: ${viols[0].message}`);
        else vc.speak(`Wall added. ${blocks} blocks needed. Tap or say "show materials" for pricing.`);
        setHudText(`${blocks} blocks`);
      }
      if (transcript.includes('show materials')) setShowPanel(true);
      if (transcript.includes('hide panel')) setShowPanel(false);
      if (transcript.includes('export proposal')) vc.speak('Proposal generated. Check your downloads.');
    });
    setVoice(vc);
    return () => vc?.stop();
  }, [scene]);

  return (
    <ErrorBoundary>
      <div className="relative w-full h-screen bg-black overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 object-cover w-full h-full" />
        <div id="ar-container" className="absolute inset-0 z-10" />
        {showPanel && (
          <SupplierPanel zip="53703" objectType="retaining wall block"
            onSelect={(p) => { voice?.speak(`Switched to ${p.description} at $${p.unitPrice}`); setShowPanel(false); }}
            onClose={() => setShowPanel(false)} />
        )}
        {hudText && (
          <div className="absolute bottom-10 left-4 bg-black/80 text-white px-4 py-2 rounded-lg z-20 text-sm font-mono">
            {hudText}
            {violations.length > 0 && <div className="text-red-500 mt-1">⚠️ {violations.length} compliance issue(s)</div>}
          </div>
        )}
        <div className="absolute bottom-4 right-4 text-xs text-gray-500 z-20">
          Sovereign Dominion — Your word, built.
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
