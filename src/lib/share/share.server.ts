import "server-only";

import { getLocale } from "next-intl/server";
import { print } from "graphql";
import { graphql } from "@/gql";
import type { PartFilter, SharedViewQuery } from "@/gql/graphql";
import { GraphQLRequestError, type ErrorCode } from "@/lib/graphql.server";

const SharedViewDocument = graphql(`
    query SharedView($token: String!, $parts: PartFilter) {
        sharedView(token: $token) {
            name status createdByName expiresAt transpositions
            spex { id title year categoryName }
            instruments { ...InstrumentBrief }
            versions {
                id kind title label numberPosition originalSong lyricist composer authors arranger tempo duration date notes
                spex { id title year categoryName }
                usedIn { id title year categoryName }
                key { tonic mode }
                modulations { tonic mode }
                instrumentation { count instrument { ...InstrumentBrief } }
                files(parts: $parts) { ...FileFields }
                allFiles: files { id instruments { ...InstrumentBrief } transposition { pitch octave } }
            }
        }
    }
`);

/** A share link's token: long, random, base64url. */
export const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;

export type SharedView = NonNullable<SharedViewQuery["sharedView"]>;

/**
 * What a share link opens, asked without the visitor's session: a share link page never depends on a login, and works
 * the same for someone logged in. Null for an unknown token. With parts, each version's files are only the matching
 * parts (allFiles keeps them all, for the filter's choices).
 */
export async function getSharedView(token: string, parts: PartFilter | null = null): Promise<SharedView | null> {
  if (!TOKEN.test(token)) {
    return null;
  }

  const response = await fetch(process.env.API_GRAPHQL_ENDPOINT || "http://localhost/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Language": await getLocale() },
    body: JSON.stringify({ query: print(SharedViewDocument), variables: { token, parts } }),
    cache: "no-store",
  });
  const body = await response.json() as {
    data?: SharedViewQuery | null;
    errors?: { message: string; extensions?: { classification?: string } }[]
  };

  if (body.errors?.length) {
    throw new GraphQLRequestError((body.errors[0].extensions?.classification ?? "INTERNAL_ERROR") as ErrorCode,
      body.errors[0].message);
  }
  return body.data?.sharedView ?? null;
}
