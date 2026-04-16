'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  oreumName: string;
  onClose: () => void;
}

export default function StampAnimation({ oreumName, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="bg-white rounded-3xl p-8 text-center mx-4 max-w-xs w-full"
          onClick={e => e.stopPropagation()}
        >
          <motion.div
            initial={{ rotate: -30, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
            className="text-6xl mb-4"
          >
            🌿
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <p className="text-lg font-bold text-[#1A2F4B] mb-1">스탬프 인증 완료!</p>
            <p className="text-[#0EA5A0] font-semibold">{oreumName}</p>
            <p className="text-sm text-[#64748B] mt-2">오름 도감에 기록되었습니다 🎉</p>
          </motion.div>
          {/* 컨페티 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div key={i}
                initial={{ y: -20, x: Math.random() * 300 - 150, opacity: 1 }}
                animate={{ y: 300, opacity: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 1.5 }}
                className="absolute top-0 w-2 h-2 rounded-full"
                style={{ left: `${10 + (i * 7) % 80}%`, background: ['#0EA5A0', '#22C55E', '#F59E0B', '#EF4444', '#87CEEB'][i % 5] }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
