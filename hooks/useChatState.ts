"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message, CareProfile } from "@/lib/types";
import { mockMessages, mockCareProfile } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION POINT: Replace the mock logic in `sendMessage` with a real
// streaming API call to your LLM backend. The backend should:
//   1. Send the user message + conversation history to the model
//   2. Stream back the assistant response
//   3. Extract entities and update `profile` in real time
//
// The hook's return shape is the stable contract — swap internals freely.
// ─────────────────────────────────────────────────────────────────────────────

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [profile, setProfile] = useState<CareProfile>(mockCareProfile);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [emergency, setEmergency] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("careProfile", JSON.stringify(profile));
  }, [profile]);

  const updateProfile = useCallback(
    (patch: Partial<CareProfile>) =>
      setProfile((prev) => ({ ...prev, ...patch })),
    []
  );
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsThinking(true);
    setIsProfileUpdating(true);

    const messagePayload = [...messages, userMsg];

    // ── Replace below with real API call ──────────────────────────────────
    // await new Promise((r) => setTimeout(r, 1200));
    // const assistantMsg: Message = {
    //   id: String(Date.now() + 1),
    //   role: "assistant",
    //   content:
    //     "Thanks for sharing that. I've updated Mdm Tan's care profile and I'm refining the plan now.",
    // };
    // setMessages((prev) => [...prev, assistantMsg]);
    // setIsThinking(false);
    // // Simulate profile settling after response
    // await new Promise((r) => setTimeout(r, 600));
    // setIsProfileUpdating(false);

    // ─────────────────────────────────────────────────────────────────────
    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: messagePayload })
    });
    const data = await res.json();
    const assistantMsg: Message = {
      id: String(Date.now() + 1),
      role: "assistant",
      content: data.content,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsThinking(false);

    if (data.profileUpdate && Object.keys(data.profileUpdate).length > 0) {
      updateProfile(data.profileUpdate);
    }
    if (data.emergency) {
      sessionStorage.setItem("autopilotAdapters", JSON.stringify(data.adapters));
      sessionStorage.setItem("autopilotTrigger", data.content);
      setEmergency(true);
    }
    setIsProfileUpdating(false);

  }, [messages]);

  // Exposed for backend integration (e.g. SSE / WebSocket handlers can call
  // these directly to push profile field updates from the server):
  

  return {
    messages,
    profile,
    isProfileUpdating,
    isThinking,
    inputValue,
    setInputValue,
    sendMessage,
    updateProfile,
    emergency,
  };
}
