import "server-only";

import { cache } from "react";
import { graphql } from "@/gql";
import { runQuery } from "@/lib/graphql.server";
import type { KeyInput, PartFilter, SpexFilter } from "@/gql/graphql";

const MeQuery = graphql(`
    query Me {
        me { username displayName roles }
        settings { welcomeSv welcomeEn maxUploadMb manuscriptRestricted arrangementRestricted maxShareLinkMonths }
    }
`);

const HomeQuery = graphql(`
    query Home {
        categories { id name spexCount }
        years
        recentVersions(limit: 12) {
            ...VersionFields
            manuscript { id title spex { ...SpexBrief } }
            arrangement { id number { id title position spex { ...SpexBrief } } }
        }
    }
`);

const BrowseQuery = graphql(`
    query Browse { categories { id name spexCount } years }
`);

const SpexListQuery = graphql(`
    query SpexList($filter: SpexFilter) {
        spexList(filter: $filter) {
            ...SpexBrief manuscriptCount arrangementCount
            revivals { ...SpexBrief manuscriptCount arrangementCount }
        }
    }
`);

const SpexPageQuery = graphql(`
    query SpexPage($id: ID!) {
        spex(id: $id) {
            ...SpexBrief numbersInherited manuscriptCount arrangementCount
            original { ...SpexBrief }
            revivals { ...SpexBrief }
            manuscripts {
                id title authors description trashed
                versions { ...VersionFields }
            }
            numbers {
                id spexId position title originalSong lyricist composer
                arrangement {
                    id trashed
                    versions { id label published restricted recommended trashed key { tonic mode } usedIn { ...SpexBrief } }
                }
            }
        }
    }
`);

const SpexArrangementsQuery = graphql(`
    query SpexArrangements($id: ID!, $parts: PartFilter) {
        spex(id: $id) {
            ...SpexBrief
            arrangements(parts: $parts) {
                id
                number { id position title }
                versions(parts: $parts) { id label recommended canOpen usedInSpexId files(parts: $parts) { ...FileFields } }
            }
        }
        instruments { ...InstrumentBrief }
    }
`);

const ManuscriptQuery = graphql(`
    query Manuscript($id: ID!) {
        manuscript(id: $id) {
            id spexId title authors description trashed createdAt
            spex { ...SpexBrief revivals { ...SpexBrief } }
            versions {
                ...VersionFields
                files { ...FileFields }
                usedIn { id numbers { id position title arrangement { id } } }
            }
        }
    }
`);

const ArrangementQuery = graphql(`
    query Arrangement($id: ID!, $parts: PartFilter) {
        arrangement(id: $id) {
            id numberId description trashed createdAt
            number { id spexId position title originalSong lyricist composer spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } }
            versions {
                ...VersionFields
                files(parts: $parts) { ...FileFields }
                allFiles: files { id role { id } instruments { id } transposition { pitch octave } }
            }
        }
        instruments { ...InstrumentBrief }
    }
`);

const VersionQuery = graphql(`
    query Version($id: ID!) {
        version(id: $id) {
            ...VersionFields
            files { ...FileFields }
            manuscript { id title spexId spex { ...SpexBrief revivals { ...SpexBrief } } }
            arrangement { id number { id title position spexId spex { ...SpexBrief original { ...SpexBrief } revivals { ...SpexBrief } } } }
        }
    }
`);

const FileQuery = graphql(`
    query File($id: ID!) {
        file(id: $id) { ...FileFields }
    }
`);

const FileVersionQuery = graphql(`
    query FileVersion($id: ID!) {
        version(id: $id) {
            id kind parentId label canOpen restricted
            files { id title pages canOpen contentType extension }
            manuscript { id title spex { ...SpexBrief } }
            arrangement { id number { id title position spex { ...SpexBrief } } }
        }
    }
`);

const SearchQuery = graphql(`
    query Search($q: String!, $parts: PartFilter, $key: KeyInput) {
        search(q: $q, parts: $parts, key: $key) {
            spex { ...SpexBrief }
            manuscripts { id title authors spex { ...SpexBrief } }
            numbers { id title position originalSong lyricist composer spex { ...SpexBrief } arrangement { id } }
            arrangements { id description number { id title position spex { ...SpexBrief } } }
            versions {
                id label key { tonic mode } modulations { tonic mode } arranger
                arrangement { id number { id title position spex { ...SpexBrief } } }
            }
            textHits {
                page snippet
                file { id title canOpen role { id nameSv nameEn } instruments { ...InstrumentBrief } transposition { pitch octave } }
                version {
                    id label kind
                    manuscript { id title spex { ...SpexBrief } }
                    arrangement { id number { id title spex { ...SpexBrief } } }
                }
            }
        }
        instruments { ...InstrumentBrief }
    }
`);

const InstrumentsQuery = graphql(`
    query Instruments {
        instruments { ...InstrumentBrief abbreviations useCount }
    }
`);

const FileRolesQuery = graphql(`
    query FileRoles { fileRoles { id nameSv nameEn position fileCount } }
`);

const MissingQuery = graphql(`
    query Missing($categoryId: ID) {
        categories { id name spexCount }
        missingManuscripts(categoryId: $categoryId) { ...SpexBrief }
        missingArrangements(categoryId: $categoryId) { id position title originalSong spex { ...SpexBrief } }
    }
`);

const SpexSearchQuery = graphql(`
    query SpexSearch($filter: SpexFilter) {
        spexList(filter: $filter) { ...SpexBrief revivals { ...SpexBrief } }
    }
`);

export const getMe = cache(async () => runQuery(MeQuery, {}));
export const getHome = async () => runQuery(HomeQuery, {});
export const getBrowse = async () => runQuery(BrowseQuery, {});
export const getSpexList = async (filter: SpexFilter) => (await runQuery(SpexListQuery, { filter }))?.spexList ?? [];
export const getSpexPage = async (id: string) => (await runQuery(SpexPageQuery, { id }))?.spex ?? null;
export const getSpexArrangements = async (id: string, parts: PartFilter | null) =>
  runQuery(SpexArrangementsQuery, { id, parts });
export const getManuscript = async (id: string) => (await runQuery(ManuscriptQuery, { id }))?.manuscript ?? null;
export const getArrangement = async (id: string, parts: PartFilter | null) => runQuery(ArrangementQuery, { id, parts });
export const getVersion = async (id: string) => (await runQuery(VersionQuery, { id }))?.version ?? null;
export const getFile = async (id: string) => (await runQuery(FileQuery, { id }))?.file ?? null;
export const getFileVersion = async (id: string) => (await runQuery(FileVersionQuery, { id }))?.version ?? null;
export const search = async (q: string, parts: PartFilter | null, key: KeyInput | null) =>
  runQuery(SearchQuery, { q, parts, key });
export const getInstruments = cache(async () => (await runQuery(InstrumentsQuery, {}))?.instruments ?? []);
export const getFileRoles = cache(async () => (await runQuery(FileRolesQuery, {}))?.fileRoles ?? []);
export const getMissing = async (categoryId: string | null) => runQuery(MissingQuery, { categoryId });

/**
 * Original spex whose title or year matches, each followed by its revivals, for picking a spex.
 */
export async function searchSpex(q: string) {
  const list = (await runQuery(SpexSearchQuery, { filter: { q } }))?.spexList ?? [];

  return list.flatMap(({ revivals, ...spex }) => [spex, ...revivals]);
}
