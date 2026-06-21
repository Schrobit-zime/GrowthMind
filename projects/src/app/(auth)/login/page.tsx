"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseBrowserClientAsync } from "@/lib/supabase-browser";
import { Eye, EyeOff, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("请输入邮箱地址");
      return;
    }
    if (!password || password.length < 6) {
      setError("密码至少需要 6 位字符");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = await getSupabaseBrowserClientAsync();

      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.session?.access_token) {
          // 通过服务端 API 设置 httpOnly cookie
          await fetch("/api/auth/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: data.session.access_token }),
          });
          // 设置非 httpOnly 标记 cookie 供 middleware 快速判断登录状态
          document.cookie = "sb-logged-in=true; path=/; max-age=3600; SameSite=Lax";
        }
        router.replace("/");
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            setError("邮箱或密码错误");
          } else {
            setError(signInError.message);
          }
          return;
        }
        if (data.session?.access_token) {
          // 通过服务端 API 设置 httpOnly cookie
          await fetch("/api/auth/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: data.session.access_token }),
          });
          // 设置非 httpOnly 标记 cookie 供 middleware 快速判断登录状态
          document.cookie = "sb-logged-in=true; path=/; max-age=3600; SameSite=Lax";
        }
        router.replace("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
      {/* Aurora gradient decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-float-slow" />
      <div className="absolute top-[10%] right-[-15%] w-[400px] h-[400px] rounded-full bg-accent/15 blur-[100px] animate-float-slower" />
      <div className="absolute bottom-[-10%] left-[20%] w-[350px] h-[350px] rounded-full bg-success/10 blur-[100px] animate-float-slow" />
      <div className="absolute bottom-[5%] right-[-5%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px] animate-float-slower" />
      <div className="absolute top-[40%] left-[50%] w-[250px] h-[250px] rounded-full bg-accent/10 blur-[90px] animate-float-slow" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 w-full max-w-4xl px-6 py-12">
        {/* Brand section */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-float">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              GrowthMind
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            记录成长，遇见更好的自己
          </p>
          <div className="mt-8 space-y-3 hidden lg:block">
            {["AI 智能分析与趋势解读", "多维度目标追踪管理", "可视化数据仪表盘"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        {/* Glassmorphism form card */}
        <div className="w-full max-w-md bg-surface/40 backdrop-blur-2xl border border-border/30 rounded-2xl p-8 shadow-float">
          {/* Tabs */}
          <div className="flex mb-8 bg-surface-container rounded-lg p-1">
            <Button
              variant="ghost"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md ${
                mode === "login"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              登录
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md ${
                mode === "register"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              注册
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                邮箱
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                密码
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位字符"
                  className="w-full px-4 py-3 pr-12 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  确认密码
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    className="w-full px-4 py-3 pr-12 backdrop-blur-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg shadow-float hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed h-12"
            >
              {submitting
                ? "处理中..."
                : mode === "login"
                  ? "登录"
                  : "注册"}
            </Button>
          </form>

          {/* Footer links */}
          {mode === "login" && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              还没有账号？
              <Button
                variant="link"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className="text-primary hover:text-accent"
              >
                去注册
              </Button>
            </p>
          )}
          {mode === "register" && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              已有账号？
              <Button
                variant="link"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-primary hover:text-accent"
              >
                去登录
              </Button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
