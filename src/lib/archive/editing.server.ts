import "server-only";

import { graphql } from "@/gql";
import { runMutation, runQuery } from "@/lib/graphql.server";
import type {
  AccessRequestInput,
  ArrangementInput,
  FileAddInput,
  FileInput,
  ManuscriptInput,
  NumberInput,
  ShareLinkInput,
  VersionInput,
} from "@/gql/graphql";

const ManuscriptCreate = graphql(`mutation ManuscriptCreate($input: ManuscriptInput!) { manuscriptCreate(input: $input) { id versions { id } } }`);
const ManuscriptUpdate = graphql(`mutation ManuscriptUpdate($id: ID!, $input: ManuscriptInput!) { manuscriptUpdate(id: $id, input: $input) { id } }`);
const ManuscriptTrash = graphql(`mutation ManuscriptTrash($id: ID!) { manuscriptTrash(id: $id) { id } }`);
const ManuscriptRestore = graphql(`mutation ManuscriptRestore($id: ID!) { manuscriptRestore(id: $id) { id } }`);
const ManuscriptDelete = graphql(`mutation ManuscriptDelete($id: ID!) { manuscriptDelete(id: $id) }`);
const ArrangementCreate = graphql(`mutation ArrangementCreate($input: ArrangementInput!) { arrangementCreate(input: $input) { id versions { id } } }`);
const ArrangementUpdate = graphql(`mutation ArrangementUpdate($id: ID!, $input: ArrangementInput!) { arrangementUpdate(id: $id, input: $input) { id } }`);
const ArrangementTrash = graphql(`mutation ArrangementTrash($id: ID!) { arrangementTrash(id: $id) { id } }`);
const ArrangementRestore = graphql(`mutation ArrangementRestore($id: ID!) { arrangementRestore(id: $id) { id } }`);
const ArrangementDelete = graphql(`mutation ArrangementDelete($id: ID!) { arrangementDelete(id: $id) }`);
const VersionCreate = graphql(`mutation VersionCreate($parentId: ID!, $input: VersionInput!) { versionCreate(parentId: $parentId, input: $input) { id } }`);
const VersionUpdate = graphql(`mutation VersionUpdate($id: ID!, $input: VersionInput!) { versionUpdate(id: $id, input: $input) { id } }`);
const VersionCopy = graphql(`mutation VersionCopy($id: ID!) { versionCopy(id: $id) { id } }`);
const VersionPublish = graphql(`mutation VersionPublish($id: ID!, $published: Boolean!) { versionPublish(id: $id, published: $published) { id published } }`);
const VersionRecommend = graphql(`mutation VersionRecommend($id: ID!, $recommended: Boolean!) { versionRecommend(id: $id, recommended: $recommended) { id recommended } }`);
const VersionTrash = graphql(`mutation VersionTrash($id: ID!) { versionTrash(id: $id) { id } }`);
const VersionRestore = graphql(`mutation VersionRestore($id: ID!) { versionRestore(id: $id) { id } }`);
const VersionDelete = graphql(`mutation VersionDelete($id: ID!) { versionDelete(id: $id) }`);
const FileAdd = graphql(`mutation FileAdd($input: FileAddInput!) { fileAdd(input: $input) { id } }`);
const FileUpdate = graphql(`mutation FileUpdate($id: ID!, $input: FileInput!) { fileUpdate(id: $id, input: $input) { id } }`);
const FileReplace = graphql(`mutation FileReplace($id: ID!, $uploadId: String!) { fileReplace(id: $id, uploadId: $uploadId) { id } }`);
const FilesReorder = graphql(`mutation FilesReorder($versionId: ID!, $ids: [ID!]!) { filesReorder(versionId: $versionId, ids: $ids) { id } }`);
const FileDelete = graphql(`mutation FileDelete($id: ID!) { fileDelete(id: $id) }`);
const FileGuessQuery = graphql(`
    query FileGuess($versionId: ID!, $name: String!) {
        fileGuess(versionId: $versionId, name: $name) {
            title desk
            role { id }
            instruments { id }
            transposition { pitch octave }
        }
    }
`);
const NumberCreate = graphql(`mutation NumberCreate($spexId: ID!, $input: NumberInput!) { numberCreate(spexId: $spexId, input: $input) { id } }`);
const NumberUpdate = graphql(`mutation NumberUpdate($id: ID!, $input: NumberInput!) { numberUpdate(id: $id, input: $input) { id } }`);
const NumberDelete = graphql(`mutation NumberDelete($id: ID!) { numberDelete(id: $id) }`);
const NumbersPaste = graphql(`mutation NumbersPaste($spexId: ID!, $text: String!) { numbersPaste(spexId: $spexId, text: $text) { id } }`);
const NumbersReorder = graphql(`mutation NumbersReorder($spexId: ID!, $ids: [ID!]!) { numbersReorder(spexId: $spexId, ids: $ids) { id } }`);
const NumberMerge = graphql(`mutation NumberMerge($id: ID!, $intoId: ID!) { numberMerge(id: $id, intoId: $intoId) { id } }`);
const ShareLinkCreate = graphql(`mutation ShareLinkCreate($input: ShareLinkInput!) { shareLinkCreate(input: $input) { token shareLink { id name expiresAt } } }`);
const ShareLinkExtend = graphql(`mutation ShareLinkExtend($id: ID!, $months: Int!) { shareLinkExtend(id: $id, months: $months) { id expiresAt } }`);
const ShareLinkRename = graphql(`mutation ShareLinkRename($id: ID!, $name: String!) { shareLinkRename(id: $id, name: $name) { id name } }`);
const AccessRequestHandle = graphql(`mutation AccessRequestHandle($id: ID!, $handled: Boolean) { accessRequestHandle(id: $id, handled: $handled) { id handledAt } }`);
const ShareLinkRevoke = graphql(`mutation ShareLinkRevoke($id: ID!) { shareLinkRevoke(id: $id) { id } }`);
const AccessRequestCreate = graphql(`mutation AccessRequestCreate($input: AccessRequestInput!) { accessRequestCreate(input: $input) }`);

