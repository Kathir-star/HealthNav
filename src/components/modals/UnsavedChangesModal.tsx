import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
  title?: string;
  message?: string;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onStay,
  onDiscard,
  title = "Discard unsaved changes?",
  message = "You have unsaved changes. If you close this now, all modified health information will be lost.",
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onStay}
          className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-emerald-950 border border-amber-500/30 rounded-3xl p-6 space-y-5 shadow-2xl z-10"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                <span className="text-[10px] font-semibold text-amber-300/80 uppercase tracking-wider">
                  Unsaved Modifications
                </span>
              </div>
            </div>
            <button
              onClick={onStay}
              className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-200/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-emerald-100/80 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl">
            {message}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStay}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Keep Editing
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="flex-1 py-3 rounded-2xl bg-amber-500/90 hover:bg-amber-500 text-xs font-bold text-emerald-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Discard Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
