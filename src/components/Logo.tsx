import { Link } from "@tanstack/react-router";

/**
 * Spoude brand mark component.
 * Features an elegant, minimal geometric representation of a book, sparkle, and compass
 * that encapsulates Spoude's high-end academic feel.
 */
export function SpoudeMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient
          id="spoudeGradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
      <rect x="6" y="8" width="20" height="16" rx="3" fill="url(#spoudeGradient)" />
      <path d="M12 8v16" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3" />
      <circle cx="16" cy="16" r="3" fill="#ffffff" fillOpacity="0.2" />
      <polygon
        points="16,13 17,16 20,16 17.5,17.5 18.5,20.5 16,18.5 13.5,20.5 14.5,17.5 12,16 15,16"
        fill="#fbbf24"
      />
    </svg>
  );
}

export function SpoudeWordmark({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      <span className="transition-transform duration-300 group-hover:rotate-[8deg]">
        <SpoudeMark />
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">Spoude</span>
    </Link>
  );
}

