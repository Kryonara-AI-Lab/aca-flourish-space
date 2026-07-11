import { Link } from "@tanstack/react-router";

/**
 * Spoude brand logo mark - uses /logo_1.png.
 */
export function SpoudeMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo_1.png"
      alt="Spoude"
      style={{ height: size, width: "auto" }}
      className={className}
    />
  );
}

export function SpoudeWordmark({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      <span className="transition-transform duration-300 group-hover:rotate-[8deg] flex items-center">
        <SpoudeMark size={28} />
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">Spoude</span>
    </Link>
  );
}
