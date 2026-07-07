import { Link } from "@tanstack/react-router";

/**
 * Lumio whale mark — matches /public/favicon.svg exactly.
 * A small friendly whale in royal blue with a soft spout.
 */
export function LumioMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lumioWhale" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5b7cff" />
          <stop offset="100%" stopColor="#2f3fd9" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#5eb1ff" strokeWidth={1.3} strokeLinecap="round">
        <path d="M15.5 4 q1 2 0 4" />
        <path d="M13 5 q0 1.5 -1 2.5" />
        <path d="M18 5 q0 1.5 1 2.5" />
      </g>
      <path
        d="M6 20 C6 13, 14 10, 20 12 L26 10 L24 15 C27 17, 27 22, 22 24 C15 27, 8 25, 6 20 Z"
        fill="url(#lumioWhale)"
      />
      <path
        d="M8 21 C10 24, 16 25, 20 23 C17 24, 12 24, 9 22 Z"
        fill="#7ec4ff"
        opacity={0.7}
      />
      <circle cx="14" cy="17" r="0.9" fill="#ffffff" />
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
