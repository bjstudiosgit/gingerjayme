/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';

const COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Pale Ginger', value: '#FBE3D3' },
  { name: 'Soft Apricot Ginger', value: '#F7C8A4' },
  { name: 'Light Ginger Glow', value: '#F4B183' },
  { name: 'Warm Peach Ginger', value: '#F29C6B' },
  { name: 'Golden Ginger', value: '#F08A5D' },
  { name: 'Classic Ginger', value: '#E97451' },
  { name: 'Burnt Ginger', value: '#E25822' },
  { name: 'Deep Ginger Spice', value: '#D94F1A' },
  { name: 'Fiery Ginger', value: '#D14009' },
  { name: 'Dark Ginger Root', value: '#B63E0B' },
  { name: 'Copper Glow', value: '#DA8A67' },
  { name: 'Soft Copper Ginger', value: '#D17A5B' },
  { name: 'Bright Copper', value: '#C96A4F' },
  { name: 'Rustic Copper', value: '#B8573C' },
  { name: 'Dark Copper Ember', value: '#A3472C' },
  { name: 'Auburn Ginger', value: '#A0522D' },
  { name: 'Warm Auburn', value: '#8C3B1F' },
  { name: 'Deep Auburn', value: '#7A2F17' },
  { name: 'Rich Auburn Spice', value: '#6B2612' },
  { name: 'Smoked Auburn', value: '#5A1F0E' },
  { name: 'Honey Ginger', value: '#F5B971' },
  { name: 'Amber Ginger', value: '#F2A65A' },
  { name: 'Golden Amber', value: '#E89B4A' },
  { name: 'Dark Amber Spice', value: '#D98C3B' },
  { name: 'Toasted Amber', value: '#C57C2E' },
  { name: 'Gingerbread Light', value: '#C68642' },
  { name: 'Gingerbread Classic', value: '#B87333' },
  { name: 'Gingerbread Deep', value: '#A05A2C' },
  { name: 'Molten Gingerbread', value: '#8C4A25' },
  { name: 'Dark Molasses Ginger', value: '#6F3A1E' },
  { name: 'Caramel Ginger', value: '#F4A460' },
  { name: 'Light Caramel Spice', value: '#E9964A' },
  { name: 'Warm Caramel', value: '#DA8B3A' },
  { name: 'Deep Caramel', value: '#C97A2C' },
  { name: 'Burnt Caramel Ginger', value: '#A65E1B' },
  { name: 'Cinnamon Ginger', value: '#D2691E' },
  { name: 'Spiced Cinnamon', value: '#B85C1A' },
  { name: 'Dark Cinnamon Ginger', value: '#9E4E15' },
  { name: 'Smoked Cinnamon', value: '#7F3E10' },
  { name: 'Charred Spice', value: '#5E2D0C' },
  { name: 'Sunset Ginger', value: '#FF7F50' },
  { name: 'Coral Ginger', value: '#FF6F3C' },
  { name: 'Deep Coral Spice', value: '#F05A28' },
  { name: 'Burnt Coral', value: '#D94A1F' },
  { name: 'Rustic Orange Ginger', value: '#CC5500' },
  { name: 'Ember Orange', value: '#B34700' },
  { name: 'Dark Ember', value: '#993D00' },
  { name: 'Ashen Ginger', value: '#7A3000' },
  { name: 'Smouldering Root', value: '#5C2400' },
  { name: 'Blackened Ginger', value: '#3D1800' }
];

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSegmenter, setImageSegmenter] = useState<ImageSegmenter | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[1].value);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWebcamStarted, setIsWebcamStarted] = useState(false);
  const [isPaleSkinEnabled, setIsPaleSkinEnabled] = useState(false);
  
  const requestRef = useRef<number>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevMaskRef = useRef<Float32Array | null>(null);
  const prevSkinMaskRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        // Load Multi-class Selfie Segmenter
        // Categories: 0-bg, 1-hair, 2-body, 3-face, 4-clothes, 5-others
        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          outputCategoryMask: false,
          outputConfidenceMasks: true
        });
        
        setImageSegmenter(segmenter);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize MediaPipe:", err);
        setError("Failed to load AI models. Please check your connection.");
        setIsLoading(false);
      }
    }

    initMediaPipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      imageSegmenter?.close();
    };
  }, []);

  const startWebcam = async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'user' 
        } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        setIsWebcamStarted(true);
      };
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Webcam access denied. Please enable camera permissions.");
    }
  };

  useEffect(() => {
    if (isWebcamStarted && imageSegmenter) {
      renderLoop();
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isWebcamStarted, imageSegmenter, selectedColor, isPaleSkinEnabled]);

  const renderLoop = () => {
    if (!videoRef.current || !canvasRef.current || !imageSegmenter) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx || video.paused || video.ended) {
      requestRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    // Ensure canvas matches video dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      if (video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (!maskCanvasRef.current) {
          maskCanvasRef.current = document.createElement('canvas');
        }
        maskCanvasRef.current.width = video.videoWidth;
        maskCanvasRef.current.height = video.videoHeight;
        prevMaskRef.current = null;
      }
    }

    if (canvas.width === 0) {
      requestRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const startTimeMs = performance.now();
    
    // 1. Run Multi-class Segmentation
    imageSegmenter.segmentForVideo(video, startTimeMs, (result) => {
      const confidenceMasks = result.confidenceMasks;
      if (!confidenceMasks || confidenceMasks.length < 2) return;

      // Models: 1 is hair, 2 is body skin, 3 is face skin
      const hairMask = confidenceMasks[1];
      const bodyMask = confidenceMasks.length > 2 ? confidenceMasks[2] : null;
      const faceMask = confidenceMasks.length > 3 ? confidenceMasks[3] : null;

      // 2. Clear main canvas and draw video
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 3. Pale Skin Filter
      if (isPaleSkinEnabled && faceMask && bodyMask) {
        const maskCanvas = maskCanvasRef.current!;
        const maskCtx = maskCanvas.getContext('2d')!;
        const faceData = faceMask.getAsFloat32Array();
        const bodyData = bodyMask.getAsFloat32Array();
        
        if (!prevSkinMaskRef.current || prevSkinMaskRef.current.length !== faceData.length) {
          prevSkinMaskRef.current = new Float32Array(faceData.length);
        }
        
        const smoothedSkinMask = prevSkinMaskRef.current;
        const imageData = maskCtx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < faceData.length; i++) {
          const skinConfidence = Math.max(faceData[i], bodyData[i]);
          smoothedSkinMask[i] = (skinConfidence * 0.4) + (smoothedSkinMask[i] * 0.6);
          const confidence = smoothedSkinMask[i];
          
          let alpha = 0;
          if (confidence > 0.1) {
            alpha = Math.min(255, ((confidence - 0.1) / 0.4) * 255);
          }
          
          const pixelIndex = i * 4;
          imageData.data[pixelIndex] = 255;   // R
          imageData.data[pixelIndex + 1] = 245; // G (Slightly peach)
          imageData.data[pixelIndex + 2] = 238; // B
          imageData.data[pixelIndex + 3] = alpha * 0.35; // 35% opacity max
        }
        
        maskCtx.putImageData(imageData, 0, 0);
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = 'blur(4px)'; 
        ctx.drawImage(maskCanvas, 0, 0);
        ctx.restore();
      }

      if (selectedColor !== 'transparent') {
        const maskCanvas = maskCanvasRef.current!;
        const maskCtx = maskCanvas.getContext('2d')!;
        
        const hairData = hairMask.getAsFloat32Array();
        
        // Adjusted smoothing factor to 0.4 for a balance between responsiveness and stability
        if (!prevMaskRef.current || prevMaskRef.current.length !== hairData.length) {
          prevMaskRef.current = new Float32Array(hairData);
        } else {
          const smoothingFactor = 0.4;
          for (let i = 0; i < hairData.length; i++) {
            prevMaskRef.current[i] = (hairData[i] * smoothingFactor) + (prevMaskRef.current[i] * (1 - smoothingFactor));
          }
        }

        const smoothedMask = prevMaskRef.current;
        const imageData = maskCtx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < smoothedMask.length; i++) {
          const confidence = smoothedMask[i];
          const pixelIndex = i * 4;
          
          // Soft Alpha Ramping: Start at 30% confidence to catch fine flyaways
          // We use a wider ramp (0.3 to 0.7) for a smoother transition
          let alpha = 0;
          if (confidence > 0.3) {
            alpha = Math.min(255, ((confidence - 0.3) / 0.4) * 255);
          }
          
          imageData.data[pixelIndex] = 255;
          imageData.data[pixelIndex + 1] = 255;
          imageData.data[pixelIndex + 2] = 255;
          imageData.data[pixelIndex + 3] = alpha;
        }
        
        maskCtx.putImageData(imageData, 0, 0);

        // 4. Color the mask
        maskCtx.globalCompositeOperation = 'source-in';
        maskCtx.fillStyle = selectedColor;
        maskCtx.fillRect(0, 0, canvas.width, canvas.height);
        maskCtx.globalCompositeOperation = 'source-over';

        // 5. Blend colored mask onto main canvas
        // We use a slightly stronger blur (2px) to "dilate" the mask and catch flyaways
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.filter = 'blur(2px)'; 
        ctx.drawImage(maskCanvas, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    });

    requestRef.current = requestAnimationFrame(renderLoop);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Top Bar */}
      <div className="w-full max-w-4xl mb-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-0 px-6 py-4 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white/90 flex items-center gap-3">
            <span className="text-[36px] leading-none text-orange-500 flex-shrink-0">G</span>
            Fifty Shades of Jay
          </h1>
        </div>
        
        <div className="flex gap-3 mb-1">
          <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full font-mono text-[9px] uppercase tracking-wider flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isWebcamStarted ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={isWebcamStarted ? 'text-orange-400' : 'text-red-400'}>Ginga Cam</span>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className={`relative w-full max-w-4xl bg-[#151619] rounded-2xl border border-white/5 shadow-2xl overflow-hidden group flex justify-center items-center ${!isWebcamStarted ? 'aspect-video' : 'min-h-[300px]'}`}>
        <video 
          ref={videoRef} 
          className="hidden" 
          autoPlay 
          playsInline 
          muted 
        />
        
        <canvas 
          ref={canvasRef} 
          className="max-w-full h-auto max-h-[70vh] object-contain rounded-2xl"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* System State Overlay */}
        {(!isWebcamStarted && !error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm z-20 gap-12">
            {!isLoading && (
              <button 
                onClick={startWebcam}
                className="group relative px-10 py-4 bg-white text-black rounded-full font-black uppercase italic tracking-tighter text-lg hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <Camera className="w-6 h-6" />
                Initialize Camera
              </button>
            )}
            
            <div className="flex flex-col items-center">
              <RefreshCw className={`w-12 h-12 text-orange-400 mb-4 ${isLoading ? 'animate-spin' : 'opacity-20'}`} />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-orange-400/60">
                {isLoading ? 'Initializing AI Models...' : 'Awaiting Camera Feed...'}
              </p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md z-30 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">System Error</h2>
            <p className="text-red-200/70 max-w-md text-sm mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 hover:bg-red-400 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Restart Engine
            </button>
          </div>
        )}

      </div>

      {/* Control Panel */}
      <div className="mt-8 w-full max-w-4xl bg-[#151619] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-black font-mono text-[10px] font-bold uppercase tracking-widest rounded-full">
          Fifty Shades of Jay
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-2">
          <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Hair Palette</span>
          <button 
            onClick={() => setIsPaleSkinEnabled(!isPaleSkinEnabled)}
            className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest border transition-all flex items-center gap-2 ${
              isPaleSkinEnabled 
                ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_15px_rgba(255,120,0,0.4)]' 
                : 'bg-black text-white/50 border-white/20 hover:border-orange-500/50 hover:text-orange-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${isPaleSkinEnabled ? 'bg-black' : 'bg-white/30'}`} />
            Gingerfy my skin
          </button>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-x-2 gap-y-6 max-h-60 overflow-y-auto p-2 custom-scrollbar">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.value)}
              className={`group relative flex flex-col items-center gap-2 transition-all ${
                selectedColor === color.value ? 'scale-110' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div 
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedColor === color.value ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-white/10'
                }`}
                style={{ backgroundColor: color.value === 'transparent' ? '#222' : color.value }}
              >
                {color.value === 'transparent' && (
                  <div className="w-6 h-0.5 bg-red-500/50 rotate-45" />
                )}
              </div>
              <span className="text-[9px] font-mono uppercase tracking-tighter text-white/40 group-hover:text-white/80 text-center max-w-[64px] leading-tight flex-1 flex flex-col justify-end">
                {color.name}
              </span>
              {selectedColor === color.value && (
                <div className="absolute -bottom-2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 flex gap-8 text-[10px] font-mono uppercase tracking-[0.2em] text-white/20">
        <div className="flex items-center gap-2">
          <span className="text-white/40">Model:</span> JayChromatic Follicle Resolution Engine™ (JFRE) v1.1
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40">Engine:</span> MediaPipe Vision
        </div>
      </div>
    </div>
  );
}
