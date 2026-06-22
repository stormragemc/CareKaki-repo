"use client";

import { useState, useCallback, useRef } from "react";

type GuideStatus = "off" | "idle" | "speaking" | "listening" | "paused";

interface AudioGuideState {
  enabled: boolean;
  status: GuideStatus;
  micOn: boolean;
  lastScript: string;
}

interface SpeechRecognitionResultEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
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
    lastScript: "",
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setState((s) => ({ ...s, micOn: false }));
  }, []);

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
          setState((s) => ({ ...s, lastScript: script }));

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

  const disable = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopListening();
    setState({ enabled: false, status: "off", micOn: false, lastScript: "" });
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

      recognition.onend = () => {
        setState((s) => ({ ...s, micOn: false, status: s.enabled ? "idle" : "off" }));
      };

      recognitionRef.current = recognition;
      recognition.start();
      setState((s) => ({ ...s, micOn: true, status: "listening" }));
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
    disable,
    pause,
    resume,
    speak,
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
