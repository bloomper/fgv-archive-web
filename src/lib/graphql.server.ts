import "server-only";

import type { AnyVariables, CombinedError, OperationContext } from "@urql/core";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { getClient } from "@/lib/urql.server";

/**
 * The error codes the server returns in `extensions.classification`.
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "SPEXREGISTER_UNAVAILABLE"
  | "DIRECTORY_UNAVAILABLE"
  | "INTERNAL_ERROR";

const KNOWN_CODES: ReadonlySet<string> = new Set<ErrorCode>([
  "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST", "CONFLICT", "SPEXREGISTER_UNAVAILABLE", "DIRECTORY_UNAVAILABLE",
]);

/**
 * A GraphQL error with the server's code and its localised message.
 */
export class GraphQLRequestError extends Error {
  constructor(readonly code: ErrorCode, message: string) {
    super(message);
    this.name = "GraphQLRequestError";
  }
}

export function toRequestError(error: CombinedError): GraphQLRequestError {
  const first = error.graphQLErrors[0];
  const classification = first?.extensions?.classification;
  const code = typeof classification === "string" && KNOWN_CODES.has(classification)
    ? classification as ErrorCode
    : "INTERNAL_ERROR";

  return new GraphQLRequestError(code, first?.message ?? error.message);
}

export async function runQuery<TData, TVariables extends AnyVariables>(
  query: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context?: Partial<OperationContext>,
): Promise<TData | undefined> {
  const result = await getClient().query<TData, TVariables>(query, variables, context).toPromise();

  if (result.error) {
    throw toRequestError(result.error);
  }

  return result.data;
}

export async function runMutation<TData, TVariables extends AnyVariables>(
  mutation: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context?: Partial<OperationContext>,
): Promise<TData | undefined> {
  const result = await getClient().mutation<TData, TVariables>(mutation, variables, context).toPromise();

  if (result.error) {
    throw toRequestError(result.error);
  }

  return result.data;
}

/**
 * What a server action returns to the client: the data, or the error code and message to show.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: ErrorCode; message: string };

export async function toActionResult<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    if (error instanceof GraphQLRequestError) {
      return { ok: false, code: error.code, message: error.message };
    }
    throw error;
  }
}
