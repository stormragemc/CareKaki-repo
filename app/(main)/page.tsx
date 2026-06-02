import ModeCard from "@/components/landing/ModeCard";

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6 py-16">
      {/* Heading */}
      <div className="max-w-xl w-full text-center mb-10">
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-gray-900 leading-tight mb-3">
          Where would you like to start?
        </h1>
        <p className="text-gray-500 text-base">
          Tell us who CareKaki is helping today. We'll tailor everything from here.
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl">
        <ModeCard
          mode="self"
          title="For myself"
          description="I'm a senior figuring things out — discharge, schemes, day-to-day support."
          href="/chat?mode=self"
        />
        <ModeCard
          mode="caregiver"
          title="For someone I care for"
          description="I'm a caregiver — parent, spouse, sibling — and I need a plan I can actually act on."
          href="/chat?mode=caregiver"
        />
      </div>
    </div>
  );
}
