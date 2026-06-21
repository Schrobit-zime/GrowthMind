"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
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

function setAuthCookie(token: string | null) {
  if (token) {
    document.cookie = `sb-access-token=${token}; path=/; max-age=3600; SameSite=Lax`;
  } else {
    document.cookie = "sb-access-token=; path=/; max-age=0";
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data) {
        setProfile({
          id: data.id,
          userId: data.userId,
          displayName: data.displayName,
          role: data.role,
          avatarUrl: data.avatarUrl,
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
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [fetchProfile]);

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function setupListener() {
      try {
        const supabase = await getSupabaseBrowserClientAsync();
        const { data } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
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
          }
        );
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
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
