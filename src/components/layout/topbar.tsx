"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      api
        .get<{ user: any }>("/api/auth/me")
        .then((res) => setUser(res.user))
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [user, setUser]);

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {loaded && user && (
          <>
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
              {initials(user.firstName, user.lastName)}
            </div>
            <span className="hidden sm:block text-sm font-medium">
              {user.firstName} {user.lastName}
            </span>
          </>
        )}
        <Button variant="ghost" size="icon" onClick={logout} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
