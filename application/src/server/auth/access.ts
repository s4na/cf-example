import type { MiddlewareHandler } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";

export type AccessBindings = {
  ADMIN_AUTH_BYPASS?: string;
  CF_ACCESS_AUD?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
};

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getKeySet(domain: string) {
  const url = new URL("/cdn-cgi/access/certs", domain).toString();
  const cached = keySets.get(url);
  if (cached) return cached;

  const keySet = createRemoteJWKSet(new URL(url));
  keySets.set(url, keySet);
  return keySet;
}

export const requireAdmin: MiddlewareHandler<{
  Bindings: AccessBindings;
}> = async (context, next) => {
  if (context.env.ADMIN_AUTH_BYPASS === "true") {
    await next();
    return;
  }

  const audience = context.env.CF_ACCESS_AUD;
  const domain = context.env.CF_ACCESS_TEAM_DOMAIN;
  if (!audience || !domain) {
    return context.json({ error: "管理画面の認証が設定されていません" }, 503);
  }

  const token = context.req.header("Cf-Access-Jwt-Assertion");
  if (!token) {
    return context.json({ error: "認証が必要です" }, 401);
  }

  try {
    await jwtVerify(token, getKeySet(domain), {
      algorithms: ["RS256"],
      audience,
      issuer: domain.replace(/\/$/, ""),
    });
  } catch {
    return context.json({ error: "認証を確認できませんでした" }, 403);
  }

  await next();
};
