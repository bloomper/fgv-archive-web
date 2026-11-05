import type { NextRequest } from "next/server";
import { ID, invalid, streamFromApi } from "@/lib/http/proxy.server";
import { apiQueryFromParams, withQuery } from "@/utils/filters";

/**
 * The parts of some instruments and transpositions across a spex' arrangements, in the order of the show, as a zip.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return ID.test(id)
    ? streamFromApi(request, withQuery(`/api/spex/${id}/parts/zip`, apiQueryFromParams(request.nextUrl.searchParams)))
    : invalid();
}
