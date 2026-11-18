import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("keeps custom font-size tokens alongside text colors", () => {
    expect(cn("text-display-md", "text-ink")).toBe("text-display-md text-ink");
    expect(cn("font-mono text-eyebrow uppercase", "text-moss")).toBe("font-mono text-eyebrow uppercase text-moss");
  });
  it("still resolves real conflicts", () => {
    expect(cn("text-display-md", "text-display-lg")).toBe("text-display-lg");
    expect(cn("text-ink", "text-moss")).toBe("text-moss");
    expect(cn("shadow-card", "shadow-float")).toBe("shadow-float");
    expect(cn("rounded-md", "rounded-pill")).toBe("rounded-pill");
  });
});
