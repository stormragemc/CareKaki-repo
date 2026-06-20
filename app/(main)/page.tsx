import Link from "next/link";
import ModeCard from "@/components/landing/ModeCard";

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6 py-16">
      {/* Hero */}
      <div className="max-w-[920px] w-full text-center mb-12">
        <p className="text-self-ink font-semibold text-base mb-3">
          Your care buddy that knows where to start
        </p>
        <h1 className="font-serif font-bold text-[38px] md:text-[52px] text-ink leading-tight mb-4">
          Who is this for?
        </h1>
        <p className="text-ink-soft text-lg">
          Pick one. Everything after this adapts to your answer.
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 w-full max-w-3xl">
        <ModeCard
          mode="self"
          title="For myself"
          description="I'm figuring things out — discharge, schemes, day-to-day support."
          href="/onboard?mode=self"
        />
        <ModeCard
          mode="caregiver"
          title="For someone I care for"
          description="I need a plan I can actually act on for a loved one."
          href="/onboard?mode=caregiver"
        />
      </div>

      {/* Sign in */}
      <Link
        href="/login"
        className="mt-10 text-base text-ink-soft hover:text-ink transition-colors"
      >
        Already set up? <span className="font-semibold underline underline-offset-2">Sign in</span>
      </Link>
    </div>
  );
}
