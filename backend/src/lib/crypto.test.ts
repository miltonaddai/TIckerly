import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson, fromB64, safeEqual, sign, toB64, uid } from "./crypto";
import { decodeSession, encodeSession, newSession } from "./session";

describe("crypto helpers", () => {
  it("round-trips JSON through AES-GCM", () => {
    const value = { sub: "u1", nested: { list: [1, 2, 3] } };
    expect(decryptJson(encryptJson(value))).toEqual(value);
  });

  it("uses a fresh IV on every encryption", () => {
    expect(encryptJson({ a: 1 })).not.toBe(encryptJson({ a: 1 }));
  });

  it("returns null for tampered or truncated ciphertext", () => {
    const payload = encryptJson({ a: 1 });
    const flipped = `${payload.slice(0, -2)}${payload.endsWith("A") ? "B" : "A"}${payload.slice(-1)}`;
    expect(decryptJson(flipped)).toBeNull();
    expect(decryptJson("short")).toBeNull();
  });

  it("signs deterministically", () => {
    expect(sign("payload")).toBe(sign("payload"));
    expect(sign("payload")).not.toBe(sign("payload2"));
  });

  it("compares strings safely, including different lengths", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("round-trips base64url", () => {
    expect(fromB64(toB64("héllo / world?"))).toBe("héllo / world?");
  });

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

describe("session cookies", () => {
  it("rejects expired sessions", () => {
    const expired = { ...newSession("u1", "user@example.com"), exp: Date.now() - 1000 };
    expect(decodeSession(encodeSession(expired))).toBeNull();
  });

  it("rejects a valid signature over a different payload", () => {
    const [, signature] = encodeSession(newSession("u1", "a@example.com")).split(".");
    const [otherPayload] = encodeSession(newSession("u2", "b@example.com")).split(".");
    expect(decodeSession(`${otherPayload}.${signature}`)).toBeNull();
  });

  it("rejects missing values", () => {
    expect(decodeSession(undefined)).toBeNull();
    expect(decodeSession("")).toBeNull();
  });
});
