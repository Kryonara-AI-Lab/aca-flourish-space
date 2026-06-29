import { Link } from "@tanstack/react-router";

export function LumioMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lumioG" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.82 0.14 80)" />
          <stop offset="100%" stopColor="oklch(0.66 0.18 55)" />
        </linearGradient>
      </defs>
      <path
        d="M16 3.2c-2.4 4.6-5.2 7-9.4 8.6 4.2 1.6 7 4 9.4 8.6 2.4-4.6 5.2-7 9.4-8.6-4.2-1.6-7-4-9.4-8.6z"
        fill="url(#lumioG)"
      />
      <circle cx="16" cy="25" r="3.2" fill="url(#lumioG)" />
    </svg>
  );
}

export function LumioWordmark({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      <span className="transition-transform duration-300 group-hover:rotate-[8deg]">
        <LumioMark />
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">
        Lumio
      </span>
    </Link>
  );
}
