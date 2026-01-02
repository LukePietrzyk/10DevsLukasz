import React from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth.store";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const { logout, loading } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Wyloguj
    </Button>
  );
}
