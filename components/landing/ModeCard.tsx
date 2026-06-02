import Link from "next/link";

interface ModeCardProps {
  mode: "self" | "caregiver";
  title: string;
  description: string;
  href: string;
}

export default function ModeCard({ mode, title, description, href }: ModeCardProps) {
  const isSelf = mode === "self";

  return (
    <div
      className={[
        "rounded-xl p-6 border-l-4 flex flex-col gap-6",
        isSelf
          ? "bg-brand-orange-light border-brand-orange"
          : "bg-brand-teal-light border-brand-teal",
      ].join(" ")}
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-serif font-bold text-xl text-gray-900">{title}</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
      </div>

      <Link
        href={href}
        className={[
          "self-start inline-flex items-center gap-1 px-5 py-2 rounded-full",
          "font-semibold text-sm text-white transition-opacity hover:opacity-90 active:scale-95",
          isSelf ? "bg-brand-orange" : "bg-brand-teal",
        ].join(" ")}
      >
        Start →
      </Link>
    </div>
  );
}
