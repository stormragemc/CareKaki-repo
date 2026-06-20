"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { DEMO_USERS } from "@/lib/demo-users";

export default function LoginPage() {
  const router = useRouter();

  const handleSelect = (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (!user) return;

    sessionStorage.setItem("demoUser", JSON.stringify(user));
    sessionStorage.setItem("careProfile", JSON.stringify(user.profile));
    sessionStorage.setItem("autopilotAdapters", JSON.stringify(user.adapters));
    sessionStorage.setItem("userLocation", JSON.stringify(user.location));

    // Clear any cached pathway so it regenerates for this user
    sessionStorage.removeItem("pathwayColumns");
    sessionStorage.removeItem("pathwayProfile");

    router.push("/chat?mode=" + (user.role === "senior" ? "self" : "caregiver"));
  };

  return (
    <div className="min-h-screen bg-brand-brown flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
          <Logo size={28} />
          <span className="font-serif font-bold text-white text-lg tracking-tight">CareKaki</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <h1 className="font-serif font-bold text-3xl text-white mb-2">Who's using CareKaki?</h1>
        <p className="text-sm text-white/50 mb-12">Select your profile to continue</p>

        {/* Netflix-style profile cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
          {DEMO_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id)}
              className="group flex flex-col items-center gap-3 cursor-pointer"
            >
              {/* Avatar circle */}
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-5xl transition-all group-hover:scale-105 group-hover:ring-4 group-hover:ring-white/30"
                style={{ backgroundColor: user.color + "25", borderColor: user.color, borderWidth: 2 }}
              >
                {user.avatar}
              </div>

              {/* Name */}
              <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                {user.name}
              </span>

              {/* Role + scenario */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: user.color + "20", color: user.color }}
                >
                  {user.role === "senior" ? "Senior" : "Caregiver"}
                </span>
                <span className="text-[10px] text-white/30 text-center leading-snug max-w-[140px]">
                  {user.tagline}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Back link */}
        <Link
          href="/"
          className="mt-12 text-sm text-white/40 hover:text-white transition-colors"
        >
          ← Back to start
        </Link>
      </main>
    </div>
  );
}
