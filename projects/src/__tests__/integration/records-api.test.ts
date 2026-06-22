import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:3000";

async function isServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/supabase-config`);
    return res.status < 500;
  } catch {
    return false;
  }
}

describe("Records API 集成测试", () => {
  describe("GET /api/records", () => {
    it("无认证时应该返回 401", async () => {
      const available = await isServerAvailable();
      if (!available) return;

      const response = await fetch(`${BASE_URL}/api/records`);
      expect(response.status).toBe(401);
    });

    it("无效 token 时应该返回 401", async () => {
      const available = await isServerAvailable();
      if (!available) return;

      const response = await fetch(`${BASE_URL}/api/records`, {
        headers: { "x-session": "invalid-token" },
      });
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/records", () => {
    it("无认证时应该返回 401", async () => {
      const available = await isServerAvailable();
      if (!available) return;

      const response = await fetch(`${BASE_URL}/api/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeDimension: "morning",
          recordDate: "2026-06-21",
        }),
      });
      expect(response.status).toBe(401);
    });
  });
});
