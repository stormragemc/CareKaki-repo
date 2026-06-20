interface LogoProps {
  size?: number;
}

export default function Logo({ size = 28 }: LogoProps) {
  return (
    <div
      className="flex items-center justify-center bg-self rounded-md font-bold text-white leading-none select-none"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.43) }}
      aria-hidden="true"
    >
      ck
    </div>
  );
}
