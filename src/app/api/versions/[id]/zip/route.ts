import type { NextRequest } from "next/server";
import { ID, invalid, streamFromApi } from "@/lib/http/proxy.server";

/**
 * Every file of a version, as a zip streamed by the server.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return ID.test(id) ? streamFromApi(request, `/api/versions/${id}/zip`) : invalid();
}
