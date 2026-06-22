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

function clearBrowserAuthState() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("sb-") || key.includes("supabase")) {
      localStorage.removeItem(key);
    }
  });
  document.cookie = "sb-logged-in=; path=/; max-age=0";
  document.cookie = "sb-access-token=; path=/; max-age=0";
}

async function clearServerAuthCookie() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2000);
  try {
    await fetch("/api/auth/set-cookie", { method: "DELETE", signal: controller.signal });
  } catch {
    // 本地状态已清理，服务端 cookie 清理失败不阻塞退出
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, accessToken?: string) => {
    try {
      let token = accessToken;
      if (!token) {
        const supabase = await getSupabaseBrowserClientAsync();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        token = session?.access_token;
      }
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
          await setAuthCookie(currentSession.access_token);
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id, currentSession.access_token);
        } else {
          await setAuthCookie(null);
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
            if (newSession?.access_token) {
              await setAuthCookie(newSession.access_token);
            }
            setSession(newSession);
            setUser(newSession?.user ?? null);
            if (newSession?.user) {
              await fetchProfile(newSession.user.id, newSession.access_token);
            }
          } else if (event === "SIGNED_OUT") {
            clearBrowserAuthState();
            setSession(null);
            setUser(null);
            setProfile(null);
            clearServerAuthCookie();
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
    setUser(null);
    setSession(null);
    setProfile(null);
    clearBrowserAuthState();
    clearServerAuthCookie();

    try {
      const supabase = await getSupabaseBrowserClientAsync();
      supabase.auth.signOut().catch((err) => {
        console.warn("Remote sign out failed:", err);
      });
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
