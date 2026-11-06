/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n    query Trash {\n        trash {\n            manuscripts { id title spex { ...SpexBrief } versions { id } }\n            arrangements { id number { id title position spex { ...SpexBrief } } versions { id } }\n            versions {\n                id kind label lastModifiedAt createdAt\n                manuscript { id title spex { ...SpexBrief } }\n                arrangement { id number { id title spex { ...SpexBrief } } }\n            }\n        }\n    }\n": typeof types.TrashDocument,
    "\n    query AuditLog($page: Int, $size: Int, $filter: AuditFilter) {\n        auditLog(page: $page, size: $size, filter: $filter) {\n            totalCount page size\n            entries { id at actorId actorName action entityType entityId summary }\n        }\n    }\n": typeof types.AuditLogDocument,
    "\n    query AuditActors { auditActors { id name } }\n": typeof types.AuditActorsDocument,
    "\n    query Settings {\n        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths accessRequestRecipients }\n    }\n": typeof types.SettingsDocument,
    "\n    query Storage { storage { filesBytes previewsBytes freeBytes fileCount } }\n": typeof types.StorageDocument,
    "\n    query ShareLinks($all: Boolean) {\n        shareLinks(all: $all) {\n            id name createdById createdByName createdAt expiresAt revokedAt revokedByName status downloadCount\n            spexId spex { ...SpexBrief }\n            transpositions\n            instruments { ...InstrumentBrief }\n            versions {\n                id label kind\n                manuscript { id title spex { ...SpexBrief } }\n                arrangement { id number { id title spex { ...SpexBrief } } }\n            }\n            files { id title versionId }\n            downloads { count file { id title } }\n        }\n    }\n": typeof types.ShareLinksDocument,
    "\n    query AccessRequests($handled: Boolean) {\n        accessRequests(handled: $handled) { id userName userEmail reason createdAt handledAt handledByName files { id title versionId } }\n    }\n": typeof types.AccessRequestsDocument,
    "\n    query MaintenanceJobs { maintenanceJobs { job schedule running lastStartedAt lastFinishedAt lastSucceeded } }\n": typeof types.MaintenanceJobsDocument,
    "mutation TrashEmpty { trashEmpty }": typeof types.TrashEmptyDocument,
    "\n    mutation SettingsUpdate($input: SettingsInput!) { settingsUpdate(input: $input) { maxUploadMb } }\n": typeof types.SettingsUpdateDocument,
    "mutation MaintenanceJobRun($job: MaintenanceJob!) { maintenanceJobRun(job: $job) }": typeof types.MaintenanceJobRunDocument,
    "mutation InstrumentCreate($input: InstrumentInput!) { instrumentCreate(input: $input) { id } }": typeof types.InstrumentCreateDocument,
    "mutation InstrumentUpdate($id: ID!, $input: InstrumentInput!) { instrumentUpdate(id: $id, input: $input) { id } }": typeof types.InstrumentUpdateDocument,
    "mutation InstrumentsReorder($ids: [ID!]!) { instrumentsReorder(ids: $ids) { id } }": typeof types.InstrumentsReorderDocument,
    "mutation InstrumentDelete($id: ID!) { instrumentDelete(id: $id) }": typeof types.InstrumentDeleteDocument,
    "mutation InstrumentMerge($id: ID!, $intoId: ID!) { instrumentMerge(id: $id, intoId: $intoId) { id } }": typeof types.InstrumentMergeDocument,
    "mutation FileRoleCreate($input: FileRoleInput!) { fileRoleCreate(input: $input) { id } }": typeof types.FileRoleCreateDocument,
    "mutation FileRoleUpdate($id: ID!, $input: FileRoleInput!) { fileRoleUpdate(id: $id, input: $input) { id } }": typeof types.FileRoleUpdateDocument,
    "mutation FileRolesReorder($ids: [ID!]!) { fileRolesReorder(ids: $ids) { id } }": typeof types.FileRolesReorderDocument,
    "mutation FileRoleDelete($id: ID!) { fileRoleDelete(id: $id) }": typeof types.FileRoleDeleteDocument,
    "\n    query Me {\n        me { username displayName roles }\n        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths }\n    }\n": typeof types.MeDocument,
    "\n    query Home {\n        categories { id name spexCount }\n        years\n        recentVersions(limit: 12) {\n            ...VersionFields\n            manuscript { id title spex { ...SpexBrief } }\n            arrangement { id number { id title position spex { ...SpexBrief } } }\n        }\n    }\n": typeof types.HomeDocument,
    "\n    query Browse { categories { id name spexCount } years }\n": typeof types.BrowseDocument,
    "\n    query SpexList($filter: SpexFilter) {\n        spexList(filter: $filter) {\n            ...SpexBrief manuscriptCount arrangementCount\n            revivals { ...SpexBrief manuscriptCount arrangementCount }\n        }\n    }\n": typeof types.SpexListDocument,
    "\n    query SpexPage($id: ID!) {\n        spex(id: $id) {\n            ...SpexBrief numbersInherited manuscriptCount arrangementCount\n            original { ...SpexBrief }\n            revivals { ...SpexBrief }\n            manuscripts {\n                id title authors description trashed\n                versions { ...VersionFields }\n            }\n            numbers {\n                id spexId position title originalSong lyricist composer\n                arrangement {\n                    id trashed\n                    versions { id label published restricted recommended trashed key { tonic mode } usedIn { ...SpexBrief } }\n                }\n            }\n        }\n    }\n": typeof types.SpexPageDocument,
    "\n    query SpexArrangements($id: ID!, $parts: PartFilter) {\n        spex(id: $id) {\n            ...SpexBrief\n            arrangements(parts: $parts) {\n                id\n                number { id position title }\n                partsVersion(usedIn: $id) { id label files(parts: $parts) { ...FileFields } }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n": typeof types.SpexArrangementsDocument,
    "\n    query Manuscript($id: ID!) {\n        manuscript(id: $id) {\n            id spexId title authors description trashed createdAt\n            spex { ...SpexBrief revivals { ...SpexBrief } }\n            versions {\n                ...VersionFields\n                files { ...FileFields }\n                usedIn { id numbers { id position title arrangement { id } } }\n            }\n        }\n    }\n": typeof types.ManuscriptDocument,
    "\n    query Arrangement($id: ID!, $parts: PartFilter) {\n        arrangement(id: $id) {\n            id numberId description trashed createdAt\n            number { id spexId position title originalSong lyricist composer spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } }\n            versions {\n                ...VersionFields\n                files(parts: $parts) { ...FileFields }\n                allFiles: files { id role { id } instruments { id } transposition { pitch octave } }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n": typeof types.ArrangementDocument,
    "\n    query Version($id: ID!) {\n        version(id: $id) {\n            ...VersionFields\n            files { ...FileFields }\n            manuscript { id title spexId spex { ...SpexBrief revivals { ...SpexBrief } } }\n            arrangement { id number { id title position spexId spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } } }\n        }\n    }\n": typeof types.VersionDocument,
    "\n    query File($id: ID!) {\n        file(id: $id) { ...FileFields }\n    }\n": typeof types.FileDocument,
    "\n    query FileVersion($id: ID!) {\n        version(id: $id) {\n            id kind parentId label canOpen restricted\n            files { id title pages canOpen contentType extension }\n            manuscript { id title spex { ...SpexBrief } }\n            arrangement { id number { id title position spex { ...SpexBrief } } }\n        }\n    }\n": typeof types.FileVersionDocument,
    "\n    query Search($q: String!, $parts: PartFilter, $key: KeyInput) {\n        search(q: $q, parts: $parts, key: $key) {\n            spex { ...SpexBrief }\n            manuscripts { id title authors spex { ...SpexBrief } }\n            numbers { id title position originalSong lyricist composer spex { ...SpexBrief } arrangement { id } }\n            arrangements { id description number { id title position spex { ...SpexBrief } } }\n            versions {\n                id label key { tonic mode } modulations { tonic mode } arranger\n                arrangement { id number { id title position spex { ...SpexBrief } } }\n            }\n            textHits {\n                page snippet\n                file { id title canOpen role { id nameSv nameEn } instruments { ...InstrumentBrief } transposition { pitch octave } }\n                version {\n                    id label kind\n                    manuscript { id title spex { ...SpexBrief } }\n                    arrangement { id number { id title spex { ...SpexBrief } } }\n                }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n": typeof types.SearchDocument,
    "\n    query Instruments {\n        instruments { ...InstrumentBrief abbreviations useCount }\n    }\n": typeof types.InstrumentsDocument,
    "\n    query FileRoles { fileRoles { id nameSv nameEn position fileCount } }\n": typeof types.FileRolesDocument,
    "\n    query Missing($categoryId: ID) {\n        categories { id name spexCount }\n        missingManuscripts(categoryId: $categoryId) { ...SpexBrief }\n        missingArrangements(categoryId: $categoryId) { id position title originalSong spex { ...SpexBrief } }\n    }\n": typeof types.MissingDocument,
    "\n    query SpexSearch($filter: SpexFilter) {\n        spexList(filter: $filter) { ...SpexBrief revivals { ...SpexBrief } }\n    }\n": typeof types.SpexSearchDocument,
    "mutation ManuscriptCreate($input: ManuscriptInput!) { manuscriptCreate(input: $input) { id versions { id } } }": typeof types.ManuscriptCreateDocument,
    "mutation ManuscriptUpdate($id: ID!, $input: ManuscriptInput!) { manuscriptUpdate(id: $id, input: $input) { id } }": typeof types.ManuscriptUpdateDocument,
    "mutation ManuscriptTrash($id: ID!) { manuscriptTrash(id: $id) { id } }": typeof types.ManuscriptTrashDocument,
    "mutation ManuscriptRestore($id: ID!) { manuscriptRestore(id: $id) { id } }": typeof types.ManuscriptRestoreDocument,
    "mutation ManuscriptDelete($id: ID!) { manuscriptDelete(id: $id) }": typeof types.ManuscriptDeleteDocument,
    "mutation ArrangementCreate($input: ArrangementInput!) { arrangementCreate(input: $input) { id versions { id } } }": typeof types.ArrangementCreateDocument,
    "mutation ArrangementUpdate($id: ID!, $input: ArrangementInput!) { arrangementUpdate(id: $id, input: $input) { id } }": typeof types.ArrangementUpdateDocument,
    "mutation ArrangementTrash($id: ID!) { arrangementTrash(id: $id) { id } }": typeof types.ArrangementTrashDocument,
    "mutation ArrangementRestore($id: ID!) { arrangementRestore(id: $id) { id } }": typeof types.ArrangementRestoreDocument,
    "mutation ArrangementDelete($id: ID!) { arrangementDelete(id: $id) }": typeof types.ArrangementDeleteDocument,
    "mutation VersionCreate($parentId: ID!, $input: VersionInput!) { versionCreate(parentId: $parentId, input: $input) { id } }": typeof types.VersionCreateDocument,
    "mutation VersionUpdate($id: ID!, $input: VersionInput!) { versionUpdate(id: $id, input: $input) { id } }": typeof types.VersionUpdateDocument,
    "mutation VersionCopy($id: ID!) { versionCopy(id: $id) { id } }": typeof types.VersionCopyDocument,
    "mutation VersionPublish($id: ID!, $published: Boolean!) { versionPublish(id: $id, published: $published) { id published } }": typeof types.VersionPublishDocument,
    "mutation VersionRecommend($id: ID!, $recommended: Boolean!) { versionRecommend(id: $id, recommended: $recommended) { id recommended } }": typeof types.VersionRecommendDocument,
    "mutation VersionTrash($id: ID!) { versionTrash(id: $id) { id } }": typeof types.VersionTrashDocument,
    "mutation VersionRestore($id: ID!) { versionRestore(id: $id) { id } }": typeof types.VersionRestoreDocument,
    "mutation VersionDelete($id: ID!) { versionDelete(id: $id) }": typeof types.VersionDeleteDocument,
    "mutation FileAdd($input: FileAddInput!) { fileAdd(input: $input) { id } }": typeof types.FileAddDocument,
    "mutation FileUpdate($id: ID!, $input: FileInput!) { fileUpdate(id: $id, input: $input) { id } }": typeof types.FileUpdateDocument,
    "mutation FileReplace($id: ID!, $uploadId: String!) { fileReplace(id: $id, uploadId: $uploadId) { id } }": typeof types.FileReplaceDocument,
    "mutation FilesReorder($versionId: ID!, $ids: [ID!]!) { filesReorder(versionId: $versionId, ids: $ids) { id } }": typeof types.FilesReorderDocument,
    "mutation FileDelete($id: ID!) { fileDelete(id: $id) }": typeof types.FileDeleteDocument,
    "\n    query FileGuess($versionId: ID!, $name: String!) {\n        fileGuess(versionId: $versionId, name: $name) {\n            title desk\n            role { id }\n            instruments { id }\n            transposition { pitch octave }\n        }\n    }\n": typeof types.FileGuessDocument,
    "mutation NumberCreate($spexId: ID!, $input: NumberInput!) { numberCreate(spexId: $spexId, input: $input) { id } }": typeof types.NumberCreateDocument,
    "mutation NumberUpdate($id: ID!, $input: NumberInput!) { numberUpdate(id: $id, input: $input) { id } }": typeof types.NumberUpdateDocument,
    "mutation NumberDelete($id: ID!) { numberDelete(id: $id) }": typeof types.NumberDeleteDocument,
    "mutation NumbersPaste($spexId: ID!, $text: String!) { numbersPaste(spexId: $spexId, text: $text) { id } }": typeof types.NumbersPasteDocument,
    "mutation NumbersReorder($spexId: ID!, $ids: [ID!]!) { numbersReorder(spexId: $spexId, ids: $ids) { id } }": typeof types.NumbersReorderDocument,
    "mutation NumberMerge($id: ID!, $intoId: ID!) { numberMerge(id: $id, intoId: $intoId) { id } }": typeof types.NumberMergeDocument,
    "mutation ShareLinkCreate($input: ShareLinkInput!) { shareLinkCreate(input: $input) { token shareLink { id name expiresAt } } }": typeof types.ShareLinkCreateDocument,
    "mutation ShareLinkExtend($id: ID!, $months: Int!) { shareLinkExtend(id: $id, months: $months) { id expiresAt } }": typeof types.ShareLinkExtendDocument,
    "mutation ShareLinkRename($id: ID!, $name: String!) { shareLinkRename(id: $id, name: $name) { id name } }": typeof types.ShareLinkRenameDocument,
    "mutation AccessRequestHandle($id: ID!, $handled: Boolean) { accessRequestHandle(id: $id, handled: $handled) { id handledAt } }": typeof types.AccessRequestHandleDocument,
    "mutation ShareLinkRevoke($id: ID!) { shareLinkRevoke(id: $id) { id } }": typeof types.ShareLinkRevokeDocument,
    "mutation AccessRequestCreate($input: AccessRequestInput!) { accessRequestCreate(input: $input) }": typeof types.AccessRequestCreateDocument,
    "\n    fragment SpexBrief on Spex { id title year revival parentId categoryId categoryName }\n": typeof types.SpexBriefFragmentDoc,
    "\n    fragment InstrumentBrief on Instrument { id nameSv nameEn group position defaultTransposition { pitch octave } }\n": typeof types.InstrumentBriefFragmentDoc,
    "\n    fragment FileFields on File {\n        id versionId title comment name extension contentType size pages position desk processing hasPreview hasText\n        canOpen downloadCount createdAt\n        role { id nameSv nameEn }\n        instruments { ...InstrumentBrief }\n        transposition { pitch octave }\n    }\n": typeof types.FileFieldsFragmentDoc,
    "\n    fragment VersionFields on Version {\n        id kind parentId label usedInSpexId date notes arranger tempo duration recommended restricted published\n        publishedAt trashed canOpen createdAt lastModifiedAt\n        usedIn { ...SpexBrief }\n        key { tonic mode }\n        modulations { tonic mode }\n        instrumentation { count instrument { ...InstrumentBrief } }\n    }\n": typeof types.VersionFieldsFragmentDoc,
    "\n    query SharedView($token: String!, $parts: PartFilter) {\n        sharedView(token: $token) {\n            name status createdByName expiresAt transpositions\n            spex { id title year categoryName }\n            instruments { ...InstrumentBrief }\n            versions {\n                id kind title label numberPosition originalSong lyricist composer authors arranger tempo duration date notes\n                spex { id title year categoryName }\n                usedIn { id title year categoryName }\n                key { tonic mode }\n                modulations { tonic mode }\n                instrumentation { count instrument { ...InstrumentBrief } }\n                files(parts: $parts) { ...FileFields }\n                allFiles: files { id instruments { ...InstrumentBrief } transposition { pitch octave } }\n            }\n        }\n    }\n": typeof types.SharedViewDocument,
};
const documents: Documents = {
    "\n    query Trash {\n        trash {\n            manuscripts { id title spex { ...SpexBrief } versions { id } }\n            arrangements { id number { id title position spex { ...SpexBrief } } versions { id } }\n            versions {\n                id kind label lastModifiedAt createdAt\n                manuscript { id title spex { ...SpexBrief } }\n                arrangement { id number { id title spex { ...SpexBrief } } }\n            }\n        }\n    }\n": types.TrashDocument,
    "\n    query AuditLog($page: Int, $size: Int, $filter: AuditFilter) {\n        auditLog(page: $page, size: $size, filter: $filter) {\n            totalCount page size\n            entries { id at actorId actorName action entityType entityId summary }\n        }\n    }\n": types.AuditLogDocument,
    "\n    query AuditActors { auditActors { id name } }\n": types.AuditActorsDocument,
    "\n    query Settings {\n        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths accessRequestRecipients }\n    }\n": types.SettingsDocument,
    "\n    query Storage { storage { filesBytes previewsBytes freeBytes fileCount } }\n": types.StorageDocument,
    "\n    query ShareLinks($all: Boolean) {\n        shareLinks(all: $all) {\n            id name createdById createdByName createdAt expiresAt revokedAt revokedByName status downloadCount\n            spexId spex { ...SpexBrief }\n            transpositions\n            instruments { ...InstrumentBrief }\n            versions {\n                id label kind\n                manuscript { id title spex { ...SpexBrief } }\n                arrangement { id number { id title spex { ...SpexBrief } } }\n            }\n            files { id title versionId }\n            downloads { count file { id title } }\n        }\n    }\n": types.ShareLinksDocument,
    "\n    query AccessRequests($handled: Boolean) {\n        accessRequests(handled: $handled) { id userName userEmail reason createdAt handledAt handledByName files { id title versionId } }\n    }\n": types.AccessRequestsDocument,
    "\n    query MaintenanceJobs { maintenanceJobs { job schedule running lastStartedAt lastFinishedAt lastSucceeded } }\n": types.MaintenanceJobsDocument,
    "mutation TrashEmpty { trashEmpty }": types.TrashEmptyDocument,
    "\n    mutation SettingsUpdate($input: SettingsInput!) { settingsUpdate(input: $input) { maxUploadMb } }\n": types.SettingsUpdateDocument,
    "mutation MaintenanceJobRun($job: MaintenanceJob!) { maintenanceJobRun(job: $job) }": types.MaintenanceJobRunDocument,
    "mutation InstrumentCreate($input: InstrumentInput!) { instrumentCreate(input: $input) { id } }": types.InstrumentCreateDocument,
    "mutation InstrumentUpdate($id: ID!, $input: InstrumentInput!) { instrumentUpdate(id: $id, input: $input) { id } }": types.InstrumentUpdateDocument,
    "mutation InstrumentsReorder($ids: [ID!]!) { instrumentsReorder(ids: $ids) { id } }": types.InstrumentsReorderDocument,
    "mutation InstrumentDelete($id: ID!) { instrumentDelete(id: $id) }": types.InstrumentDeleteDocument,
    "mutation InstrumentMerge($id: ID!, $intoId: ID!) { instrumentMerge(id: $id, intoId: $intoId) { id } }": types.InstrumentMergeDocument,
    "mutation FileRoleCreate($input: FileRoleInput!) { fileRoleCreate(input: $input) { id } }": types.FileRoleCreateDocument,
    "mutation FileRoleUpdate($id: ID!, $input: FileRoleInput!) { fileRoleUpdate(id: $id, input: $input) { id } }": types.FileRoleUpdateDocument,
    "mutation FileRolesReorder($ids: [ID!]!) { fileRolesReorder(ids: $ids) { id } }": types.FileRolesReorderDocument,
    "mutation FileRoleDelete($id: ID!) { fileRoleDelete(id: $id) }": types.FileRoleDeleteDocument,
    "\n    query Me {\n        me { username displayName roles }\n        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths }\n    }\n": types.MeDocument,
    "\n    query Home {\n        categories { id name spexCount }\n        years\n        recentVersions(limit: 12) {\n            ...VersionFields\n            manuscript { id title spex { ...SpexBrief } }\n            arrangement { id number { id title position spex { ...SpexBrief } } }\n        }\n    }\n": types.HomeDocument,
    "\n    query Browse { categories { id name spexCount } years }\n": types.BrowseDocument,
    "\n    query SpexList($filter: SpexFilter) {\n        spexList(filter: $filter) {\n            ...SpexBrief manuscriptCount arrangementCount\n            revivals { ...SpexBrief manuscriptCount arrangementCount }\n        }\n    }\n": types.SpexListDocument,
    "\n    query SpexPage($id: ID!) {\n        spex(id: $id) {\n            ...SpexBrief numbersInherited manuscriptCount arrangementCount\n            original { ...SpexBrief }\n            revivals { ...SpexBrief }\n            manuscripts {\n                id title authors description trashed\n                versions { ...VersionFields }\n            }\n            numbers {\n                id spexId position title originalSong lyricist composer\n                arrangement {\n                    id trashed\n                    versions { id label published restricted recommended trashed key { tonic mode } usedIn { ...SpexBrief } }\n                }\n            }\n        }\n    }\n": types.SpexPageDocument,
    "\n    query SpexArrangements($id: ID!, $parts: PartFilter) {\n        spex(id: $id) {\n            ...SpexBrief\n            arrangements(parts: $parts) {\n                id\n                number { id position title }\n                partsVersion(usedIn: $id) { id label files(parts: $parts) { ...FileFields } }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n": types.SpexArrangementsDocument,
    "\n    query Manuscript($id: ID!) {\n        manuscript(id: $id) {\n            id spexId title authors description trashed createdAt\n            spex { ...SpexBrief revivals { ...SpexBrief } }\n            versions {\n                ...VersionFields\n                files { ...FileFields }\n                usedIn { id numbers { id position title arrangement { id } } }\n            }\n        }\n    }\n": types.ManuscriptDocument,
    "\n    query Arrangement($id: ID!, $parts: PartFilter) {\n        arrangement(id: $id) {\n            id numberId description trashed createdAt\n            number { id spexId position title originalSong lyricist composer spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } }\n            versions {\n                ...VersionFields\n                files(parts: $parts) { ...FileFields }\n                allFiles: files { id role { id } instruments { id } transposition { pitch octave } }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n": types.ArrangementDocument,
    "\n    query Version($id: ID!) {\n        version(id: $id) {\n            ...VersionFields\n            files { ...FileFields }\n            manuscript { id title spexId spex { ...SpexBrief revivals { ...SpexBrief } } }\n            arrangement { id number { id title position spexId spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } } }\n        }\n    }\n": types.VersionDocument,
    "\n    query File($id: ID!) {\n        file(id: $id) { ...FileFields }\n    }\n": types.FileDocument,
    "\n    query FileVersion($id: ID!) {\n        version(id: $id) {\n            id kind parentId label canOpen restricted\n            files { id title pages canOpen contentType extension }\n            manuscript { id title spex { ...SpexBrief } }\n            arrangement { id number { id title position spex { ...SpexBrief } } }\n        }\n    }\n": types.FileVersionDocument,
    "\n    query Search($q: String!, $parts: PartFilter, $key: KeyInput) {\n        search(q: $q, parts: $parts, key: $key) {\n            spex { ...SpexBrief }\n            manuscripts { id title authors spex { ...SpexBrief } }\n            numbers { id title position originalSong lyricist composer spex { ...SpexBrief } arrangement { id } }\n            arrangements { id description number { id title position spex { ...SpexBrief } } }\n            versions {\n                id label key { tonic mode } modulations { tonic mode } arranger\n                arrangement { id number { id title position spex { ...SpexBrief } } }\n            }\n            textHits {\n                page snippet\n                file { id title canOpen role { id nameSv nameEn } instruments { ...InstrumentBrief } transposition { pitch octave } }\n                version {\n                    id label kind\n                    manuscript { id title spex { ...SpexBrief } }\n                    arrangement { id number { id title spex { ...SpexBrief } } }\n                }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n": types.SearchDocument,
    "\n    query Instruments {\n        instruments { ...InstrumentBrief abbreviations useCount }\n    }\n": types.InstrumentsDocument,
    "\n    query FileRoles { fileRoles { id nameSv nameEn position fileCount } }\n": types.FileRolesDocument,
    "\n    query Missing($categoryId: ID) {\n        categories { id name spexCount }\n        missingManuscripts(categoryId: $categoryId) { ...SpexBrief }\n        missingArrangements(categoryId: $categoryId) { id position title originalSong spex { ...SpexBrief } }\n    }\n": types.MissingDocument,
    "\n    query SpexSearch($filter: SpexFilter) {\n        spexList(filter: $filter) { ...SpexBrief revivals { ...SpexBrief } }\n    }\n": types.SpexSearchDocument,
    "mutation ManuscriptCreate($input: ManuscriptInput!) { manuscriptCreate(input: $input) { id versions { id } } }": types.ManuscriptCreateDocument,
    "mutation ManuscriptUpdate($id: ID!, $input: ManuscriptInput!) { manuscriptUpdate(id: $id, input: $input) { id } }": types.ManuscriptUpdateDocument,
    "mutation ManuscriptTrash($id: ID!) { manuscriptTrash(id: $id) { id } }": types.ManuscriptTrashDocument,
    "mutation ManuscriptRestore($id: ID!) { manuscriptRestore(id: $id) { id } }": types.ManuscriptRestoreDocument,
    "mutation ManuscriptDelete($id: ID!) { manuscriptDelete(id: $id) }": types.ManuscriptDeleteDocument,
    "mutation ArrangementCreate($input: ArrangementInput!) { arrangementCreate(input: $input) { id versions { id } } }": types.ArrangementCreateDocument,
    "mutation ArrangementUpdate($id: ID!, $input: ArrangementInput!) { arrangementUpdate(id: $id, input: $input) { id } }": types.ArrangementUpdateDocument,
    "mutation ArrangementTrash($id: ID!) { arrangementTrash(id: $id) { id } }": types.ArrangementTrashDocument,
    "mutation ArrangementRestore($id: ID!) { arrangementRestore(id: $id) { id } }": types.ArrangementRestoreDocument,
    "mutation ArrangementDelete($id: ID!) { arrangementDelete(id: $id) }": types.ArrangementDeleteDocument,
    "mutation VersionCreate($parentId: ID!, $input: VersionInput!) { versionCreate(parentId: $parentId, input: $input) { id } }": types.VersionCreateDocument,
    "mutation VersionUpdate($id: ID!, $input: VersionInput!) { versionUpdate(id: $id, input: $input) { id } }": types.VersionUpdateDocument,
    "mutation VersionCopy($id: ID!) { versionCopy(id: $id) { id } }": types.VersionCopyDocument,
    "mutation VersionPublish($id: ID!, $published: Boolean!) { versionPublish(id: $id, published: $published) { id published } }": types.VersionPublishDocument,
    "mutation VersionRecommend($id: ID!, $recommended: Boolean!) { versionRecommend(id: $id, recommended: $recommended) { id recommended } }": types.VersionRecommendDocument,
    "mutation VersionTrash($id: ID!) { versionTrash(id: $id) { id } }": types.VersionTrashDocument,
    "mutation VersionRestore($id: ID!) { versionRestore(id: $id) { id } }": types.VersionRestoreDocument,
    "mutation VersionDelete($id: ID!) { versionDelete(id: $id) }": types.VersionDeleteDocument,
    "mutation FileAdd($input: FileAddInput!) { fileAdd(input: $input) { id } }": types.FileAddDocument,
    "mutation FileUpdate($id: ID!, $input: FileInput!) { fileUpdate(id: $id, input: $input) { id } }": types.FileUpdateDocument,
    "mutation FileReplace($id: ID!, $uploadId: String!) { fileReplace(id: $id, uploadId: $uploadId) { id } }": types.FileReplaceDocument,
    "mutation FilesReorder($versionId: ID!, $ids: [ID!]!) { filesReorder(versionId: $versionId, ids: $ids) { id } }": types.FilesReorderDocument,
    "mutation FileDelete($id: ID!) { fileDelete(id: $id) }": types.FileDeleteDocument,
    "\n    query FileGuess($versionId: ID!, $name: String!) {\n        fileGuess(versionId: $versionId, name: $name) {\n            title desk\n            role { id }\n            instruments { id }\n            transposition { pitch octave }\n        }\n    }\n": types.FileGuessDocument,
    "mutation NumberCreate($spexId: ID!, $input: NumberInput!) { numberCreate(spexId: $spexId, input: $input) { id } }": types.NumberCreateDocument,
    "mutation NumberUpdate($id: ID!, $input: NumberInput!) { numberUpdate(id: $id, input: $input) { id } }": types.NumberUpdateDocument,
    "mutation NumberDelete($id: ID!) { numberDelete(id: $id) }": types.NumberDeleteDocument,
    "mutation NumbersPaste($spexId: ID!, $text: String!) { numbersPaste(spexId: $spexId, text: $text) { id } }": types.NumbersPasteDocument,
    "mutation NumbersReorder($spexId: ID!, $ids: [ID!]!) { numbersReorder(spexId: $spexId, ids: $ids) { id } }": types.NumbersReorderDocument,
    "mutation NumberMerge($id: ID!, $intoId: ID!) { numberMerge(id: $id, intoId: $intoId) { id } }": types.NumberMergeDocument,
    "mutation ShareLinkCreate($input: ShareLinkInput!) { shareLinkCreate(input: $input) { token shareLink { id name expiresAt } } }": types.ShareLinkCreateDocument,
    "mutation ShareLinkExtend($id: ID!, $months: Int!) { shareLinkExtend(id: $id, months: $months) { id expiresAt } }": types.ShareLinkExtendDocument,
    "mutation ShareLinkRename($id: ID!, $name: String!) { shareLinkRename(id: $id, name: $name) { id name } }": types.ShareLinkRenameDocument,
    "mutation AccessRequestHandle($id: ID!, $handled: Boolean) { accessRequestHandle(id: $id, handled: $handled) { id handledAt } }": types.AccessRequestHandleDocument,
    "mutation ShareLinkRevoke($id: ID!) { shareLinkRevoke(id: $id) { id } }": types.ShareLinkRevokeDocument,
    "mutation AccessRequestCreate($input: AccessRequestInput!) { accessRequestCreate(input: $input) }": types.AccessRequestCreateDocument,
    "\n    fragment SpexBrief on Spex { id title year revival parentId categoryId categoryName }\n": types.SpexBriefFragmentDoc,
    "\n    fragment InstrumentBrief on Instrument { id nameSv nameEn group position defaultTransposition { pitch octave } }\n": types.InstrumentBriefFragmentDoc,
    "\n    fragment FileFields on File {\n        id versionId title comment name extension contentType size pages position desk processing hasPreview hasText\n        canOpen downloadCount createdAt\n        role { id nameSv nameEn }\n        instruments { ...InstrumentBrief }\n        transposition { pitch octave }\n    }\n": types.FileFieldsFragmentDoc,
    "\n    fragment VersionFields on Version {\n        id kind parentId label usedInSpexId date notes arranger tempo duration recommended restricted published\n        publishedAt trashed canOpen createdAt lastModifiedAt\n        usedIn { ...SpexBrief }\n        key { tonic mode }\n        modulations { tonic mode }\n        instrumentation { count instrument { ...InstrumentBrief } }\n    }\n": types.VersionFieldsFragmentDoc,
    "\n    query SharedView($token: String!, $parts: PartFilter) {\n        sharedView(token: $token) {\n            name status createdByName expiresAt transpositions\n            spex { id title year categoryName }\n            instruments { ...InstrumentBrief }\n            versions {\n                id kind title label numberPosition originalSong lyricist composer authors arranger tempo duration date notes\n                spex { id title year categoryName }\n                usedIn { id title year categoryName }\n                key { tonic mode }\n                modulations { tonic mode }\n                instrumentation { count instrument { ...InstrumentBrief } }\n                files(parts: $parts) { ...FileFields }\n                allFiles: files { id instruments { ...InstrumentBrief } transposition { pitch octave } }\n            }\n        }\n    }\n": types.SharedViewDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Trash {\n        trash {\n            manuscripts { id title spex { ...SpexBrief } versions { id } }\n            arrangements { id number { id title position spex { ...SpexBrief } } versions { id } }\n            versions {\n                id kind label lastModifiedAt createdAt\n                manuscript { id title spex { ...SpexBrief } }\n                arrangement { id number { id title spex { ...SpexBrief } } }\n            }\n        }\n    }\n"): (typeof documents)["\n    query Trash {\n        trash {\n            manuscripts { id title spex { ...SpexBrief } versions { id } }\n            arrangements { id number { id title position spex { ...SpexBrief } } versions { id } }\n            versions {\n                id kind label lastModifiedAt createdAt\n                manuscript { id title spex { ...SpexBrief } }\n                arrangement { id number { id title spex { ...SpexBrief } } }\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query AuditLog($page: Int, $size: Int, $filter: AuditFilter) {\n        auditLog(page: $page, size: $size, filter: $filter) {\n            totalCount page size\n            entries { id at actorId actorName action entityType entityId summary }\n        }\n    }\n"): (typeof documents)["\n    query AuditLog($page: Int, $size: Int, $filter: AuditFilter) {\n        auditLog(page: $page, size: $size, filter: $filter) {\n            totalCount page size\n            entries { id at actorId actorName action entityType entityId summary }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query AuditActors { auditActors { id name } }\n"): (typeof documents)["\n    query AuditActors { auditActors { id name } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Settings {\n        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths accessRequestRecipients }\n    }\n"): (typeof documents)["\n    query Settings {\n        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths accessRequestRecipients }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Storage { storage { filesBytes previewsBytes freeBytes fileCount } }\n"): (typeof documents)["\n    query Storage { storage { filesBytes previewsBytes freeBytes fileCount } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ShareLinks($all: Boolean) {\n        shareLinks(all: $all) {\n            id name createdById createdByName createdAt expiresAt revokedAt revokedByName status downloadCount\n            spexId spex { ...SpexBrief }\n            transpositions\n            instruments { ...InstrumentBrief }\n            versions {\n                id label kind\n                manuscript { id title spex { ...SpexBrief } }\n                arrangement { id number { id title spex { ...SpexBrief } } }\n            }\n            files { id title versionId }\n            downloads { count file { id title } }\n        }\n    }\n"): (typeof documents)["\n    query ShareLinks($all: Boolean) {\n        shareLinks(all: $all) {\n            id name createdById createdByName createdAt expiresAt revokedAt revokedByName status downloadCount\n            spexId spex { ...SpexBrief }\n            transpositions\n            instruments { ...InstrumentBrief }\n            versions {\n                id label kind\n                manuscript { id title spex { ...SpexBrief } }\n                arrangement { id number { id title spex { ...SpexBrief } } }\n            }\n            files { id title versionId }\n            downloads { count file { id title } }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query AccessRequests($handled: Boolean) {\n        accessRequests(handled: $handled) { id userName userEmail reason createdAt handledAt handledByName files { id title versionId } }\n    }\n"): (typeof documents)["\n    query AccessRequests($handled: Boolean) {\n        accessRequests(handled: $handled) { id userName userEmail reason createdAt handledAt handledByName files { id title versionId } }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query MaintenanceJobs { maintenanceJobs { job schedule running lastStartedAt lastFinishedAt lastSucceeded } }\n"): (typeof documents)["\n    query MaintenanceJobs { maintenanceJobs { job schedule running lastStartedAt lastFinishedAt lastSucceeded } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation TrashEmpty { trashEmpty }"): (typeof documents)["mutation TrashEmpty { trashEmpty }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation SettingsUpdate($input: SettingsInput!) { settingsUpdate(input: $input) { maxUploadMb } }\n"): (typeof documents)["\n    mutation SettingsUpdate($input: SettingsInput!) { settingsUpdate(input: $input) { maxUploadMb } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation MaintenanceJobRun($job: MaintenanceJob!) { maintenanceJobRun(job: $job) }"): (typeof documents)["mutation MaintenanceJobRun($job: MaintenanceJob!) { maintenanceJobRun(job: $job) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation InstrumentCreate($input: InstrumentInput!) { instrumentCreate(input: $input) { id } }"): (typeof documents)["mutation InstrumentCreate($input: InstrumentInput!) { instrumentCreate(input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation InstrumentUpdate($id: ID!, $input: InstrumentInput!) { instrumentUpdate(id: $id, input: $input) { id } }"): (typeof documents)["mutation InstrumentUpdate($id: ID!, $input: InstrumentInput!) { instrumentUpdate(id: $id, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation InstrumentsReorder($ids: [ID!]!) { instrumentsReorder(ids: $ids) { id } }"): (typeof documents)["mutation InstrumentsReorder($ids: [ID!]!) { instrumentsReorder(ids: $ids) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation InstrumentDelete($id: ID!) { instrumentDelete(id: $id) }"): (typeof documents)["mutation InstrumentDelete($id: ID!) { instrumentDelete(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation InstrumentMerge($id: ID!, $intoId: ID!) { instrumentMerge(id: $id, intoId: $intoId) { id } }"): (typeof documents)["mutation InstrumentMerge($id: ID!, $intoId: ID!) { instrumentMerge(id: $id, intoId: $intoId) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FileRoleCreate($input: FileRoleInput!) { fileRoleCreate(input: $input) { id } }"): (typeof documents)["mutation FileRoleCreate($input: FileRoleInput!) { fileRoleCreate(input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FileRoleUpdate($id: ID!, $input: FileRoleInput!) { fileRoleUpdate(id: $id, input: $input) { id } }"): (typeof documents)["mutation FileRoleUpdate($id: ID!, $input: FileRoleInput!) { fileRoleUpdate(id: $id, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FileRolesReorder($ids: [ID!]!) { fileRolesReorder(ids: $ids) { id } }"): (typeof documents)["mutation FileRolesReorder($ids: [ID!]!) { fileRolesReorder(ids: $ids) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FileRoleDelete($id: ID!) { fileRoleDelete(id: $id) }"): (typeof documents)["mutation FileRoleDelete($id: ID!) { fileRoleDelete(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Me {\n        me { username displayName roles }\n        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths }\n    }\n"): (typeof documents)["\n    query Me {\n        me { username displayName roles }\n        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Home {\n        categories { id name spexCount }\n        years\n        recentVersions(limit: 12) {\n            ...VersionFields\n            manuscript { id title spex { ...SpexBrief } }\n            arrangement { id number { id title position spex { ...SpexBrief } } }\n        }\n    }\n"): (typeof documents)["\n    query Home {\n        categories { id name spexCount }\n        years\n        recentVersions(limit: 12) {\n            ...VersionFields\n            manuscript { id title spex { ...SpexBrief } }\n            arrangement { id number { id title position spex { ...SpexBrief } } }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Browse { categories { id name spexCount } years }\n"): (typeof documents)["\n    query Browse { categories { id name spexCount } years }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query SpexList($filter: SpexFilter) {\n        spexList(filter: $filter) {\n            ...SpexBrief manuscriptCount arrangementCount\n            revivals { ...SpexBrief manuscriptCount arrangementCount }\n        }\n    }\n"): (typeof documents)["\n    query SpexList($filter: SpexFilter) {\n        spexList(filter: $filter) {\n            ...SpexBrief manuscriptCount arrangementCount\n            revivals { ...SpexBrief manuscriptCount arrangementCount }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query SpexPage($id: ID!) {\n        spex(id: $id) {\n            ...SpexBrief numbersInherited manuscriptCount arrangementCount\n            original { ...SpexBrief }\n            revivals { ...SpexBrief }\n            manuscripts {\n                id title authors description trashed\n                versions { ...VersionFields }\n            }\n            numbers {\n                id spexId position title originalSong lyricist composer\n                arrangement {\n                    id trashed\n                    versions { id label published restricted recommended trashed key { tonic mode } usedIn { ...SpexBrief } }\n                }\n            }\n        }\n    }\n"): (typeof documents)["\n    query SpexPage($id: ID!) {\n        spex(id: $id) {\n            ...SpexBrief numbersInherited manuscriptCount arrangementCount\n            original { ...SpexBrief }\n            revivals { ...SpexBrief }\n            manuscripts {\n                id title authors description trashed\n                versions { ...VersionFields }\n            }\n            numbers {\n                id spexId position title originalSong lyricist composer\n                arrangement {\n                    id trashed\n                    versions { id label published restricted recommended trashed key { tonic mode } usedIn { ...SpexBrief } }\n                }\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query SpexArrangements($id: ID!, $parts: PartFilter) {\n        spex(id: $id) {\n            ...SpexBrief\n            arrangements(parts: $parts) {\n                id\n                number { id position title }\n                partsVersion(usedIn: $id) { id label files(parts: $parts) { ...FileFields } }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n"): (typeof documents)["\n    query SpexArrangements($id: ID!, $parts: PartFilter) {\n        spex(id: $id) {\n            ...SpexBrief\n            arrangements(parts: $parts) {\n                id\n                number { id position title }\n                partsVersion(usedIn: $id) { id label files(parts: $parts) { ...FileFields } }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Manuscript($id: ID!) {\n        manuscript(id: $id) {\n            id spexId title authors description trashed createdAt\n            spex { ...SpexBrief revivals { ...SpexBrief } }\n            versions {\n                ...VersionFields\n                files { ...FileFields }\n                usedIn { id numbers { id position title arrangement { id } } }\n            }\n        }\n    }\n"): (typeof documents)["\n    query Manuscript($id: ID!) {\n        manuscript(id: $id) {\n            id spexId title authors description trashed createdAt\n            spex { ...SpexBrief revivals { ...SpexBrief } }\n            versions {\n                ...VersionFields\n                files { ...FileFields }\n                usedIn { id numbers { id position title arrangement { id } } }\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Arrangement($id: ID!, $parts: PartFilter) {\n        arrangement(id: $id) {\n            id numberId description trashed createdAt\n            number { id spexId position title originalSong lyricist composer spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } }\n            versions {\n                ...VersionFields\n                files(parts: $parts) { ...FileFields }\n                allFiles: files { id role { id } instruments { id } transposition { pitch octave } }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n"): (typeof documents)["\n    query Arrangement($id: ID!, $parts: PartFilter) {\n        arrangement(id: $id) {\n            id numberId description trashed createdAt\n            number { id spexId position title originalSong lyricist composer spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } }\n            versions {\n                ...VersionFields\n                files(parts: $parts) { ...FileFields }\n                allFiles: files { id role { id } instruments { id } transposition { pitch octave } }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Version($id: ID!) {\n        version(id: $id) {\n            ...VersionFields\n            files { ...FileFields }\n            manuscript { id title spexId spex { ...SpexBrief revivals { ...SpexBrief } } }\n            arrangement { id number { id title position spexId spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } } }\n        }\n    }\n"): (typeof documents)["\n    query Version($id: ID!) {\n        version(id: $id) {\n            ...VersionFields\n            files { ...FileFields }\n            manuscript { id title spexId spex { ...SpexBrief revivals { ...SpexBrief } } }\n            arrangement { id number { id title position spexId spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } } }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query File($id: ID!) {\n        file(id: $id) { ...FileFields }\n    }\n"): (typeof documents)["\n    query File($id: ID!) {\n        file(id: $id) { ...FileFields }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query FileVersion($id: ID!) {\n        version(id: $id) {\n            id kind parentId label canOpen restricted\n            files { id title pages canOpen contentType extension }\n            manuscript { id title spex { ...SpexBrief } }\n            arrangement { id number { id title position spex { ...SpexBrief } } }\n        }\n    }\n"): (typeof documents)["\n    query FileVersion($id: ID!) {\n        version(id: $id) {\n            id kind parentId label canOpen restricted\n            files { id title pages canOpen contentType extension }\n            manuscript { id title spex { ...SpexBrief } }\n            arrangement { id number { id title position spex { ...SpexBrief } } }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Search($q: String!, $parts: PartFilter, $key: KeyInput) {\n        search(q: $q, parts: $parts, key: $key) {\n            spex { ...SpexBrief }\n            manuscripts { id title authors spex { ...SpexBrief } }\n            numbers { id title position originalSong lyricist composer spex { ...SpexBrief } arrangement { id } }\n            arrangements { id description number { id title position spex { ...SpexBrief } } }\n            versions {\n                id label key { tonic mode } modulations { tonic mode } arranger\n                arrangement { id number { id title position spex { ...SpexBrief } } }\n            }\n            textHits {\n                page snippet\n                file { id title canOpen role { id nameSv nameEn } instruments { ...InstrumentBrief } transposition { pitch octave } }\n                version {\n                    id label kind\n                    manuscript { id title spex { ...SpexBrief } }\n                    arrangement { id number { id title spex { ...SpexBrief } } }\n                }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n"): (typeof documents)["\n    query Search($q: String!, $parts: PartFilter, $key: KeyInput) {\n        search(q: $q, parts: $parts, key: $key) {\n            spex { ...SpexBrief }\n            manuscripts { id title authors spex { ...SpexBrief } }\n            numbers { id title position originalSong lyricist composer spex { ...SpexBrief } arrangement { id } }\n            arrangements { id description number { id title position spex { ...SpexBrief } } }\n            versions {\n                id label key { tonic mode } modulations { tonic mode } arranger\n                arrangement { id number { id title position spex { ...SpexBrief } } }\n            }\n            textHits {\n                page snippet\n                file { id title canOpen role { id nameSv nameEn } instruments { ...InstrumentBrief } transposition { pitch octave } }\n                version {\n                    id label kind\n                    manuscript { id title spex { ...SpexBrief } }\n                    arrangement { id number { id title spex { ...SpexBrief } } }\n                }\n            }\n        }\n        instruments { ...InstrumentBrief }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Instruments {\n        instruments { ...InstrumentBrief abbreviations useCount }\n    }\n"): (typeof documents)["\n    query Instruments {\n        instruments { ...InstrumentBrief abbreviations useCount }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query FileRoles { fileRoles { id nameSv nameEn position fileCount } }\n"): (typeof documents)["\n    query FileRoles { fileRoles { id nameSv nameEn position fileCount } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query Missing($categoryId: ID) {\n        categories { id name spexCount }\n        missingManuscripts(categoryId: $categoryId) { ...SpexBrief }\n        missingArrangements(categoryId: $categoryId) { id position title originalSong spex { ...SpexBrief } }\n    }\n"): (typeof documents)["\n    query Missing($categoryId: ID) {\n        categories { id name spexCount }\n        missingManuscripts(categoryId: $categoryId) { ...SpexBrief }\n        missingArrangements(categoryId: $categoryId) { id position title originalSong spex { ...SpexBrief } }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query SpexSearch($filter: SpexFilter) {\n        spexList(filter: $filter) { ...SpexBrief revivals { ...SpexBrief } }\n    }\n"): (typeof documents)["\n    query SpexSearch($filter: SpexFilter) {\n        spexList(filter: $filter) { ...SpexBrief revivals { ...SpexBrief } }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ManuscriptCreate($input: ManuscriptInput!) { manuscriptCreate(input: $input) { id versions { id } } }"): (typeof documents)["mutation ManuscriptCreate($input: ManuscriptInput!) { manuscriptCreate(input: $input) { id versions { id } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ManuscriptUpdate($id: ID!, $input: ManuscriptInput!) { manuscriptUpdate(id: $id, input: $input) { id } }"): (typeof documents)["mutation ManuscriptUpdate($id: ID!, $input: ManuscriptInput!) { manuscriptUpdate(id: $id, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ManuscriptTrash($id: ID!) { manuscriptTrash(id: $id) { id } }"): (typeof documents)["mutation ManuscriptTrash($id: ID!) { manuscriptTrash(id: $id) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ManuscriptRestore($id: ID!) { manuscriptRestore(id: $id) { id } }"): (typeof documents)["mutation ManuscriptRestore($id: ID!) { manuscriptRestore(id: $id) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ManuscriptDelete($id: ID!) { manuscriptDelete(id: $id) }"): (typeof documents)["mutation ManuscriptDelete($id: ID!) { manuscriptDelete(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ArrangementCreate($input: ArrangementInput!) { arrangementCreate(input: $input) { id versions { id } } }"): (typeof documents)["mutation ArrangementCreate($input: ArrangementInput!) { arrangementCreate(input: $input) { id versions { id } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ArrangementUpdate($id: ID!, $input: ArrangementInput!) { arrangementUpdate(id: $id, input: $input) { id } }"): (typeof documents)["mutation ArrangementUpdate($id: ID!, $input: ArrangementInput!) { arrangementUpdate(id: $id, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ArrangementTrash($id: ID!) { arrangementTrash(id: $id) { id } }"): (typeof documents)["mutation ArrangementTrash($id: ID!) { arrangementTrash(id: $id) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ArrangementRestore($id: ID!) { arrangementRestore(id: $id) { id } }"): (typeof documents)["mutation ArrangementRestore($id: ID!) { arrangementRestore(id: $id) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ArrangementDelete($id: ID!) { arrangementDelete(id: $id) }"): (typeof documents)["mutation ArrangementDelete($id: ID!) { arrangementDelete(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VersionCreate($parentId: ID!, $input: VersionInput!) { versionCreate(parentId: $parentId, input: $input) { id } }"): (typeof documents)["mutation VersionCreate($parentId: ID!, $input: VersionInput!) { versionCreate(parentId: $parentId, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VersionUpdate($id: ID!, $input: VersionInput!) { versionUpdate(id: $id, input: $input) { id } }"): (typeof documents)["mutation VersionUpdate($id: ID!, $input: VersionInput!) { versionUpdate(id: $id, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VersionCopy($id: ID!) { versionCopy(id: $id) { id } }"): (typeof documents)["mutation VersionCopy($id: ID!) { versionCopy(id: $id) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VersionPublish($id: ID!, $published: Boolean!) { versionPublish(id: $id, published: $published) { id published } }"): (typeof documents)["mutation VersionPublish($id: ID!, $published: Boolean!) { versionPublish(id: $id, published: $published) { id published } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VersionRecommend($id: ID!, $recommended: Boolean!) { versionRecommend(id: $id, recommended: $recommended) { id recommended } }"): (typeof documents)["mutation VersionRecommend($id: ID!, $recommended: Boolean!) { versionRecommend(id: $id, recommended: $recommended) { id recommended } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VersionTrash($id: ID!) { versionTrash(id: $id) { id } }"): (typeof documents)["mutation VersionTrash($id: ID!) { versionTrash(id: $id) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VersionRestore($id: ID!) { versionRestore(id: $id) { id } }"): (typeof documents)["mutation VersionRestore($id: ID!) { versionRestore(id: $id) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VersionDelete($id: ID!) { versionDelete(id: $id) }"): (typeof documents)["mutation VersionDelete($id: ID!) { versionDelete(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FileAdd($input: FileAddInput!) { fileAdd(input: $input) { id } }"): (typeof documents)["mutation FileAdd($input: FileAddInput!) { fileAdd(input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FileUpdate($id: ID!, $input: FileInput!) { fileUpdate(id: $id, input: $input) { id } }"): (typeof documents)["mutation FileUpdate($id: ID!, $input: FileInput!) { fileUpdate(id: $id, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FileReplace($id: ID!, $uploadId: String!) { fileReplace(id: $id, uploadId: $uploadId) { id } }"): (typeof documents)["mutation FileReplace($id: ID!, $uploadId: String!) { fileReplace(id: $id, uploadId: $uploadId) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FilesReorder($versionId: ID!, $ids: [ID!]!) { filesReorder(versionId: $versionId, ids: $ids) { id } }"): (typeof documents)["mutation FilesReorder($versionId: ID!, $ids: [ID!]!) { filesReorder(versionId: $versionId, ids: $ids) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FileDelete($id: ID!) { fileDelete(id: $id) }"): (typeof documents)["mutation FileDelete($id: ID!) { fileDelete(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query FileGuess($versionId: ID!, $name: String!) {\n        fileGuess(versionId: $versionId, name: $name) {\n            title desk\n            role { id }\n            instruments { id }\n            transposition { pitch octave }\n        }\n    }\n"): (typeof documents)["\n    query FileGuess($versionId: ID!, $name: String!) {\n        fileGuess(versionId: $versionId, name: $name) {\n            title desk\n            role { id }\n            instruments { id }\n            transposition { pitch octave }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation NumberCreate($spexId: ID!, $input: NumberInput!) { numberCreate(spexId: $spexId, input: $input) { id } }"): (typeof documents)["mutation NumberCreate($spexId: ID!, $input: NumberInput!) { numberCreate(spexId: $spexId, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation NumberUpdate($id: ID!, $input: NumberInput!) { numberUpdate(id: $id, input: $input) { id } }"): (typeof documents)["mutation NumberUpdate($id: ID!, $input: NumberInput!) { numberUpdate(id: $id, input: $input) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation NumberDelete($id: ID!) { numberDelete(id: $id) }"): (typeof documents)["mutation NumberDelete($id: ID!) { numberDelete(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation NumbersPaste($spexId: ID!, $text: String!) { numbersPaste(spexId: $spexId, text: $text) { id } }"): (typeof documents)["mutation NumbersPaste($spexId: ID!, $text: String!) { numbersPaste(spexId: $spexId, text: $text) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation NumbersReorder($spexId: ID!, $ids: [ID!]!) { numbersReorder(spexId: $spexId, ids: $ids) { id } }"): (typeof documents)["mutation NumbersReorder($spexId: ID!, $ids: [ID!]!) { numbersReorder(spexId: $spexId, ids: $ids) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation NumberMerge($id: ID!, $intoId: ID!) { numberMerge(id: $id, intoId: $intoId) { id } }"): (typeof documents)["mutation NumberMerge($id: ID!, $intoId: ID!) { numberMerge(id: $id, intoId: $intoId) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ShareLinkCreate($input: ShareLinkInput!) { shareLinkCreate(input: $input) { token shareLink { id name expiresAt } } }"): (typeof documents)["mutation ShareLinkCreate($input: ShareLinkInput!) { shareLinkCreate(input: $input) { token shareLink { id name expiresAt } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ShareLinkExtend($id: ID!, $months: Int!) { shareLinkExtend(id: $id, months: $months) { id expiresAt } }"): (typeof documents)["mutation ShareLinkExtend($id: ID!, $months: Int!) { shareLinkExtend(id: $id, months: $months) { id expiresAt } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ShareLinkRename($id: ID!, $name: String!) { shareLinkRename(id: $id, name: $name) { id name } }"): (typeof documents)["mutation ShareLinkRename($id: ID!, $name: String!) { shareLinkRename(id: $id, name: $name) { id name } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AccessRequestHandle($id: ID!, $handled: Boolean) { accessRequestHandle(id: $id, handled: $handled) { id handledAt } }"): (typeof documents)["mutation AccessRequestHandle($id: ID!, $handled: Boolean) { accessRequestHandle(id: $id, handled: $handled) { id handledAt } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ShareLinkRevoke($id: ID!) { shareLinkRevoke(id: $id) { id } }"): (typeof documents)["mutation ShareLinkRevoke($id: ID!) { shareLinkRevoke(id: $id) { id } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AccessRequestCreate($input: AccessRequestInput!) { accessRequestCreate(input: $input) }"): (typeof documents)["mutation AccessRequestCreate($input: AccessRequestInput!) { accessRequestCreate(input: $input) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    fragment SpexBrief on Spex { id title year revival parentId categoryId categoryName }\n"): (typeof documents)["\n    fragment SpexBrief on Spex { id title year revival parentId categoryId categoryName }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    fragment InstrumentBrief on Instrument { id nameSv nameEn group position defaultTransposition { pitch octave } }\n"): (typeof documents)["\n    fragment InstrumentBrief on Instrument { id nameSv nameEn group position defaultTransposition { pitch octave } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    fragment FileFields on File {\n        id versionId title comment name extension contentType size pages position desk processing hasPreview hasText\n        canOpen downloadCount createdAt\n        role { id nameSv nameEn }\n        instruments { ...InstrumentBrief }\n        transposition { pitch octave }\n    }\n"): (typeof documents)["\n    fragment FileFields on File {\n        id versionId title comment name extension contentType size pages position desk processing hasPreview hasText\n        canOpen downloadCount createdAt\n        role { id nameSv nameEn }\n        instruments { ...InstrumentBrief }\n        transposition { pitch octave }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    fragment VersionFields on Version {\n        id kind parentId label usedInSpexId date notes arranger tempo duration recommended restricted published\n        publishedAt trashed canOpen createdAt lastModifiedAt\n        usedIn { ...SpexBrief }\n        key { tonic mode }\n        modulations { tonic mode }\n        instrumentation { count instrument { ...InstrumentBrief } }\n    }\n"): (typeof documents)["\n    fragment VersionFields on Version {\n        id kind parentId label usedInSpexId date notes arranger tempo duration recommended restricted published\n        publishedAt trashed canOpen createdAt lastModifiedAt\n        usedIn { ...SpexBrief }\n        key { tonic mode }\n        modulations { tonic mode }\n        instrumentation { count instrument { ...InstrumentBrief } }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query SharedView($token: String!, $parts: PartFilter) {\n        sharedView(token: $token) {\n            name status createdByName expiresAt transpositions\n            spex { id title year categoryName }\n            instruments { ...InstrumentBrief }\n            versions {\n                id kind title label numberPosition originalSong lyricist composer authors arranger tempo duration date notes\n                spex { id title year categoryName }\n                usedIn { id title year categoryName }\n                key { tonic mode }\n                modulations { tonic mode }\n                instrumentation { count instrument { ...InstrumentBrief } }\n                files(parts: $parts) { ...FileFields }\n                allFiles: files { id instruments { ...InstrumentBrief } transposition { pitch octave } }\n            }\n        }\n    }\n"): (typeof documents)["\n    query SharedView($token: String!, $parts: PartFilter) {\n        sharedView(token: $token) {\n            name status createdByName expiresAt transpositions\n            spex { id title year categoryName }\n            instruments { ...InstrumentBrief }\n            versions {\n                id kind title label numberPosition originalSong lyricist composer authors arranger tempo duration date notes\n                spex { id title year categoryName }\n                usedIn { id title year categoryName }\n                key { tonic mode }\n                modulations { tonic mode }\n                instrumentation { count instrument { ...InstrumentBrief } }\n                files(parts: $parts) { ...FileFields }\n                allFiles: files { id instruments { ...InstrumentBrief } transposition { pitch octave } }\n            }\n        }\n    }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;