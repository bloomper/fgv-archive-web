import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api.server";
import { crossSite, sameOrigin } from "@/lib/http/proxy.server";

const UPLOAD_ID = /^[0-9a-f-]{36}$/;
const TUS_REQUEST_HEADERS = ["tus-resumable", "upload-length", "upload-metadata", "upload-offset", "content-type", "content-length"];
const TUS_RESPONSE_HEADERS = ["tus-resumable", "tus-version", "tus-extension", "tus-max-size", "upload-offset",
  "upload-length", "location", "cache-control"];

type Params = { params: Promise<{ path?: string[] }> };

/**
 * The tus endpoint for uploads, passed to the server with the user's token. Chunks are at most 50 MB.
 */
async function forward(request: NextRequest, { params }: Params): Promise<Response> {
  const { path = [] } = await params;

  if (path.length > 1 || (path.length === 1 && !UPLOAD_ID.test(path[0]))) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (request.method !== "HEAD" && request.method !== "OPTIONS" && !sameOrigin(request)) {
    return crossSite();
  }

  const headers = new Headers();

  for (const name of TUS_REQUEST_HEADERS) {
    const value = request.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  const init: RequestInit & { duplex?: "half" } = { method: request.method, headers };

  if (request.method === "PATCH") {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await apiFetch(`/api/uploads${path.length ? `/${path[0]}` : ""}`, init);
  const out = new Headers();

  for (const name of TUS_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);

    if (value) {
      out.set(name, value);
    }
  }
  out.set("Access-Control-Expose-Headers", TUS_RESPONSE_HEADERS.join(", "));
  return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: out });
}

export const POST = forward;
export const PATCH = forward;
export const HEAD = forward;
export const DELETE = forward;
export const OPTIONS = forward;
