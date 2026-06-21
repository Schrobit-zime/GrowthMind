import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { SupabaseConfigProvider } from "@/components/auth/supabase-config-provider";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "GrowthMind - 个人成长多维数据记录与智能分析平台",
  description: "记录学习、工作、生活、身体、心情等多维数据，AI 驱动趋势分析与优化建议",
  manifest: "/manifest.json",
  themeColor: "#7C5CFF",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <SupabaseConfigProvider>
              <AuthProvider>{children}</AuthProvider>
            </SupabaseConfigProvider>
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
