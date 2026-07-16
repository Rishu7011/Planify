"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal?: boolean;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: SpeechRecognitionErrorEvent) => void;
}

type WindowWithSpeech = typeof window & {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
};

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = "en-US",
    continuous = true,
    interimResults = true,
    onResult,
    onEnd,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Detect support asynchronously to prevent SSR mismatches and avoid setState-in-effect lint issues
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const win = window as unknown as WindowWithSpeech;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    const hasSupport = !!SpeechClass;

    const timer = setTimeout(() => {
      setSupported(hasSupport);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const win = window as unknown as WindowWithSpeech;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechClass) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      const rec = new SpeechClass();
      rec.lang = lang;
      rec.continuous = continuous;
      rec.interimResults = interimResults;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript).trim();
        if (onResult && fullTranscript) {
          onResult(fullTranscript, !!finalTranscript);
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech Recognition Error:", event.error);
        if (onError) onError(event);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        if (onEnd) onEnd();
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [isListening, lang, continuous, interimResults, onResult, onEnd, onError, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    supported,
    startListening,
    stopListening,
  };
}
