import type { CareMode } from "@/lib/types";

// Mode-colored primary action. 50–56px tall for senior-legible tap targets.
const fill: Record<CareMode, string> = {
  self: "bg-self hover:bg-self-ink",
  caregiver: "bg-caregiver hover:bg-caregiver-ink",
};

export default function PrimaryButton({
  mode = "caregiver",
  children,
  className = "",
  ...props
}: {
  mode?: CareMode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${fill[mode]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
