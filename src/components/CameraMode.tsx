import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Zap, Info, Pill, AlertCircle, Loader2, RefreshCw, FlipHorizontal } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { scanMedicine } from '../services/geminiService';
import { toast } from 'sonner';

interface CameraModeProps {
  onClose: () => void;
  onIdentify: (medicine: string) => void;
}

export const CameraMode: React.FC<CameraModeProps> = ({ onClose, onIdentify }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ name: string; strength: string; primaryUse?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  };

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setIsCameraActive(true);
      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission was denied. Please check your browser settings.");
        toast.error("Camera permission denied");
      } else {
        setError(`Camera error: ${err.message || "Unknown error"}`);
      }
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Restart camera when facingMode changes if it was active
  React.useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  React.useEffect(() => {
    return () => stopCamera();
  }, []);

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    setLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      const scanResult = await scanMedicine(base64Image);
      
      if (scanResult && scanResult.name) {
        setResult(scanResult);
        setIsScanning(false);
      } else {
        toast.error("Could not identify medicine. Try again.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      toast.error("Scan failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning && isCameraActive && !loading && !result) {
      timer = setTimeout(() => {
        captureAndScan();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isScanning, isCameraActive, loading, result]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-emerald-950 flex flex-col"
    >
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera Viewfinder */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {!isCameraActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Camera className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-bold text-2xl">AI Medicine Scanner</h3>
              <p className="text-white/60 text-sm max-w-xs mx-auto">
                Point your camera at the medicine packaging to identify and check for safety.
              </p>
            </div>
            <div className="flex flex-col w-full max-w-xs gap-3">
              <button 
                onClick={startCamera}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Camera className="w-5 h-5" /> Start Scanning</>}
              </button>
              <button 
                onClick={handleClose}
                className="w-full py-4 rounded-2xl bg-white/5 text-white font-bold border border-white/10"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Scanning Animation */}
        {isScanning && isCameraActive && (
          <motion.div 
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] z-10"
          />
        )}

        {/* Viewfinder Frame */}
        {isScanning && isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-emerald-400/50 rounded-3xl relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
            </div>
          </div>
        )}

        {/* UI Overlays */}
        <div className="absolute inset-0 flex flex-col p-6 pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto">
            <button 
              onClick={handleClose}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex gap-2">
              {isCameraActive && (
                <button 
                  onClick={switchCamera}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <FlipHorizontal className="w-6 h-6" />
                </button>
              )}
              <div className="px-4 py-2 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                AI Vision Active
              </div>
            </div>
          </div>

          <div className="mt-auto mb-12 pointer-events-auto">
            <AnimatePresence mode="wait">
              {isScanning && isCameraActive ? (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-white text-lg font-bold">AI Processing...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-white text-lg font-bold mb-2">Analyzing Medicine...</p>
                      <p className="text-white/60 text-sm">Keep the package steady and well-lit</p>
                    </>
                  )}
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <GlassCard className="bg-white/10 border-emerald-500/50 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
                        <Pill className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-white text-xl font-bold">{result?.name} {result?.strength}</h3>
                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Identified</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-white/80 text-xs">
                        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p>{result?.primaryUse || "Commonly used medication."}</p>
                      </div>
                      <div className="flex items-start gap-2 text-amber-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>Consult Airi for safety checks against your profile.</p>
                      </div>
                    </div>
                  </GlassCard>
                  <button 
                    onClick={() => result && onIdentify(`${result.name} ${result.strength}`)}
                    className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal shadow-lg"
                  >
                    View Details & Safety
                  </button>
                  <button 
                    onClick={() => { setResult(null); setIsScanning(true); }}
                    className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold backdrop-blur-md border border-white/20"
                  >
                    Scan Another
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
