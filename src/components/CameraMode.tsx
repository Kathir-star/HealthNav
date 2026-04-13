import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Zap, Info, Pill, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { scanMedicine } from '../services/geminiService';

interface CameraModeProps {
  onClose: () => void;
  onIdentify: (medicine: string) => void;
}

export const CameraMode: React.FC<CameraModeProps> = ({ onClose, onIdentify }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [isScanning, setIsScanning] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ name: string; strength: string; primaryUse?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Camera permission was denied. Please check your browser settings and allow camera access for this site.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError("No camera found on your device.");
        } else {
          setError(`Camera error: ${err.message || "Unknown error"}`);
        }
        setHasPermission(false);
      }
    }

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    setError(null);
    
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
        setError("Could not identify medicine. Please try again with a clearer view.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError("Failed to process image. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isScanning && hasPermission && !loading && !result) {
      const timer = setTimeout(() => {
        captureAndScan();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isScanning, hasPermission, loading, result]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-emerald-950 flex flex-col"
    >
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera Viewfinder */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {hasPermission === false ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-bold text-lg">Camera Access Error</h3>
            <p className="text-white/60 text-sm">{error || "Please enable camera permissions in your browser settings to scan medicines."}</p>
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white/10 text-white font-bold"
            >
              Go Back
            </button>
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
        {isScanning && hasPermission && (
          <motion.div 
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] z-10"
          />
        )}

        {/* Viewfinder Frame */}
        {isScanning && hasPermission && (
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
        <div className="absolute inset-0 flex flex-col p-6">
          <div className="flex justify-between items-center">
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="px-4 py-2 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              AI Vision Active
            </div>
          </div>

          <div className="mt-auto mb-12">
            <AnimatePresence mode="wait">
              {isScanning ? (
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
                  ) : error ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                        {error}
                      </div>
                      <button 
                        onClick={() => { setError(null); captureAndScan(); }}
                        className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Retry Scan
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-white text-lg font-bold mb-2">Analyzing Medicine...</p>
                      <p className="text-white/60 text-sm">Keep the package steady and well-lit</p>
                    </>
                  )}
                </motion.div>
              ) : (
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
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
