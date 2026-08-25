"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || "User",
          email: session.user.email || "",
          image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null
        });
      } else {
        setUser(null);
        setToken(null);
        if (!pathname.startsWith("/auth")) {
          router.push("/auth/login");
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token);
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || "User",
          email: session.user.email || "",
          image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null
        });
      } else {
        setUser(null);
        setToken(null);
        if (!pathname.startsWith("/auth")) {
          router.push("/auth/login");
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const handleLogout = async () => {
    // Instantly clear state and redirect
    setUser(null);
    setToken(null);
    router.push("/auth/login");
    // Run network logout in the background
    supabase.auth.signOut().catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
