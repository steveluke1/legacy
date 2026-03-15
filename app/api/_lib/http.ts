import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

interface SuccessPayload {
  [key: string]: unknown;
}

interface ErrorPayload {
  success: false;
  error: string;
  issues?: string[];
}

export function jsonOk(payload: SuccessPayload = {}, init?: ResponseInit) {
  return NextResponse.json({ success: true, ...payload }, init);
}

export function jsonError(error: string, status = 400, issues?: string[]) {
  const payload: ErrorPayload = { success: false, error };
  if (issues?.length) {
    payload.issues = issues;
  }

  return NextResponse.json(payload, { status });
}

export function unauthorized(message = "Nao autenticado.") {
  return jsonError(message, 401);
}

export function getRequestMeta(request: Request) {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  const body = await request.json();
  return schema.parse(body);
}

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return jsonError(
      error.issues[0]?.message ?? "Dados invalidos.",
      422,
      error.issues.map((issue) => issue.message)
    );
  }

  if (error instanceof SyntaxError) {
    return jsonError("Corpo JSON invalido.", 400);
  }

  return jsonError(error instanceof Error ? error.message : fallbackMessage, 400);
}