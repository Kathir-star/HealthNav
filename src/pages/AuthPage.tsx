import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { AuthSelection } from '../components/auth/AuthSelection';

export const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Nature-Themed Background */}
      <div className="fixed inset-0 -z-10">
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop" 
          alt="Forest Nature" 
          className="w-full h-full object-cover opacity-10"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-950/98 to-emerald-900/95 backdrop-blur-[2px]" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8 md:p-10 shadow-2xl border-white/10 relative overflow-hidden">
          <Routes>
            <Route index element={<AuthSelection />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </GlassCard>
      </motion.div>
    </div>
  );
};

