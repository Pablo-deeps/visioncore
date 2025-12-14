import React, { useState, useCallback } from 'react';
import Detector from './components/Detector';
import StatsPanel from './components/StatsPanel';
import CameraControls from './components/CameraControls';
import { DetectionStats, CameraMode } from './types';
import { AlertCircle, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [cameraMode, setCameraMode] = useState<CameraMode>('user');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DetectionStats>({
    fps: 0,
    objectCounts: {},
    totalObjects: 0
  });

  const toggleCamera = useCallback(() => {
    setCameraMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-white/20">
      {/* Navbar / Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-black fill-current" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">
            Vision<span className="text-zinc-400 font-normal">Core</span>
          </h1>
        </div>
        
        <div className="hidden sm:block">
           <CameraControls currentMode={cameraMode} onToggle={toggleCamera} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-[100dvh] flex flex-col lg:flex-row gap-6">
        
        {/* Error Banner */}
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl backdrop-blur">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:text-white">×</button>
          </div>
        )}

        {/* Video Viewport */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-0 flex flex-col">
          <div className="flex-1 relative">
            <Detector 
              cameraMode={cameraMode} 
              onStatsUpdate={setStats}
              onError={setError}
            />
          </div>
          
          {/* Mobile Camera Switch (Visible only on small screens) */}
          <div className="sm:hidden absolute bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
             <div className="pointer-events-auto">
                <CameraControls currentMode={cameraMode} onToggle={toggleCamera} />
             </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <aside className="lg:w-80 flex flex-col gap-4">
          <StatsPanel stats={stats} />
          
          {/* Info Card */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-xs text-zinc-500 space-y-2">
            <h4 className="text-zinc-400 font-semibold mb-1">System Status</h4>
            <div className="flex justify-between">
              <span>Engine</span>
              <span className="text-zinc-300">TensorFlow.js (WebGL)</span>
            </div>
            <div className="flex justify-between">
              <span>Model</span>
              <span className="text-zinc-300">COCO-SSD MobileNet v2</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution</span>
              <span className="text-zinc-300">High Definition</span>
            </div>
            <p className="pt-2 border-t border-zinc-800/50 leading-relaxed">
              Detections are performed locally on your device GPU. No video data is sent to any server.
            </p>
          </div>
        </aside>

      </main>
    </div>
  );
};

export default App;