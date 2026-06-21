"use client";
import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";

interface UseSSEOptions {
  url: string;
  onChunk?: (chunk: string, accumulated: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: string) => void;
}

/**
 * 通用 SSE 流式请求 Hook
 * 支持 POST 请求，自动附带 session token，支持取消和重置
 */
export function useSSE(options: UseSSEOptions) {
  const { session } = useAuth();
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (body?: Record<string, unknown>) => {
    if (!session?.access_token) {
      setError("未登录");
      options.onError?.("未登录");
      return;
    }
    setText("");
    setError(null);
    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch(options.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session": session.access_token,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const errText = await res.text();
        let errMsg = `请求失败 (${res.status})`;
        try {
          const e = JSON.parse(errText);
          if (e.error) errMsg = e.error;
        } catch {
          /* 非 JSON 错误信息，使用默认提示 */
        }
        throw new Error(errMsg);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content =
                parsed.choices?.[0]?.delta?.content ||
                parsed.content?.[0]?.text ||
                "";
              if (content) {
                acc += content;
                setText(acc);
                options.onChunk?.(content, acc);
              }
            } catch {
              if (data && data !== "[DONE]") {
                acc += data;
                setText(acc);
                options.onChunk?.(data, acc);
              }
            }
          }
        }
      }
      setStreaming(false);
      options.onDone?.(acc);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setStreaming(false);
        return;
      }
      const msg = err.message || "流式请求失败";
      setError(msg);
      setStreaming(false);
      options.onError?.(msg);
    }
  }, [options.url, session?.access_token, options.onChunk, options.onDone, options.onError]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setText("");
    setError(null);
  }, [stop]);

  return { text, streaming, error, start, stop, reset };
}
