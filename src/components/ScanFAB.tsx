import React from 'react';
import { Camera } from 'lucide-react';
import { motion } from 'motion/react';

interface ScanFABProps {
  onClick: () => void;
}

export const ScanFAB: React.FC<ScanFABProps> = ({ onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-teal-calm text-white flex items-center justify-center shadow-2xl neon-glow-teal z-40 border-4 border-white/20"
    >
      <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-teal-calm -z-10"
      />
    </motion.button>
  );
};
