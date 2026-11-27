import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { Hono } from "hono";
import { createApp } from "./app";
import { assertSafeSecrets, env } from "./env";
import { csrfOrigin, isAllowedOrigin, rateLimit } from "./middleware/security";

assertSafeSecrets();

const api = createApp();
const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : env.appOrigin),
    credentials: true,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use("*", secureHeaders());
app.use("*", logger());
app.use("/api/*", csrfOrigin);
app.use("/api/*", rateLimit);
app.route("/", api);

serve({ fetch: app.fetch, port: env.port }, () => {
  console.log(`Tickerly API listening on http://localhost:${env.port}`);
});
