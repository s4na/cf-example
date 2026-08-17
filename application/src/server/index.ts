import { Hono } from "hono";

type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/health", (context) =>
  context.json({
    status: "ok",
  }),
);

app.all("*", (context) => context.env.ASSETS.fetch(context.req.raw));

export default app;
