import type { NextRequest } from "next/server";
import { ID, invalid, streamFromApi } from "@/lib/http/proxy.server";

/**
 * A file, for reading in the page (pdf.js asks for byte ranges) or, with `download=true`, as a download.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!ID.test(id)) {
    return invalid();
  }

  const download = request.nextUrl.searchParams.get("download") === "true";

  return streamFromApi(request, `/api/files/${id}?download=${download}`);
}
