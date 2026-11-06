import type { NextRequest } from "next/server";
import { ID, invalid, streamFromApi } from "@/lib/http/proxy.server";

/**
 * A file's first-page preview, a PNG.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return ID.test(id) ? streamFromApi(request, `/api/files/${id}/preview`) : invalid();
}
