"use client";

import { useState, useCallback, useRef } from "react";

type GuideStatus = "off" | "idle" | "speaking" | "listening" | "paused";
export type MicError = "denied" | "unsupported" | null;

interface AudioGuideState {
  enabled: boolean;
  status: GuideStatus;
  micOn: boolean;
  micError: MicError;
  lastScript: string;
}

interface SpeechRecognitionResultEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function useAudioGuide() {
  const [state, setState] = useState<AudioGuideState>({
    enabled: false,
    status: "off",
    micOn: false,
    micError: null,
    lastScript: "",
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speakAbortRef = useRef<AbortController | null>(null);
  const speakLockRef = useRef(false);
  const lastSpeakTimeRef = useRef(0);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setState((s) => ({ ...s, micOn: false, micError: null }));
  }, []);

  const cancelCurrentAudio = useCallback(() => {
    // Abort any in-flight fetch
    if (speakAbortRef.current) {
      speakAbortRef.current.abort();
      speakAbortRef.current = null;
    }
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    speakLockRef.current = false;
  }, []);

  const stopAudio = useCallback(() => {
    cancelCurrentAudio();
    stopListening();
    setState((s) => ({ ...s, status: s.enabled ? "idle" : "off" }));
  }, [cancelCurrentAudio, stopListening]);

  const speak = useCallback(
    async (event: string, context: string = "", mode: string = "caregiver") => {
      // Debounce: ignore calls within 500ms of the last one
      const now = Date.now();
      if (now - lastSpeakTimeRef.current < 500) return;
      lastSpeakTimeRef.current = now;

      // Cancel anything currently playing
      cancelCurrentAudio();
      stopListening();
      setState((s) => ({ ...s, status: "speaking", micOn: false }));

      const abortController = new AbortController();
      speakAbortRef.current = abortController;
      speakLockRef.current = true;

      try {
        const res = await fetch("http://localhost:8000/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, context, mode }),
          signal: abortController.signal,
        });

        // If another speak() cancelled us, bail
        if (!speakLockRef.current) return;

        if (res.headers.get("content-type")?.includes("audio")) {
          const blob = await res.blob();
          if (!speakLockRef.current) return;

          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          const script = res.headers.get("X-Voice-Script") || "";
          setState((s) => ({ ...s, lastScript: script, status: "speaking" }));

          audio.onended = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            speakLockRef.current = false;
            setState((s) => ({
              ...s,
              status: s.enabled ? "idle" : "off",
            }));
          };

          await audio.play();
        } else {
          const data = await res.json();
          speakLockRef.current = false;
          setState((s) => ({
            ...s,
            lastScript: data.script || "",
            status: s.enabled ? "idle" : "off",
          }));
        }
      } catch (err) {
        // AbortError is expected when we cancel — don't treat as error
        if (err instanceof DOMException && err.name === "AbortError") return;
        speakLockRef.current = false;
        setState((s) => ({
          ...s,
          status: s.enabled ? "idle" : "off",
        }));
      }
    },
    [cancelCurrentAudio, stopListening]
  );

  const enable = useCallback(() => {
    setState((s) => ({ ...s, enabled: true, status: "idle" }));
    speak("guide_started", "", getMode());
  }, [speak]);

  const enableSilently = useCallback(() => {
    setState((s) => ({ ...s, enabled: true, status: "idle" }));
  }, []);

  const disable = useCallback(() => {
    cancelCurrentAudio();
    stopListening();
    setState({ enabled: false, status: "off", micOn: false, micError: null, lastScript: "" });
  }, [cancelCurrentAudio, stopListening]);

  const pause = useCallback(() => {
    cancelCurrentAudio();
    stopListening();
    setState((s) => ({ ...s, status: "paused", micOn: false }));
  }, [cancelCurrentAudio, stopListening]);

  const resume = useCallback(() => {
    setState((s) => ({ ...s, status: "idle" }));
  }, []);

  const startListening = useCallback(
    (onResult: (transcript: string) => void) => {
      // Don't start mic while speaking — wait for it to finish
      if (state.status === "speaking") return;

      const speechRecognitionWindow = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRecognition =
        speechRecognitionWindow.SpeechRecognition ||
        speechRecognitionWindow.webkitSpeechRecognition;

      setState((s) => ({ ...s, micOn: true, micError: null, status: "listening" }));

      if (!SpeechRecognition) {
        setState((s) => ({ ...s, micOn: false, micError: "unsupported" }));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-SG";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e: SpeechRecognitionResultEventLike) => {
        const transcript = e.results[0][0].transcript;
        onResult(transcript);
      };

      recognition.onerror = (e: SpeechRecognitionErrorEventLike) => {
        recognitionRef.current = null;
        const isDenied =
          e.error === "not-allowed" || e.error === "service-not-allowed";
        setState((s) => ({
          ...s,
          micOn: false,
          micError: isDenied ? "denied" : "unsupported",
          status: s.enabled ? "idle" : "off",
        }));
      };

      recognition.onend = () => {
        setState((s) => ({
          ...s,
          micOn: false,
          status: s.enabled ? "idle" : "off",
        }));
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        recognitionRef.current = null;
        setState((s) => ({
          ...s,
          micOn: false,
          micError: "unsupported",
          status: s.enabled ? "idle" : "off",
        }));
      }
    },
    [state.status]
  );

  const toggleMic = useCallback(
    (onResult: (transcript: string) => void) => {
      if (state.micOn) {
        stopListening();
      } else {
        startListening(onResult);
      }
    },
    [state.micOn, startListening, stopListening]
  );

  return {
    ...state,
    enable,
    enableSilently,
    disable,
    pause,
    resume,
    speak,
    stopAudio,
    startListening,
    stopListening,
    toggleMic,
  };
}

function getMode(): string {
  if (typeof window === "undefined") return "caregiver";
  try {
    const user = sessionStorage.getItem("demoUser");
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.role === "senior" ? "self" : "caregiver";
    }
  } catch {}
  return "caregiver";
}
