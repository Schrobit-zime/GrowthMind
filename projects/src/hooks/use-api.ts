"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * 通用数据获取 Hook
 * 自动携带 session token 发起 GET 请求，支持取消请求和手动刷新
 */
export function useFetch<T = unknown>(
  url: string,
  options?: { enabled?: boolean },
): FetchState<T> & { refetch: () => void } {
  const { session } = useAuth();
  const enabled = options?.enabled ?? true;
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.access_token || !enabled) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const res = await fetch(url, {
        headers: { "x-session": session.access_token },
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "请求失败");
      setState({ data: json.data as T, loading: false, error: null });
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e.name === "AbortError") return;
      setState({
        data: null,
        loading: false,
        error: e.message || "网络请求失败",
      });
    }
  }, [url, session, enabled]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/**
 * 数据变更 Hook (POST/PUT/DELETE)
 * 返回 mutate 函数用于执行变更操作，同时提供 loading/error 状态
 */
export function useMutation<T = unknown, V = unknown>(
  url: string,
  method: "POST" | "PUT" | "DELETE" = "POST",
) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (body?: V): Promise<{ success: boolean; data?: T; error?: string }> => {
      if (!session?.access_token) return { success: false, error: "未登录" };
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-session": session.access_token,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json();
        setLoading(false);
        setError(json.success ? null : json.error);
        return json;
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string };
        setLoading(false);
        setError(e.message || "请求失败");
        return { success: false, error: e.message || "请求失败" };
      }
    },
    [url, method, session],
  );

  return { mutate, loading, error };
}
