"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getSupabaseBrowserClientAsync } from "@/lib/supabase-browser";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  userId: string;
  displayName: string;
  role: "user" | "admin";
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// 通过服务端 API 设置 httpOnly cookie，同时设置非 httpOnly 标记 cookie
async function setAuthCookie(token: string | null) {
  if (token) {
    // 调用服务端 API 设置 httpOnly cookie
    await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    // 设置非 httpOnly 标记 cookie 供 middleware 快速判断登录状态
    document.cookie = "sb-logged-in=true; path=/; max-age=3600; SameSite=Lax";
  } else {
    // 清除 cookie
    await fetch("/api/auth/set-cookie", { method: "DELETE" });
    document.cookie = "sb-logged-in=; path=/; max-age=0";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = await getSupabaseBrowserClientAsync();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const json = await res.json();
      const profileData = json.data || json;
      if (profileData && profileData.id) {
        setProfile({
          id: profileData.id,
          userId: profileData.userId,
          displayName: profileData.displayName,
          role: profileData.role,
          avatarUrl: profileData.avatarUrl,
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 5000);

    async function init() {
      try {
        const supabase = await getSupabaseBrowserClientAsync();
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          setAuthCookie(currentSession.access_token);
          await fetchProfile(currentSession.user.id);
        } else {
          setAuthCookie(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setIsLoading(false);
        clearTimeout(timeout);
      }
    }

    init();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [fetchProfile]);

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function setupListener() {
      try {
        const supabase = await getSupabaseBrowserClientAsync();
        const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!mounted) return;

          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            if (newSession?.access_token) {
              setAuthCookie(newSession.access_token);
            }
            if (newSession?.user) {
              await fetchProfile(newSession.user.id);
            }
          } else if (event === "SIGNED_OUT") {
            setSession(null);
            setUser(null);
            setProfile(null);
            setAuthCookie(null);
          }
        });
        unsubscribe = data.subscription.unsubscribe;
      } catch (err) {
        console.error("Auth listener setup error:", err);
      }
    }

    setupListener();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      const supabase = await getSupabaseBrowserClientAsync();
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setAuthCookie(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
