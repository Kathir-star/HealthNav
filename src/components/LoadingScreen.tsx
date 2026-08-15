import React from 'react';
import { motion } from 'motion/react';
import { HealthNavLogo } from './HealthNavLogo';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LoadingScreenProps {
  error?: string | null;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ error, onRetry }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#022c22] text-emerald-50 select-none overflow-hidden"
    >
      {/* Minimalist Healthcare & Navigation Geometry Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07] overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            {/* Minimal Cross / Node Healthcare Pattern */}
            <pattern id="healthnav-minimal-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              {/* Subtle Grid Lines */}
              <line x1="0" y1="30" x2="60" y2="30" stroke="#10b981" strokeWidth="0.75" strokeDasharray="1 5" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="#10b981" strokeWidth="0.75" strokeDasharray="1 5" />
              {/* Central Medical Cross Node */}
              <path 
                d="M27 30 H33 M30 27 V33" 
                stroke="#34d399" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
              />
              <circle cx="30" cy="30" r="1" fill="#6ee7b7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#healthnav-minimal-pattern)" />
        </svg>
      </div>

      {/* Soft Ambient Radial Vignette & Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-600/10 via-teal-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Main Intro Branding */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
        {/* Step 1: HealthNav Logo with subtle entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <HealthNavLogo 
            size="xl" 
            showText={false} 
            className="justify-center"
          />
        </motion.div>

        {/* Step 2: Brand Slogan */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
          className="space-y-1"
        >
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-0.5">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
              Health
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Nav
            </span>
          </h1>
          <p className="text-xs font-semibold text-emerald-200/80 tracking-wide uppercase">
            Your Health. Clearly Navigated.
          </p>
        </motion.div>

        {/* Step 3: Minimal Loading Indicator OR Error State */}
        <div className="mt-8 h-12 flex flex-col items-center justify-center">
          {error ? (
            <motion.div 
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/70 border border-rose-500/30 px-3.5 py-1.5 rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.25 }}
              className="flex flex-col items-center gap-2.5"
            >
              {/* Minimal Line Progress Bar */}
              <div className="w-32 h-1 bg-emerald-950/90 rounded-full overflow-hidden border border-emerald-500/20 relative">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 rounded-full"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.1, 
                    ease: 'easeInOut' 
                  }}
                  style={{ width: '50%' }}
                />
              </div>
              <span className="text-[10px] font-medium text-emerald-300/60 tracking-wider">
                Initializing health services...
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
