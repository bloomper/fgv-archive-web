"use server";

import { revalidatePath } from "next/cache";
import * as editing from "@/lib/archive/editing.server";
import { searchSpex } from "@/lib/archive/archive.server";
import { trashEmpty } from "@/lib/admin/admin.server";
import { type ActionResult, toActionResult } from "@/lib/graphql.server";
import type {
  FileInput,
  ManuscriptInput,
  NumberInput,
  ShareLinkInput,
  TranspositionInput,
  VersionInput,
} from "@/gql/graphql";
import { ID } from "@/utils/filters";
import { isPitch } from "@/utils/music";
import { withPolicyAction } from "@/utils/route.server";
import { Policies } from "@/utils/policy.server";

const UPLOAD = /^[0-9a-f-]{36}$/;

function requireId(...ids: unknown[]) {
  if (!ids.every(id => typeof id === "string" && ID.test(id))) {
    throw new Error("Invalid id");
  }
}

function requireIds(ids: unknown[]) {
  if (!Array.isArray(ids) || ids.length > 1000) {
    throw new Error("Invalid ids");
  }
  requireId(...ids);
}

/**
 * Every page shows material (start page, spex, manuscripts, arrangements, search), and Next keeps visited pages alive,
 * so a change refreshes them all.
 */
function changed() {
  revalidatePath("/", "layout");
}

const editor = <T, >(work: () => Promise<T>) =>
  withPolicyAction(Policies.editor.requireEditor, () => toActionResult(async () => {
    const result = await work();

    changed();
    return result;
  }));
const admin = <T, >(work: () => Promise<T>) =>
  withPolicyAction(Policies.admin.requireAdmin, () => toActionResult(async () => {
    const result = await work();

    changed();
    return result;
  }));

export async function searchSpexAction(q: string) {
  return withPolicyAction(Policies.editor.requireEditor, () => toActionResult(async () => searchSpex(q.slice(0, 100))));
}

// --- Manuscripts and arrangements ---------------------------------------------------------------------------------

/** Creates a manuscript with its first version; the data is the version's id. */
export async function createManuscriptAction(input: ManuscriptInput): Promise<ActionResult<{ id: string; versionId?: string }>> {
  requireId(input.spexId);
  return editor(async () => {
    const created = await editing.manuscriptCreate(input);

    if (!created) {
      throw new Error("Not created");
    }
    return { id: created.id, versionId: created.versions[0]?.id };
  });
}

export async function updateManuscriptAction(id: string, input: ManuscriptInput) {
  requireId(id);
  return editor(async () => {
    await editing.manuscriptUpdate(id, { title: input.title, authors: input.authors, description: input.description });
    return null;
  });
}

export async function createArrangementAction(numberId: string): Promise<ActionResult<{ id: string; versionId?: string }>> {
  requireId(numberId);
  return editor(async () => {
    const created = await editing.arrangementCreate({ numberId });

    if (!created) {
      throw new Error("Not created");
    }
    return { id: created.id, versionId: created.versions[0]?.id };
  });
}

export async function updateArrangementAction(id: string, description: string | null) {
  requireId(id);
  return editor(async () => {
    await editing.arrangementUpdate(id, { description: description?.trim() || null });
    return null;
  });
}

type Parent = "MANUSCRIPT" | "ARRANGEMENT";

export async function trashParentAction(kind: Parent, id: string, trashed: boolean) {
  requireId(id);
  return editor(async () => {
    if (kind === "MANUSCRIPT") {
      await (trashed ? editing.manuscriptTrash(id) : editing.manuscriptRestore(id));
    } else {
      await (trashed ? editing.arrangementTrash(id) : editing.arrangementRestore(id));
    }
    return null;
  });
}

export async function deleteParentAction(kind: Parent, id: string) {
  requireId(id);
  return admin(async () => {
    await (kind === "MANUSCRIPT" ? editing.manuscriptDelete(id) : editing.arrangementDelete(id));
    return null;
  });
}

// --- Versions -----------------------------------------------------------------------------------------------------

export async function createVersionAction(parentId: string, input: VersionInput): Promise<ActionResult<string | undefined>> {
  requireId(parentId);
  return editor(async () => (await editing.versionCreate(parentId, input))?.id);
}

export async function updateVersionAction(id: string, input: VersionInput) {
  requireId(id);
  return editor(async () => {
    await editing.versionUpdate(id, input);
    return null;
  });
}

export async function copyVersionAction(id: string): Promise<ActionResult<string | undefined>> {
  requireId(id);
  return editor(async () => (await editing.versionCopy(id))?.id);
}

export async function publishVersionAction(id: string, published: boolean) {
  requireId(id);
  return editor(async () => {
    await editing.versionPublish(id, published);
    return null;
  });
}

export async function recommendVersionAction(id: string, recommended: boolean) {
  requireId(id);
  return editor(async () => {
    await editing.versionRecommend(id, recommended);
    return null;
  });
}

export async function trashVersionAction(id: string, trashed: boolean) {
  requireId(id);
  return editor(async () => {
    await (trashed ? editing.versionTrash(id) : editing.versionRestore(id));
    return null;
  });
}

export async function deleteVersionAction(id: string) {
  requireId(id);
  return admin(async () => {
    await editing.versionDelete(id);
    return null;
  });
}

// --- Files --------------------------------------------------------------------------------------------------------

function checkTransposition(transposition: TranspositionInput | null | undefined) {
  if (transposition && (!isPitch(transposition.pitch) || ![-1, 0, 1].includes(transposition.octave ?? 0))) {
    throw new Error("Invalid transposition");
  }
}

/**
 * What the server guesses from a file's name before it is uploaded, to prefill its role, instruments, desk and
 * transposition.
 */
