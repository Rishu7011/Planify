"use client";

import { motion } from "framer-motion";
import { FADE_UP } from "./constants";

interface Props {
  label?: string;
}

export function ThinkingIndicator({ label = "Thinking" }: Props) {
  return (
    <motion.div
      {...FADE_UP}
      className="flex w-full max-w-[min(80%,42rem)] items-start gap-3 sm:max-w-[78%]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#151A2B]"
        aria-hidden
      >
        <span
          className="material-symbols-outlined text-lg text-[#AEC6FF]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          robot_2
        </span>
      </div>

      <div className="min-w-0 rounded-2xl rounded-tl-md border border-white/[0.08] bg-[#151A2B]/90 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#AEC6FF]"
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.18,
              }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-[#7C869A]">{label}</p>
      </div>
    </motion.div>
  );
}
