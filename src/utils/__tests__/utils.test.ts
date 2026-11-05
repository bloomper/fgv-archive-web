import { describe, expect, it } from "vitest";
import { cn } from "@/utils/utils";

describe("cn", () => {
  it("merges class names and lets later tailwind classes win", () => {
    expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4");
  });
});
