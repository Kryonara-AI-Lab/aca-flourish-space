import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/firebase";

/**
 * Landing page removed on user request.
 * Signed-in users land on /spoude; everyone else goes to /auth.
 */
export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) throw redirect({ to: "/spoude", replace: true });
    throw redirect({ to: "/auth", replace: true });
  },
  component: () => null,
});
