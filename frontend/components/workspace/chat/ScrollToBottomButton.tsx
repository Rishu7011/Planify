"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToBottomButton({ visible, onClick }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          className="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#151A2B]/95 px-4 py-2 text-xs font-medium text-[#F7F8FC] shadow-lg shadow-black/30 backdrop-blur-md transition-colors hover:border-[#AEC6FF]/40 hover:bg-[#1B2136] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AEC6FF]/50"
          aria-label="Scroll to latest message"
        >
          <span className="material-symbols-outlined text-sm">arrow_downward</span>
          Latest
        </motion.button>
      )}
    </AnimatePresence>
  );
}
