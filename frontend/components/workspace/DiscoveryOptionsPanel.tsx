"use client";

import { motion } from "framer-motion";
import { GLASS_PANEL, FADE_UP } from "./chat/constants";

interface Props {
  question: string;
  options: string[];
  acknowledgment?: string | null;
  onSelect: (option: string) => void;
  loading: boolean;
}

export function DiscoveryOptionsPanel({
  question,
  options,
  acknowledgment,
  onSelect,
  loading,
}: Props) {
  if (!question) return null;

  const subtitle = acknowledgment?.trim()
    ? acknowledgment.trim()
    : "Pick an option or type your own answer below.";

  return (
    <motion.div
      {...FADE_UP}
      className={`${GLASS_PANEL} w-full max-w-full sm:max-w-[min(78%,42rem)] rounded-2xl p-4 md:p-5`}
      role="group"
      aria-label="Discovery question"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
          <span className="material-symbols-outlined text-lg">edit_note</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#F7F8FC]">Project discovery</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-[#B4BCCB]">{subtitle}</p>
        </div>
      </div>

      <p className="mb-4 text-sm font-medium leading-relaxed text-[#F7F8FC]">{question}</p>

      <div className="flex flex-wrap gap-2">
        {options.map((option, i) => (
          <motion.button
            key={option}
            type="button"
            disabled={loading}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            onClick={() => onSelect(option)}
            className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-[#F7F8FC] transition-all hover:border-[#AEC6FF]/50 hover:bg-[#AEC6FF]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AEC6FF]/40 disabled:opacity-40"
          >
            {option}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