export async function fileGuessAction(versionId: string, name: string) {
  requireId(versionId);
  return withPolicyAction(Policies.editor.requireEditor, () =>
    toActionResult(async () => editing.fileGuess(versionId, name.slice(0, 255))));
}

export async function addFileAction(versionId: string, uploadId: string, input: Omit<FileInput, "title"> & { title?: string | null }) {
  requireId(versionId, input.roleId, ...(input.instrumentIds ?? []));
  checkTransposition(input.transposition);
  if (!UPLOAD.test(uploadId)) {
    throw new Error("Invalid upload");
  }
  return editor(async () => (await editing.fileAdd({
    versionId,
    uploadId,
    title: input.title?.trim() || null,
    comment: input.comment?.trim() || null,
    roleId: input.roleId,
    instrumentIds: input.instrumentIds ?? [],
    desk: input.desk?.trim() || null,
    transposition: input.transposition ?? null,
  }))?.id);
}

export async function updateFileAction(id: string, input: FileInput) {
  requireId(id, input.roleId, ...(input.instrumentIds ?? []));
  checkTransposition(input.transposition);
  return editor(async () => {
    await editing.fileUpdate(id, {
      ...input,
      title: input.title.trim(),
      comment: input.comment?.trim() || null,
      desk: input.desk?.trim() || null,
    });
    return null;
  });
}

export async function replaceFileAction(id: string, uploadId: string) {
  requireId(id);
  if (!UPLOAD.test(uploadId)) {
    throw new Error("Invalid upload");
  }
  return editor(async () => {
    await editing.fileReplace(id, uploadId);
    return null;
  });
}

export async function reorderFilesAction(versionId: string, ids: string[]) {
  requireId(versionId);
  requireIds(ids);
  return editor(async () => {
    await editing.filesReorder(versionId, ids);
    return null;
  });
}

export async function deleteFileAction(id: string) {
  requireId(id);
  return editor(async () => {
    await editing.fileDelete(id);
    return null;
  });
}

// --- Numbers ------------------------------------------------------------------------------------------------------

function cleanNumber(input: NumberInput): NumberInput {
  const title = input.title.trim();

  if (!title || title.length > 255) {
    throw new Error("Invalid title");
  }
  return {
    title,
    originalSong: input.originalSong?.trim() || null,
    lyricist: input.lyricist?.trim() || null,
    composer: input.composer?.trim() || null,
  };
}

export async function createNumberAction(spexId: string, input: NumberInput) {
  requireId(spexId);
  return editor(async () => {
    await editing.numberCreate(spexId, cleanNumber(input));
    return null;
  });
}

export async function updateNumberAction(id: string, input: NumberInput) {
  requireId(id);
  return editor(async () => {
    await editing.numberUpdate(id, cleanNumber(input));
    return null;
  });
}

export async function deleteNumberAction(id: string) {
  requireId(id);
  return editor(async () => {
    await editing.numberDelete(id);
    return null;
  });
}

export async function pasteNumbersAction(spexId: string, text: string) {
  requireId(spexId);
  if (text.length > 50_000) {
    throw new Error("Too long");
  }
  return editor(async () => {
    await editing.numbersPaste(spexId, text);
    return null;
  });
}

export async function reorderNumbersAction(spexId: string, ids: string[]) {
  requireId(spexId);
  requireIds(ids);
  return editor(async () => {
    await editing.numbersReorder(spexId, ids);
    return null;
  });
}

export async function mergeNumberAction(id: string, intoId: string) {
  requireId(id, intoId);
  return editor(async () => {
    await editing.numberMerge(id, intoId);
    return null;
  });
}

// --- Share links --------------------------------------------------------------------------------------------------

/**
 * Creates a share link; the data is its token, shown once.
 */
export async function createShareLinkAction(input: ShareLinkInput): Promise<ActionResult<{ token: string; id: string }>> {
  requireId(...(input.versionIds ?? []), ...(input.fileIds ?? []), ...(input.instrumentIds ?? []));
  if (input.spexId) {
    requireId(input.spexId);
  }
  if (!(input.transpositions ?? []).every(isPitch)) {
    throw new Error("Invalid transpositions");
  }

  const name = input.name.trim();

  if (!name || name.length > 200) {
    throw new Error("Invalid name");
  }
  return editor(async () => {
    const created = await editing.shareLinkCreate({ ...input, name });

    if (!created) {
      throw new Error("Not created");
    }
    return { token: created.token, id: created.shareLink.id };
  });
}

export async function extendShareLinkAction(id: string, months: number) {
  requireId(id);
  if (!Number.isInteger(months) || months < 1 || months > 120) {
    throw new Error("Invalid months");
  }
  return editor(async () => {
    await editing.shareLinkExtend(id, months);
    return null;
  });
}

export async function renameShareLinkAction(id: string, name: string) {
  requireId(id);

  const trimmed = name.trim();

  if (!trimmed || trimmed.length > 200) {
    throw new Error("Invalid name");
  }
  return editor(async () => {
    await editing.shareLinkRename(id, trimmed);
    return null;
  });
}

/**
 * Marks an access request handled, or open again.
 */
export async function handleAccessRequestAction(id: string, handled: boolean) {
  requireId(id);
  return editor(async () => {
    await editing.accessRequestHandle(id, handled);
    return null;
  });
}

export async function revokeShareLinkAction(id: string) {
  requireId(id);
  return editor(async () => {
    await editing.shareLinkRevoke(id);
    return null;
  });
}

// --- Trash --------------------------------------------------------------------------------------------------------

export async function emptyTrashAction() {
  return admin(async () => {
    await trashEmpty();
    return null;
  });
}
