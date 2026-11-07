"use server";

import { revalidatePath } from "next/cache";
import * as admin from "@/lib/admin/admin.server";
import { type ActionResult, toActionResult } from "@/lib/graphql.server";
import type { FileRoleInput, InstrumentInput, MaintenanceJob, SettingsInput } from "@/gql/graphql";
import { ID } from "@/utils/filters";
import { INSTRUMENT_GROUPS, isPitch } from "@/utils/music";
import { withPolicyAction } from "@/utils/route.server";
import { Policies } from "@/utils/policy.server";

const asAdmin = <T, >(work: () => Promise<T>) => withPolicyAction(Policies.admin.requireAdmin, () => toActionResult(async () => {
  const result = await work();

  revalidatePath("/", "layout");
  return result;
}));

function requireId(...ids: unknown[]) {
  if (!ids.every(id => typeof id === "string" && ID.test(id))) {
    throw new Error("Invalid id");
  }
}

function requireIds(ids: unknown) {
  if (!Array.isArray(ids) || ids.length > 1000) {
    throw new Error("Invalid ids");
  }
  requireId(...ids);
}

function names(input: { nameSv: string; nameEn: string }) {
  const nameSv = input.nameSv.trim();
  const nameEn = input.nameEn.trim();

  if (!nameSv || !nameEn || nameSv.length > 100 || nameEn.length > 100) {
    throw new Error("Invalid name");
  }
  return { nameSv, nameEn };
}

function instrument(input: InstrumentInput): InstrumentInput {
  if (!(INSTRUMENT_GROUPS as readonly string[]).includes(input.group)) {
    throw new Error("Invalid group");
  }
  if (input.defaultTransposition && (!isPitch(input.defaultTransposition.pitch)
    || ![-1, 0, 1].includes(input.defaultTransposition.octave ?? 0))) {
    throw new Error("Invalid transposition");
  }
  return {
    ...names(input),
    group: input.group,
    abbreviations: (input.abbreviations ?? []).map(value => value.trim()).filter(Boolean).slice(0, 50),
    defaultTransposition: input.defaultTransposition ?? null,
  };
}

export async function saveSettingsAction(input: SettingsInput): Promise<ActionResult<null>> {
  return asAdmin(async () => {
    await admin.settingsUpdate(input);
    return null;
  });
}

/**
 * Starts a maintenance job in the background. The data is false when it is already running.
 */
export async function runMaintenanceJobAction(job: MaintenanceJob): Promise<ActionResult<boolean>> {
  return asAdmin(async () => admin.maintenanceJobRun(job));
}

export async function createInstrumentAction(input: InstrumentInput) {
  return asAdmin(async () => {
    await admin.instrumentCreate(instrument(input));
    return null;
  });
}

export async function updateInstrumentAction(id: string, input: InstrumentInput) {
  requireId(id);
  return asAdmin(async () => {
    await admin.instrumentUpdate(id, instrument(input));
    return null;
  });
}

export async function reorderInstrumentsAction(ids: string[]) {
  requireIds(ids);
  return asAdmin(async () => {
    await admin.instrumentsReorder(ids);
    return null;
  });
}

export async function deleteInstrumentAction(id: string) {
  requireId(id);
  return asAdmin(async () => {
    await admin.instrumentDelete(id);
    return null;
  });
}

export async function mergeInstrumentAction(id: string, intoId: string) {
  requireId(id, intoId);
  return asAdmin(async () => {
    await admin.instrumentMerge(id, intoId);
    return null;
  });
}

export async function createFileRoleAction(input: FileRoleInput) {
  return asAdmin(async () => {
    await admin.fileRoleCreate(names(input));
    return null;
  });
}

export async function updateFileRoleAction(id: string, input: FileRoleInput) {
  requireId(id);
  return asAdmin(async () => {
    await admin.fileRoleUpdate(id, names(input));
    return null;
  });
}

export async function reorderFileRolesAction(ids: string[]) {
  requireIds(ids);
  return asAdmin(async () => {
    await admin.fileRolesReorder(ids);
    return null;
  });
}

export async function deleteFileRoleAction(id: string) {
  requireId(id);
  return asAdmin(async () => {
    await admin.fileRoleDelete(id);
    return null;
  });
}
