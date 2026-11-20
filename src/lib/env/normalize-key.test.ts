import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { normalizePrivateKey } = await import("./server");

const PEM = "-----BEGIN PRIVATE KEY-----\nABC\nDEF\n-----END PRIVATE KEY-----\n";

describe("normalizePrivateKey", () => {
  it("handles escaped newlines", () => expect(normalizePrivateKey(PEM.replace(/\n/g, "\\n")).trim()).toBe(PEM.trim()));
  it("strips wrapping quotes", () => expect(normalizePrivateKey(`"${PEM.replace(/\n/g, "\\n")}"`).trim()).toBe(PEM.trim()));
  it("keeps real newlines and drops CR", () => expect(normalizePrivateKey(PEM.replace(/\n/g, "\r\n")).trim()).toBe(PEM.trim()));
  it("extracts from a pasted service-account JSON", () =>
    expect(normalizePrivateKey(JSON.stringify({ client_email: "x@y", private_key: PEM }))).toBe(PEM));
});
