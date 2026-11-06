import type { NextRequest } from "next/server";
import { invalid, streamFromApi } from "@/lib/http/proxy.server";
import { TOKEN } from "@/lib/share/share.server";
import { sharePath } from "@/utils/share-paths";

/**
 * What a share link opens, for anyone with its token and without a session: files (with byte ranges), previews and
 * zips, forwarded to the server's /api/share/{token}/… without the visitor's token. Only these paths pass:
 * files/{id}, files/{id}/preview, versions/{id}/zip, versions/{id}/parts/zip and parts/zip.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string; path: string[] }> }) {
  const { token, path } = await params;
  const target = sharePath(path, request.nextUrl.searchParams);

  if (!TOKEN.test(token) || !target) {
    return invalid();
  }
  return streamFromApi(request, `/api/share/${token}/${target}`, { anonymous: true });
}
