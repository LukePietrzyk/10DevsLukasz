import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";

/**
 * Component that initializes the auth store on mount.
 * This ensures the client-side auth state is synchronized with the server-side state.
 * Should be included in the root layout.
 */
export default function AuthInitializer() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth store to check for existing session
    initialize();
  }, [initialize]);

  // This component doesn't render anything
  return null;
}
