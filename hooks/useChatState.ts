"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message, CareProfile } from "@/lib/types";

const emptyProfile: CareProfile = {
  name: "",
  age: 0,
  living: "",
  mobility: "",
  conditions: "",
  caregiver: "",
  financialTier: "",
  recentEvent: "",
};

function loadInitialState(): { messages: Message[]; profile: CareProfile } {
  if (typeof window === "undefined") {
    return { messages: [], profile: emptyProfile };
  }

  const demoUserStr = sessionStorage.getItem("demoUser");
  if (demoUserStr) {
    try {
      const demoUser = JSON.parse(demoUserStr);
      const msgs: Message[] = (demoUser.chatHistory ?? []).map(
        (m: { role: string; content: string }, i: number) => ({
          id: String(i + 1),
          role: m.role as "assistant" | "user",
          content: m.content,
        })
      );
      return { messages: msgs, profile: demoUser.profile };
    } catch {}
  }

  const profileStr = sessionStorage.getItem("careProfile");
  const profile = profileStr ? JSON.parse(profileStr) : emptyProfile;

  const greeting: Message = {
    id: "1",
    role: "assistant",
    content: "Hi — tell me about the person you're caring for. What just happened?",
  };

  return { messages: [greeting], profile };
}

export function useChatState() {
  const [initial] = useState(loadInitialState);
  const [messages, setMessages] = useState<Message[]>(initial.messages);
  const [profile, setProfile] = useState<CareProfile>(initial.profile);
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

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagePayload }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: data.content,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.profileUpdate && Object.keys(data.profileUpdate).length > 0) {
        updateProfile(data.profileUpdate);
      }
      if (data.emergency) {
        sessionStorage.setItem("autopilotAdapters", JSON.stringify(data.adapters));
        sessionStorage.setItem("autopilotTrigger", content);
        setEmergency(true);
      }
    } catch {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: "Sorry, I couldn't reach the backend. Is the server running?",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      setIsProfileUpdating(false);
    }
  }, [messages, updateProfile]);

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
