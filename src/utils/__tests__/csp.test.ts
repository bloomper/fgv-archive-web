import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, isReaderPath } from "@/utils/csp";

describe("contentSecurityPolicy", () => {
  it("allows only the web's own origin, without eval", () => {
    const policy = contentSecurityPolicy(false);

    expect(policy).toContain("connect-src 'self';");
    expect(policy).toContain("worker-src 'self' blob:");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("allows WebAssembly on the reader's pages only", () => {
    expect(contentSecurityPolicy(false, true)).toContain("'wasm-unsafe-eval'");
    expect(contentSecurityPolicy(false, true)).not.toContain(" 'unsafe-eval'");
  });

  it("allows eval in development only", () => {
    expect(contentSecurityPolicy(true)).toContain(" 'unsafe-eval'");
  });

  it("knows the reader's pages", () => {
    expect(isReaderPath("/files/abc")).toBe(true);
    expect(isReaderPath("/share/tok/files/abc")).toBe(true);
    expect(isReaderPath("/share/tok")).toBe(false);
    expect(isReaderPath("/files/abc/edit")).toBe(false);
    expect(isReaderPath("/arrangements/abc")).toBe(false);
  });
});
