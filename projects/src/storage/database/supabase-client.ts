import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

let envLoaded = false;

function loadEnv(): void {
  if (envLoaded || (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY)) {
    return;
  }
  try {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("dotenv").config();
      if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
        envLoaded = true;
        return;
      }
    } catch {
      /* dotenv not available */
    }

    const pythonCode = `
import os, sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for ev in env_vars:
        print(f"{ev.key}={ev.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;
    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    for (const line of output.trim().split("\n")) {
      if (line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq > 0) {
        const key = line.substring(0, eq);
        let val = line.substring(eq + 1);
        if (
          (val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))
        )
          val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
    envLoaded = true;
  } catch {
    /* silent */
  }
}

function getSupabaseCredentials(): { url: string; anonKey: string } {
  loadEnv();
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!url) throw new Error("COZE_SUPABASE_URL is not set");
  if (!anonKey) throw new Error("COZE_SUPABASE_ANON_KEY is not set");
  return { url, anonKey };
}

function getSupabaseServiceRoleKey(): string | undefined {
  loadEnv();
  return process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}

// Supabase 客户端缓存，避免重复创建连接
const clientCache = new Map<string, { client: SupabaseClient; expiresAt: number }>();
const ANONYMOUS_CACHE_KEY = "__anonymous__";
const CACHE_TTL = 3600 * 1000; // 1小时 TTL

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  // 无 token 时返回缓存的匿名客户端
  if (!token) {
    const cached = clientCache.get(ANONYMOUS_CACHE_KEY);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.client;
    }
    const key = getSupabaseServiceRoleKey() ?? anonKey;
    const client = createClient(url, key, {
      global: {},
      db: { timeout: 60000 },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    clientCache.set(ANONYMOUS_CACHE_KEY, {
      client,
      expiresAt: Date.now() + CACHE_TTL,
    });
    return client;
  }

  // 检查 token 缓存
  const cached = clientCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.client;
  }

  // 创建新客户端并缓存
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    db: { timeout: 60000 },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  clientCache.set(token, {
    client,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return client;
}

export { loadEnv, getSupabaseCredentials, getSupabaseServiceRoleKey, getSupabaseClient };
