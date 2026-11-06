import type { NextRequest } from "next/server";
import { ID, invalid, streamFromApi } from "@/lib/http/proxy.server";
import { apiQueryFromParams, withQuery } from "@/utils/filters";

/**
 * The parts of an arrangement version as a zip, all of them or those of some instruments and transpositions.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return ID.test(id)
    ? streamFromApi(request, withQuery(`/api/versions/${id}/parts/zip`, apiQueryFromParams(request.nextUrl.searchParams)))
    : invalid();
}
