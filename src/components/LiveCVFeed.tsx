import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ParkingSlot } from '../types/parking';
import { Camera, Sliders, Eye, RefreshCw, Radio, Sparkles } from 'lucide-react';

interface LiveCVFeedProps {
  slots: ParkingSlot[];
  onUpdateSlotPixelCount: (slotId: string, count: number, isOccupied: boolean) => void;
  onBatchUpdateSlots: (updates: { slot_id: string; is_occupied: boolean; pixel_count: number }[]) => void;
}

type CVFilterMode = 'normal' | 'grayscale' | 'blur' | 'threshold';

export const LiveCVFeed: React.FC<LiveCVFeedProps> = ({
  slots,
  onUpdateSlotPixelCount,
  onBatchUpdateSlots,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [filterMode, setFilterMode] = useState<CVFilterMode>('normal');
  const [thresholdLimit, setThresholdLimit] = useState<number>(850);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'mall-deck' | 'college-campus' | 'covered-garage'>('mall-deck');

  // Animation frame loop reference
  const animFrameId = useRef<number | null>(null);
  const simStepRef = useRef<number>(0);

  // Setup webcam stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useWebcam) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 700, height: 460 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
          setWebcamError(null);
        })
        .catch((err) => {
          console.warn('Webcam access error:', err);
          setWebcamError('Unable to access local camera (permission denied or no camera). Using simulated feed.');
          setUseWebcam(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam]);

  // Main Canvas Rendering & Computer Vision Simulation Loop
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    simStepRef.current += 1;
    const step = simStepRef.current;

    // 1. Draw base parking scene
    if (useWebcam && videoRef.current && videoRef.current.readyState >= 2) {
      // Draw actual webcam feed
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else {
      // Render simulated realistic camera feed
      // Asphalt ground
      const asphaltGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (cameraPreset === 'mall-deck') {
        asphaltGrad.addColorStop(0, '#1e2530');
        asphaltGrad.addColorStop(1, '#111827');
      } else if (cameraPreset === 'college-campus') {
        asphaltGrad.addColorStop(0, '#1c2826');
        asphaltGrad.addColorStop(1, '#0f172a');
      } else {
        asphaltGrad.addColorStop(0, '#181b22');
        asphaltGrad.addColorStop(1, '#0b0f19');
      }
      ctx.fillStyle = asphaltGrad;
      ctx.fillRect(0, 0, width, height);

      // Lane separator markings (dashed yellow / white)
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(30, height / 2);
      ctx.lineTo(width - 30, height / 2);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Parking bay lines
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;

      // Draw each slot bay & vehicle if occupied
      slots.forEach((slot, index) => {
        // Map slot coordinate to canvas size
        const col = index % 5;
        const row = Math.floor(index / 5);
        const slotX = 50 + col * 120;
        const slotY = 40 + row * 100;
        const slotW = 100;
        const slotH = 75;

        // Draw bay white guidelines
        ctx.strokeRect(slotX, slotY, slotW, slotH);

        // If slot is occupied, draw vehicle with reflections
        if (slot.isOccupied) {
          ctx.fillStyle = slot.vehicleColor || '#3b82f6';
          const carPadX = 14;
          const carPadY = 10;
          const carW = slotW - carPadX * 2;
          const carH = slotH - carPadY * 2;

          // Car body
          ctx.beginPath();
          ctx.roundRect(slotX + carPadX, slotY + carPadY, carW, carH, 6);
          ctx.fill();

          // Windshield & rear window (darker)
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(slotX + carPadX + 8, slotY + carPadY + 6, carW - 16, 8);
          ctx.fillRect(slotX + carPadX + 8, slotY + carPadY + carH - 14, carW - 16, 7);

          // Roof highlight
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(slotX + carPadX + 12, slotY + carPadY + 16, carW - 24, carH - 32);

          // Headlights / Taillights
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(slotX + carPadX + 4, slotY + carPadY + carH - 3, 6, 2);
          ctx.fillRect(slotX + carPadX + carW - 10, slotY + carPadY + carH - 3, 6, 2);
        } else {
          // Subtle empty pavement grain
          ctx.fillStyle = 'rgba(255,255,255,0.02)';
          ctx.fillRect(slotX + 10, slotY + 10, slotW - 20, slotH - 20);
        }
      });

      // Subtle moving pedestrian or driving car on lane for visual realism
      const carDriveX = (step * 2) % (width + 120) - 60;
      if (carDriveX > -50 && carDriveX < width + 50) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.roundRect(carDriveX, height / 2 - 14, 50, 28, 4);
        ctx.fill();
        ctx.fillStyle = '#020617';
        ctx.fillRect(carDriveX + 8, height / 2 - 10, 10, 20);
      }
    }

    // 2. Apply Computer Vision Filter Transformations (Emulating OpenCV)
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    if (filterMode === 'grayscale' || filterMode === 'blur' || filterMode === 'threshold') {
      // Step 1: cv2.cvtColor(BGR2GRAY)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard luminance calculation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        if (filterMode === 'grayscale') {
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        } else if (filterMode === 'blur') {
          // Simple local blur representation
          data[i] = gray * 0.9;
          data[i + 1] = gray * 0.9;
          data[i + 2] = gray * 0.9;
        } else if (filterMode === 'threshold') {
          // Step 2: cv2.adaptiveThreshold (binary black & white edges)
          // Pixels with contrast above threshold become white (255), otherwise black (0)
          const isEdge = gray > 75 && gray < 190;
          const val = isEdge ? 255 : 0;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // 3. Stage 2 Computer Vision Bounding Box Overlay & Pixel Counting
    // Emulating cv2.countNonZero(crop) inside each slot ROI
    const updates: { slot_id: string; is_occupied: boolean; pixel_count: number }[] = [];

    slots.forEach((slot, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      const slotX = 50 + col * 120;
      const slotY = 40 + row * 100;
      const slotW = 100;
      const slotH = 75;

      // Calculate approximate non-zero pixels inside ROI
      let simulatedCount = 0;
      if (slot.isOccupied) {
        // High pixel density when car is present
        simulatedCount = 1200 + Math.floor(Math.sin((step + index * 10) * 0.1) * 80);
      } else {
        // Low pixel density when empty pavement
        simulatedCount = 180 + Math.floor(Math.cos((step + index * 5) * 0.1) * 30);
      }

      const detectedOccupied = simulatedCount > thresholdLimit;

      // Draw OpenCV bounding box
      ctx.lineWidth = 2;
      ctx.strokeStyle = detectedOccupied ? '#ef4444' : '#10b981'; // Red or Green
      ctx.strokeRect(slotX, slotY, slotW, slotH);

      // Semi-transparent status fill
      ctx.fillStyle = detectedOccupied ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(slotX, slotY, slotW, slotH);

      // Draw HUD label (ID + status + pixel count)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(slotX, slotY, 78, 28);

      ctx.fillStyle = detectedOccupied ? '#fca5a5' : '#86efac';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(`${slot.id}: ${detectedOccupied ? 'OCC' : 'VAC'}`, slotX + 4, slotY + 12);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`${simulatedCount} px`, slotX + 4, slotY + 23);

      updates.push({
        slot_id: slot.id,
        is_occupied: detectedOccupied,
        pixel_count: simulatedCount,
      });
    });

    // Send periodic updates to sync status (every ~60 frames)
    if (step % 60 === 0) {
      onBatchUpdateSlots(updates);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }

    if (isProcessing) {
      animFrameId.current = requestAnimationFrame(renderFrame);
    }
  }, [filterMode, thresholdLimit, useWebcam, cameraPreset, slots, isProcessing, onBatchUpdateSlots]);

  useEffect(() => {
    if (isProcessing) {
      animFrameId.current = requestAnimationFrame(renderFrame);
    }
    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [renderFrame, isProcessing]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 sm:p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white tracking-tight">
              OpenCV Camera Feed & Computer Vision Module
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Stages 2 & 3: Video Stream Processing</span>
            <span aria-hidden="true">·</span>
            <span>Simulating cv2.adaptiveThreshold & cv2.countNonZero</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Selector */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setCameraPreset('mall-deck')}
              className={`px-2.5 py-1 rounded transition-colors ${
                cameraPreset === 'mall-deck' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mall Rooftop
            </button>
            <button
              onClick={() => setCameraPreset('college-campus')}
              className={`px-2.5 py-1 rounded transition-colors ${
                cameraPreset === 'college-campus' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Campus North
            </button>
            <button
              onClick={() => setCameraPreset('covered-garage')}
              className={`px-2.5 py-1 rounded transition-colors ${
                cameraPreset === 'covered-garage' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Covered Deck
            </button>
          </div>

          {/* Webcam Toggle */}
          <button
            onClick={() => setUseWebcam(!useWebcam)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border transition-colors ${
              useWebcam
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{useWebcam ? 'Webcam Active' : 'Use My Webcam'}</span>
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/60 p-2.5 rounded">
          {webcamError}
        </div>
      )}

      {/* Main Video & OpenCV Canvas Container */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex flex-col items-center justify-center">
        {/* Hidden video element used for webcam capture */}
        <video ref={videoRef} className="hidden" playsInline muted autoPlay />

        {/* Live CV Canvas */}
        <canvas
          ref={canvasRef}
          width={700}
          height={460}
          className="w-full max-w-[700px] h-auto object-contain block select-none"
        />

        {/* On-screen telemetry watermark */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs border border-slate-800 px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>FPS: 30</span>
          <span className="text-slate-600">|</span>
          <span>CV Sync: {lastSyncTime}</span>
        </div>
      </div>

      {/* CV Processing Pipeline Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-lg">
        {/* Filter Mode Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              OpenCV Pipeline Filter Step:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => setFilterMode('normal')}
              className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                filterMode === 'normal'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Color (RGB)
            </button>
            <button
              onClick={() => setFilterMode('grayscale')}
              className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                filterMode === 'grayscale'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Grayscale
            </button>
            <button
              onClick={() => setFilterMode('blur')}
              className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                filterMode === 'blur'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Gaussian Blur
            </button>
            <button
              onClick={() => setFilterMode('threshold')}
              className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                filterMode === 'threshold'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              4. Threshold Mask
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {filterMode === 'normal' && 'Original camera sensor frame showing RGB colors.'}
            {filterMode === 'grayscale' && 'cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) converts 3 color channels to single brightness channel.'}
            {filterMode === 'blur' && 'cv2.GaussianBlur(gray, (3, 3), 1) removes high frequency pixel noise.'}
            {filterMode === 'threshold' && 'cv2.adaptiveThreshold produces binary mask where vehicle contours appear as white pixels.'}
          </p>
        </div>

        {/* Pixel Threshold Sensitivity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                Pixel Threshold (cv2.countNonZero):
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
              {thresholdLimit} px
            </span>
          </div>

          <input
            type="range"
            min={400}
            max={1400}
            step={25}
            value={thresholdLimit}
            onChange={(e) => setThresholdLimit(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Low (More Sensitive)</span>
            <span>Recommended: 850 px</span>
            <span>High (Less Sensitive)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            If non-zero pixel count &gt; threshold, slot is marked OCCUPIED (Red). If &le; threshold, marked VACANT (Green).
          </p>
        </div>
      </div>
    </div>
  );
};
