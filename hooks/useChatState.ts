"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { currentLang, translate } from "@/lib/i18n";
import type { Message, CareProfile, ProfileMeta } from "@/lib/types";

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

function loadInitialState(): {
  messages: Message[];
  profile: CareProfile;
  profileMeta: ProfileMeta;
} {
  if (typeof window === "undefined") {
    return { messages: [], profile: emptyProfile, profileMeta: {} };
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
      return {
        messages: msgs,
        profile: demoUser.profile,
        profileMeta: demoUser.profileMeta ?? {},
      };
    } catch {}
  }

  const profileStr = sessionStorage.getItem("careProfile");
  const profile = profileStr ? JSON.parse(profileStr) : emptyProfile;

  const isSelf = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "self";
  const greeting: Message = {
    id: "1",
    role: "assistant",
    content: translate(currentLang(), isSelf ? "chat.greetingSelf" : "chat.greetingCaregiver"),
  };

  return { messages: [greeting], profile, profileMeta: {} };
}

export function useChatState() {
  const [initial] = useState(loadInitialState);
  const [messages, setMessages] = useState<Message[]>(initial.messages);
  const [profile, setProfile] = useState<CareProfile>(initial.profile);
  const [profileMeta, setProfileMeta] = useState<ProfileMeta>(initial.profileMeta);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sessionStorage.setItem("careProfile", JSON.stringify(profile));
  }, [profile]);

  // The "just updated" ring plays once (~1.8s), then settles — for both the
  // seeded persona field and each live profileUpdate patch (see spec §1, §7).
  const scheduleClearPulse = useCallback(() => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      setProfileMeta((prev) => {
        const next: ProfileMeta = {};
        for (const k of Object.keys(prev) as (keyof CareProfile)[]) {
          const meta = prev[k];
          if (meta) next[k] = { ...meta, justUpdated: false };
        }
        return next;
      });
    }, 1800);
  }, []);

  useEffect(() => {
    scheduleClearPulse();
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [scheduleClearPulse]);

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
        // language: the LLM replies in the user's chosen language (AiMao and
        // CareKaki stay untranslated by the backend prompt).
        body: JSON.stringify({ messages: messagePayload, language: currentLang() }),
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
        setProfileMeta((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(data.profileUpdate) as (keyof CareProfile)[]) {
            // MyInfo-verified fields are never editable from chat — keep their
            // source; everything else patched here came from the conversation.
            next[key] = { source: prev[key]?.source ?? "chat", justUpdated: true };
          }
          return next;
        });
        scheduleClearPulse();
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
        content: translate(currentLang(), "chat.backendError"),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      setIsProfileUpdating(false);
    }
  }, [messages, updateProfile, scheduleClearPulse]);

  return {
    messages,
    profile,
    profileMeta,
    isProfileUpdating,
    isThinking,
    inputValue,
    setInputValue,
    sendMessage,
    updateProfile,
    emergency,
  };
}
