import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { AuthSelection } from '../components/auth/AuthSelection';

export const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-emerald-950 text-emerald-50">
      {/* Subtle Healthcare & Navigation Geometry Pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.06] overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="auth-medical-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 4" />
              <circle cx="24" cy="24" r="1.5" fill="#10b981" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-medical-grid)" />
        </svg>
      </div>

      {/* Ambient Gradient Glows */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-emerald-950 via-emerald-950/95 to-emerald-900/90 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8 md:p-10 shadow-2xl border-white/10 relative overflow-hidden bg-emerald-950/80 backdrop-blur-xl">
          <Routes>
            <Route index element={<AuthSelection />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </GlassCard>
      </motion.div>
    </div>
  );
};

