import { createHash, randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, USER_SESSION_COOKIE } from "@/lib/constants/auth";
import type { SessionRole } from "@/lib/types/session";
import { getSessionMaxAge } from "@/server/session/config";

export function generateSessionToken() {
  return `${randomUUID()}_${randomUUID()}`.replace(/-/g, "");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function getSessionCookieName(role: SessionRole) {
  return role === "admin" ? ADMIN_SESSION_COOKIE : USER_SESSION_COOKIE;
}

export async function readSessionCookie(role: SessionRole) {
  const cookieStore = await cookies();
  return cookieStore.get(getSessionCookieName(role))?.value ?? null;
}

export function setSessionCookie(response: NextResponse, role: SessionRole, token: string, expiresAt: string) {
  response.cookies.set({
    name: getSessionCookieName(role),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    maxAge: getSessionMaxAge(role),
  });
}

export function clearSessionCookie(response: NextResponse, role: SessionRole) {
  response.cookies.set({
    name: getSessionCookieName(role),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
  });
}