export const manuscriptCreate = async (input: ManuscriptInput) => (await runMutation(ManuscriptCreate, { input }))?.manuscriptCreate;
export const manuscriptUpdate = (id: string, input: ManuscriptInput) => runMutation(ManuscriptUpdate, { id, input });
export const manuscriptTrash = (id: string) => runMutation(ManuscriptTrash, { id });
export const manuscriptRestore = (id: string) => runMutation(ManuscriptRestore, { id });
export const manuscriptDelete = (id: string) => runMutation(ManuscriptDelete, { id });
export const arrangementCreate = async (input: ArrangementInput) => (await runMutation(ArrangementCreate, { input }))?.arrangementCreate;
export const arrangementUpdate = (id: string, input: ArrangementInput) => runMutation(ArrangementUpdate, { id, input });
export const arrangementTrash = (id: string) => runMutation(ArrangementTrash, { id });
export const arrangementRestore = (id: string) => runMutation(ArrangementRestore, { id });
export const arrangementDelete = (id: string) => runMutation(ArrangementDelete, { id });
export const versionCreate = async (parentId: string, input: VersionInput) => (await runMutation(VersionCreate, { parentId, input }))?.versionCreate;
export const versionUpdate = (id: string, input: VersionInput) => runMutation(VersionUpdate, { id, input });
export const versionCopy = async (id: string) => (await runMutation(VersionCopy, { id }))?.versionCopy;
export const versionPublish = (id: string, published: boolean) => runMutation(VersionPublish, { id, published });
export const versionRecommend = (id: string, recommended: boolean) => runMutation(VersionRecommend, { id, recommended });
export const versionTrash = (id: string) => runMutation(VersionTrash, { id });
export const versionRestore = (id: string) => runMutation(VersionRestore, { id });
export const versionDelete = (id: string) => runMutation(VersionDelete, { id });
export const fileAdd = async (input: FileAddInput) => (await runMutation(FileAdd, { input }))?.fileAdd;
export const fileUpdate = (id: string, input: FileInput) => runMutation(FileUpdate, { id, input });
export const fileReplace = (id: string, uploadId: string) => runMutation(FileReplace, { id, uploadId });
export const filesReorder = (versionId: string, ids: string[]) => runMutation(FilesReorder, { versionId, ids });
export const fileDelete = (id: string) => runMutation(FileDelete, { id });
export const fileGuess = async (versionId: string, name: string) => (await runQuery(FileGuessQuery, { versionId, name }))?.fileGuess;
export const numberCreate = (spexId: string, input: NumberInput) => runMutation(NumberCreate, { spexId, input });
export const numberUpdate = (id: string, input: NumberInput) => runMutation(NumberUpdate, { id, input });
export const numberDelete = (id: string) => runMutation(NumberDelete, { id });
export const numbersPaste = (spexId: string, text: string) => runMutation(NumbersPaste, { spexId, text });
export const numbersReorder = (spexId: string, ids: string[]) => runMutation(NumbersReorder, { spexId, ids });
export const numberMerge = (id: string, intoId: string) => runMutation(NumberMerge, { id, intoId });
export const shareLinkCreate = async (input: ShareLinkInput) => (await runMutation(ShareLinkCreate, { input }))?.shareLinkCreate;
export const shareLinkExtend = (id: string, months: number) => runMutation(ShareLinkExtend, { id, months });
export const shareLinkRename = (id: string, name: string) => runMutation(ShareLinkRename, { id, name });
export const accessRequestHandle = (id: string, handled: boolean) => runMutation(AccessRequestHandle, { id, handled });
export const shareLinkRevoke = (id: string) => runMutation(ShareLinkRevoke, { id });
export const accessRequestCreate = (input: AccessRequestInput) => runMutation(AccessRequestCreate, { input });
