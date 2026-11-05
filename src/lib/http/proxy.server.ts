import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api.server";

export const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PASSED_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "content-disposition",
  "cache-control", "etag", "last-modified"];

/**
 * Whether a request that changes something comes from this application's own pages. Route handlers get none of the
 * origin check server actions have, and the session cookie is sent from sibling subdomains too.
 */
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const invalid = () => NextResponse.json({ code: "BAD_REQUEST", message: "Invalid request" }, { status: 400 });
export const crossSite = () => NextResponse.json({ code: "FORBIDDEN", message: "Cross-site request" }, { status: 403 });

/**
 * Streams a GET from the server to the browser with the user's token (none for share links), passing byte ranges both
 * ways so that pdf.js loads a PDF page by page. The browser never holds the token. Errors keep the server's JSON
 * (code and message), so that a share link page can say who made an expired link.
 */
export async function streamFromApi(request: NextRequest, path: string,
                                    { anonymous = false, extra = {} }: { anonymous?: boolean; extra?: Record<string, string> } = {}): Promise<Response> {
  const headers = new Headers();
  const range = request.headers.get("range");

  if (range) {
    headers.set("Range", range);
  }

  // Aborted with the browser's request, e.g. when the reader closes, so the server stops sending at once
  const upstream = await apiFetch(path, { headers, signal: request.signal }, anonymous);

  if (!upstream.ok && upstream.status !== 206) {
    const body = (upstream.headers.get("content-type") ?? "").includes("json")
      ? await upstream.json().catch(() => null) as Record<string, unknown> | null
      : (await upstream.body?.cancel(), null);

    return NextResponse.json({
      code: typeof body?.code === "string" ? body.code : "NOT_AVAILABLE",
      message: typeof body?.message === "string" ? body.message : "Not available",
      ...(typeof body?.createdByName === "string" ? { createdByName: body.createdByName } : {}),
    }, { status: upstream.status });
  }

  const out = new Headers(extra);

  for (const name of PASSED_HEADERS) {
    const value = upstream.headers.get(name);

    if (value && !out.has(name)) {
      out.set(name, value);
    }
  }
  out.set("X-Content-Type-Options", "nosniff");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
