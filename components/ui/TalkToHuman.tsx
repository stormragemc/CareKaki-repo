import { Headset } from "lucide-react";

// Persistent "there is always a human" affordance. Lives in every screen header.
// theme="dark" for the Autopilot world; default suits cream screens.
export default function TalkToHuman({
  theme = "light",
}: {
  theme?: "light" | "dark";
}) {
  const ring =
    theme === "dark"
      ? "border-autopilot-hairline text-autopilot-text hover:bg-white/5"
      : "border-hairline-warm text-ink-body hover:bg-cream-deep";

  return (
    <a
      href="mailto:marceldan67@gmail.com?subject=CareKaki%20Support%20Request&body=Hi%2C%20I%20need%20help%20with%20CareKaki."
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${ring}`}
    >
      <Headset size={16} aria-hidden="true" />
      Talk to a human
    </a>
  );
}
