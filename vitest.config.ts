import { defineConfig } from "vitest/config";

// Tests cover the pure analysis modules only — no DOM, no network, no Supabase.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
