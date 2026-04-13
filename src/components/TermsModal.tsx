import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, Eye, Database, Check } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md glass rounded-[32px] p-8 relative z-10 max-h-[80vh] overflow-y-auto border-emerald-500/20"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-emerald-100/60" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="text-emerald-400 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-50">Privacy & Terms</h2>
            </div>

            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Lock className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Data Collection</h3>
                </div>
                <p className="text-sm text-emerald-100/70 leading-relaxed">
                  We collect minimal data required for service delivery. This includes anonymized device IDs and location data (only when searching for nearby care).
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Eye className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Transparency</h3>
                </div>
                <p className="text-sm text-emerald-100/70 leading-relaxed">
                  Your prescription scans are processed locally or via encrypted AI pipelines. We do not store images of your prescriptions after processing.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Database className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Retention</h3>
                </div>
                <p className="text-sm text-emerald-100/70 leading-relaxed">
                  Transient data (like search history) is cleared every 30 days. Consent logs are retained for 3 years to comply with healthcare regulations.
                </p>
              </section>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Your Consent</h4>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="text-white w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-emerald-100/80">Allow anonymous analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="text-white w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-emerald-100/80">Allow emergency donor alerts</span>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold hover:scale-[1.02] transition-transform neon-glow-teal"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
