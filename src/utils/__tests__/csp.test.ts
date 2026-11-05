import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "@/utils/csp";

describe("contentSecurityPolicy", () => {
  it("allows only the web's own origin, and WebAssembly for pdf.js", () => {
    const policy = contentSecurityPolicy(false);

    expect(policy).toContain("connect-src 'self';");
    expect(policy).toContain("worker-src 'self' blob:");
    expect(policy).toContain("'wasm-unsafe-eval'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("allows eval in development only", () => {
    expect(contentSecurityPolicy(true)).toContain(" 'unsafe-eval'");
  });
});
