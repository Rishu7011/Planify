"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BOTTOM_THRESHOLD_PX = 96;

export function useChatScroll(triggerDeps: unknown[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkIfAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD_PX;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } else {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    }
    isPinnedRef.current = true;
    setShowScrollButton(false);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const atBottom = checkIfAtBottom();
      isPinnedRef.current = atBottom;
      setShowScrollButton(!atBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [checkIfAtBottom]);

  useEffect(() => {
    if (isPinnedRef.current) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll when conversation updates
  }, triggerDeps);

  return {
    scrollRef,
    bottomRef,
    showScrollButton,
    scrollToBottom,
    isPinnedRef,
  };
}
