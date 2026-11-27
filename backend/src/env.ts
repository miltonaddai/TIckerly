import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

function readEnvText(path: string) {
  const buf = readFileSync(path);
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString("utf16le");
  if (buf[0] === 0xfe && buf[1] === 0xff) {
    return Buffer.from(buf.subarray(2)).swap16().toString("utf16le");
  }
  let text = buf.toString("utf8").replace(/^\uFEFF/, "");
  if (buf.includes(0)) text = text.replace(/\0/g, "");
  return text;
}

function loadEnvFile() {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = [resolve(process.cwd(), ".env"), resolve(here, "../.env")].find((candidate) => existsSync(candidate));
  if (!path) return;
  const fromFile = new Set<string>();
  for (const line of readEnvText(path).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!key) continue;
    if (process.env[key] && !fromFile.has(key)) continue;
    process.env[key] = value;
    fromFile.add(key);
  }
}

loadEnvFile();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",
  sessionSecret: process.env.SESSION_SECRET ?? "tickerly-dev-secret-change-me",
};

export const isProd = env.nodeEnv === "production";

export function assertSafeSecrets() {
  if (!isProd) return;
  z.object({ sessionSecret: z.string().min(32) }).parse({ sessionSecret: env.sessionSecret });
}
