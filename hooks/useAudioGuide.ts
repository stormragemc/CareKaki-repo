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
  error: string; // e.g. "not-allowed", "no-speech", "network", "service-not-allowed"
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

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setState((s) => ({ ...s, micOn: false, micError: null }));
  }, []);

  // Hard-stop whatever's currently playing (used on route changes) without
  // turning the guide off — so the next page can narrate its own content.
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopListening();
    setState((s) => ({ ...s, status: s.enabled ? "idle" : "off" }));
  }, [stopListening]);

  const speak = useCallback(
    async (event: string, context: string = "", mode: string = "caregiver") => {
      stopListening();
      setState((s) => ({ ...s, status: "speaking", micOn: false }));

      try {
        const res = await fetch("http://localhost:8000/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, context, mode }),
        });

        if (res.headers.get("content-type")?.includes("audio")) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          const script = res.headers.get("X-Voice-Script") || "";
          setState((s) => ({ ...s, lastScript: script, status: "speaking" }));

          audio.onended = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            setState((s) => ({
              ...s,
              status: s.enabled ? "idle" : "off",
            }));
          };

          await audio.play();
        } else {
          const data = await res.json();
          setState((s) => ({
            ...s,
            lastScript: data.script || "",
            status: s.enabled ? "idle" : "off",
          }));
        }
      } catch {
        setState((s) => ({
          ...s,
          status: s.enabled ? "idle" : "off",
        }));
      }
    },
    [stopListening]
  );

  const enable = useCallback(() => {
    setState((s) => ({ ...s, enabled: true, status: "idle" }));
    speak("guide_started", "", getMode());
  }, [speak]);

  // Turn the guide on without the "welcome" line — used when a page wants to
  // immediately narrate its own content (e.g. the tutorial "Read this aloud").
  const enableSilently = useCallback(() => {
    setState((s) => ({ ...s, enabled: true, status: "idle" }));
  }, []);

  const disable = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopListening();
    setState({ enabled: false, status: "off", micOn: false, micError: null, lastScript: "" });
  }, [stopListening]);

  const pause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    stopListening();
    setState((s) => ({ ...s, status: "paused", micOn: false }));
  }, [stopListening]);

  const resume = useCallback(() => {
    setState((s) => ({ ...s, status: "idle" }));
  }, []);

  const startListening = useCallback(
    (onResult: (transcript: string) => void) => {
      if (state.status === "speaking") return;

      const speechRecognitionWindow = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRecognition =
        speechRecognitionWindow.SpeechRecognition ||
        speechRecognitionWindow.webkitSpeechRecognition;

      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.lang = "en-SG";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e: SpeechRecognitionResultEventLike) => {
        const transcript = e.results[0][0].transcript;
        onResult(transcript);
      };

      // Without an onerror handler, a permission denial fires onerror then onend
      // immediately, silently resetting micOn → false so the button looks stuck.
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
        // onend fires after both normal stop and after onerror; only clear micOn
        // here — onerror already set micError if needed, so don't overwrite it.
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
        // start() can throw synchronously if called while already active.
        recognitionRef.current = null;
        setState((s) => ({
          ...s,
          micOn: false,
          micError: "unsupported",
          status: s.enabled ? "idle" : "off",
        }));
        return;
      }
      setState((s) => ({ ...s, micOn: true, micError: null, status: "listening" }));
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
    ...state, // includes micError
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
