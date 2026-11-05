import "server-only";

import { graphql } from "@/gql";
import { runMutation, runQuery } from "@/lib/graphql.server";
import type { AuditFilter, FileRoleInput, InstrumentInput, MaintenanceJob, SettingsInput } from "@/gql/graphql";

const TrashQuery = graphql(`
    query Trash {
        trash {
            manuscripts { id title spex { ...SpexBrief } versions { id } }
            arrangements { id number { id title position spex { ...SpexBrief } } versions { id } }
            versions {
                id kind label lastModifiedAt createdAt
                manuscript { id title spex { ...SpexBrief } }
                arrangement { id number { id title spex { ...SpexBrief } } }
            }
        }
    }
`);
const AuditLogQuery = graphql(`
    query AuditLog($page: Int, $size: Int, $filter: AuditFilter) {
        auditLog(page: $page, size: $size, filter: $filter) {
            totalCount page size
            entries { id at actorId actorName action entityType entityId summary }
        }
    }
`);
const AuditActorsQuery = graphql(`
    query AuditActors { auditActors { id name } }
`);
const SettingsQuery = graphql(`
    query Settings {
        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths accessRequestRecipients }
    }
`);
const StorageQuery = graphql(`
    query Storage { storage { filesBytes previewsBytes freeBytes fileCount } }
`);
const ShareLinksQuery = graphql(`
    query ShareLinks($all: Boolean) {
        shareLinks(all: $all) {
            id name createdById createdByName createdAt expiresAt revokedAt revokedByName status downloadCount
            spexId spex { ...SpexBrief }
            transpositions
            instruments { ...InstrumentBrief }
            versions {
                id label kind
                manuscript { id title spex { ...SpexBrief } }
                arrangement { id number { id title spex { ...SpexBrief } } }
            }
            files { id title versionId }
            downloads { count file { id title } }
        }
    }
`);
const AccessRequestsQuery = graphql(`
    query AccessRequests($handled: Boolean) {
        accessRequests(handled: $handled) { id userName userEmail reason createdAt handledAt handledByName files { id title versionId } }
    }
`);
const MaintenanceJobsQuery = graphql(`
    query MaintenanceJobs { maintenanceJobs { job schedule running lastStartedAt lastFinishedAt lastSucceeded } }
`);

const TrashEmptyMutation = graphql(`mutation TrashEmpty { trashEmpty }`);
const SettingsUpdateMutation = graphql(`
    mutation SettingsUpdate($input: SettingsInput!) { settingsUpdate(input: $input) { maxUploadMb } }
`);
const MaintenanceJobRunMutation = graphql(`mutation MaintenanceJobRun($job: MaintenanceJob!) { maintenanceJobRun(job: $job) }`);
const InstrumentCreate = graphql(`mutation InstrumentCreate($input: InstrumentInput!) { instrumentCreate(input: $input) { id } }`);
const InstrumentUpdate = graphql(`mutation InstrumentUpdate($id: ID!, $input: InstrumentInput!) { instrumentUpdate(id: $id, input: $input) { id } }`);
const InstrumentsReorder = graphql(`mutation InstrumentsReorder($ids: [ID!]!) { instrumentsReorder(ids: $ids) { id } }`);
const InstrumentDelete = graphql(`mutation InstrumentDelete($id: ID!) { instrumentDelete(id: $id) }`);
const InstrumentMerge = graphql(`mutation InstrumentMerge($id: ID!, $intoId: ID!) { instrumentMerge(id: $id, intoId: $intoId) { id } }`);
const FileRoleCreate = graphql(`mutation FileRoleCreate($input: FileRoleInput!) { fileRoleCreate(input: $input) { id } }`);
const FileRoleUpdate = graphql(`mutation FileRoleUpdate($id: ID!, $input: FileRoleInput!) { fileRoleUpdate(id: $id, input: $input) { id } }`);
const FileRolesReorder = graphql(`mutation FileRolesReorder($ids: [ID!]!) { fileRolesReorder(ids: $ids) { id } }`);
const FileRoleDelete = graphql(`mutation FileRoleDelete($id: ID!) { fileRoleDelete(id: $id) }`);

export const getTrash = async () => (await runQuery(TrashQuery, {}))?.trash;
export const getAuditLog = async (page: number, size: number, filter: AuditFilter = {}) =>
  (await runQuery(AuditLogQuery, { page, size, filter }))?.auditLog;
export const getAuditActors = async () => (await runQuery(AuditActorsQuery, {}))?.auditActors ?? [];
export const getSettings = async () => (await runQuery(SettingsQuery, {}))?.settings;
export const getStorage = async () => (await runQuery(StorageQuery, {}))?.storage;
export const getShareLinks = async (all: boolean) => (await runQuery(ShareLinksQuery, { all }))?.shareLinks ?? [];
export const getAccessRequests = async (handled: boolean | null) => (await runQuery(AccessRequestsQuery, { handled }))?.accessRequests ?? [];
export const getMaintenanceJobs = async () => (await runQuery(MaintenanceJobsQuery, {}))?.maintenanceJobs ?? [];
export const trashEmpty = () => runMutation(TrashEmptyMutation, {});
export const settingsUpdate = (input: SettingsInput) => runMutation(SettingsUpdateMutation, { input });
export const maintenanceJobRun = async (job: MaintenanceJob) => Boolean((await runMutation(MaintenanceJobRunMutation, { job }))?.maintenanceJobRun);
export const instrumentCreate = (input: InstrumentInput) => runMutation(InstrumentCreate, { input });
export const instrumentUpdate = (id: string, input: InstrumentInput) => runMutation(InstrumentUpdate, { id, input });
export const instrumentsReorder = (ids: string[]) => runMutation(InstrumentsReorder, { ids });
export const instrumentDelete = (id: string) => runMutation(InstrumentDelete, { id });
export const instrumentMerge = (id: string, intoId: string) => runMutation(InstrumentMerge, { id, intoId });
export const fileRoleCreate = (input: FileRoleInput) => runMutation(FileRoleCreate, { input });
export const fileRoleUpdate = (id: string, input: FileRoleInput) => runMutation(FileRoleUpdate, { id, input });
export const fileRolesReorder = (ids: string[]) => runMutation(FileRolesReorder, { ids });
export const fileRoleDelete = (id: string) => runMutation(FileRoleDelete, { id });
