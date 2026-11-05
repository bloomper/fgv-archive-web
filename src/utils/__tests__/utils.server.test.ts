import { afterEach, describe, expect, it, vi } from "vitest";

describe("normalizeLocale (env-driven)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadWith(env: Record<string, string | undefined>) {
    vi.resetModules();
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) {
        vi.stubEnv(k, "");
      } else {
        vi.stubEnv(k, v);
      }
    }
    return import("@/utils/utils.server");
  }

  it("defaults to sv when nothing is configured", async () => {
    const { normalizeLocale } = await loadWith({ SUPPORTED_LOCALES: "", DEFAULT_LOCALE: "" });
    expect(normalizeLocale(undefined)).toBe("sv");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("de")).toBe("sv");
  });

  it("honours a configured DEFAULT_LOCALE within the supported set", async () => {
    const { normalizeLocale } = await loadWith({ SUPPORTED_LOCALES: "en,sv", DEFAULT_LOCALE: "en" });
    expect(normalizeLocale(undefined)).toBe("en");
    expect(normalizeLocale("sv")).toBe("sv");
    expect(normalizeLocale("fr")).toBe("en");
  });

  it("ignores a DEFAULT_LOCALE outside the supported set", async () => {
    const { normalizeLocale } = await loadWith({ SUPPORTED_LOCALES: "en", DEFAULT_LOCALE: "de" });
    expect(normalizeLocale(undefined)).toBe("sv");
    expect(normalizeLocale("en")).toBe("en");
  });

  it("restricts to a custom supported locale list", async () => {
    const { normalizeLocale } = await loadWith({ SUPPORTED_LOCALES: "en, sv, no", DEFAULT_LOCALE: "no" });
    expect(normalizeLocale("no")).toBe("no");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("fr")).toBe("no");
  });
});

