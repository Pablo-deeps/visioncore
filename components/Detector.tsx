import React, { useRef, useEffect, useState, useCallback } from 'react';
import { detectionService } from '../services/detectionService';
import { DetectedObject, DetectionStats, CameraMode } from '../types';
import { Loader2 } from 'lucide-react';

interface DetectorProps {
  cameraMode: CameraMode;
  onStatsUpdate: (stats: DetectionStats) => void;
  onError: (error: string) => void;
}

const Detector: React.FC<DetectorProps> = ({ cameraMode, onStatsUpdate, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Refs for loop management (prevents closure staleness)
  const requestRef = useRef<number>();
  const isDetectingRef = useRef<boolean>(false);
  const predictionsRef = useRef<DetectedObject[]>([]);
  
  // Performance stats refs
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(0);

  // 1. Initialize Model
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await detectionService.loadModel();
        if (mounted) setIsModelLoaded(true);
      } catch (err) {
        if (mounted) onError("Failed to load AI model. Check connection.");
      }
    };
    init();
    return () => { mounted = false; };
  }, [onError]);

  // 2. Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      setIsVideoReady(false);
      // Reset predictions on camera switch
      predictionsRef.current = []; 

      try {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(t => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: cameraMode,
            width: { ideal: 1280 }, // Request HD
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for data before declaring ready
          videoRef.current.onloadeddata = () => {
            setIsVideoReady(true);
            videoRef.current?.play().catch(e => console.error("Play error:", e));
          };
        }
      } catch (err) {
        console.error(err);
        onError("Camera access denied or unavailable.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [cameraMode, onError]);

  // 3. The Combined Render & Inference Loop
  const renderLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Safety checks
    if (!video || !canvas || !isModelLoaded || !isVideoReady || video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    // --- A. RESIZE LOGIC ---
    // Ensure canvas internal resolution matches video source resolution 1:1.
    // CSS handles the display size (object-fit: cover).
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // CRITICAL FIX: Do NOT use { alpha: false }. We need transparency to see the video underneath.
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- B. FPS CALCULATION ---
    const now = performance.now();
    frameCountRef.current++;
    if (now - lastFpsTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current));
      
      // Update stats based on *current* detection state
      const counts: Record<string, number> = {};
      predictionsRef.current.forEach(p => {
        counts[p.class] = (counts[p.class] || 0) + 1;
      });
      
      onStatsUpdate({
        fps,
        objectCounts: counts,
        totalObjects: predictionsRef.current.length
      });

      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    // --- C. INFERENCE TRIGGER (Non-Blocking) ---
    if (!isDetectingRef.current) {
      isDetectingRef.current = true;
      detectionService.detect(video)
        .then(results => {
          predictionsRef.current = results;
          isDetectingRef.current = false;
        })
        .catch(e => {
          console.error("Detection failed", e);
          isDetectingRef.current = false;
        });
    }

    // --- D. RENDER CANVAS ---
    // Clear previous frame to transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictionsRef.current.forEach(prediction => {
      const [x, y, w, h] = prediction.bbox;
      const score = Math.round(prediction.score * 100);
      const label = `${prediction.class.toUpperCase()} ${score}%`;
      const color = getNeonColor(prediction.class);

      // Draw Box
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.rect(x, y, w, h);
      ctx.stroke();

      // Draw Label Background
      ctx.font = 'bold 24px "Courier New", monospace';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 24;
      const padding = 6;

      ctx.fillStyle = color;
      ctx.fillRect(x, y - textHeight - (padding * 2), textWidth + (padding * 2), textHeight + (padding * 2));

      // Draw Label Text
      ctx.fillStyle = '#000000';
      ctx.fillText(label, x + padding, y - padding);
    });

    requestRef.current = requestAnimationFrame(renderLoop);
  }, [isModelLoaded, isVideoReady, onStatsUpdate]);

  // Start the loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [renderLoop]);

  const getNeonColor = (label: string): string => {
    switch (label) {
      case 'person': return '#00FFFF'; // Cyan
      case 'dog': 
      case 'cat': return '#FF00FF'; // Magenta
      case 'car': return '#FFFF00'; // Yellow
      default: return '#00FF00'; // Lime Green
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center rounded-2xl shadow-2xl ring-1 ring-zinc-800">
      
      {/* Loading Overlay */}
      {(!isVideoReady || !isModelLoaded) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-100">
           <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-500" />
           <p className="text-lg font-mono animate-pulse">
             {!isModelLoaded ? 'LOADING NEURAL NETWORK...' : 'INITIALIZING CAMERA...'}
           </p>
        </div>
      )}

      {/* Video layer */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: cameraMode === 'user' ? 'scaleX(-1)' : 'none' }} 
      />
      
      {/* Canvas layer (Overlay) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ transform: cameraMode === 'user' ? 'scaleX(-1)' : 'none' }}
      />
    </div>
  );
};

export default Detector;