import Link from "next/link";
import PathwayBoard from "@/components/pathway/PathwayBoard";
import { mockPathwayColumns, mockCareProfile } from "@/lib/mock-data";

export default function PathwayPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold tracking-widest uppercase text-brand-teal">
          The Pathway
        </p>
        <h1 className="font-serif font-bold text-4xl text-gray-900 leading-tight">
          Not a list. A plan.
        </h1>
        <p className="text-gray-500 mt-1">
          Grouped by what needs to happen when — and every recommendation explains itself.
        </p>
      </div>

      {/* 4-column board */}
      {/* INTEGRATION POINT: Replace mockPathwayColumns with data fetched from
          your backend Pathway Reasoner service. Pass the CareProfile as input
          to generate a personalised, live plan. */}
      <PathwayBoard
        columns={mockPathwayColumns}
        patientName={mockCareProfile.name}
      />

      {/* Escalation banner */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-brand-teal-light border border-brand-teal/20">
        <p className="text-sm text-brand-teal">
          <span className="mr-1">↓</span>
          This case is complex — a Care Corner coordinator can take it from here.
        </p>
        <Link
          href="/autopilot"
          className="shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-brand-teal text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Launch Autopilot →
        </Link>
      </div>
    </div>
  );
}
