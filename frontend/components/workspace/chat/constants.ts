export const GLASS_PANEL =
  "bg-white/[0.03] backdrop-blur-md border border-white/[0.08]";

export const CUSTOM_SCROLLBAR =
  "[&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:bg-white/10 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-white/20";

export const TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

export const MESSAGE_SPRING = {
  type: "spring" as const,
  damping: 28,
  stiffness: 380,
  mass: 0.8,
};

export const FADE_UP = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const },
};
