import Link from "next/link";
import Logo from "@/components/ui/Logo";
import TalkToHuman from "@/components/ui/TalkToHuman";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-hairline">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size={30} />
          <span className="font-serif font-bold text-ink text-lg tracking-tight">
            CareKaki
          </span>
        </Link>

        <TalkToHuman />
      </div>
    </header>
  );
}
