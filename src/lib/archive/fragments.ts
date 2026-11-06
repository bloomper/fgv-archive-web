import { graphql } from "@/gql";

/**
 * Shared selections, so that every page sees a spex, a version and a file the same way.
 */
export const SpexBriefFragment = graphql(`
    fragment SpexBrief on Spex { id title year revival parentId categoryId categoryName }
`);

export const InstrumentBriefFragment = graphql(`
    fragment InstrumentBrief on Instrument { id nameSv nameEn group position defaultTransposition { pitch octave } }
`);

export const FileFieldsFragment = graphql(`
    fragment FileFields on File {
        id versionId title comment name extension contentType size pages position desk processing hasPreview hasText
        canOpen downloadCount createdAt
        role { id nameSv nameEn }
        instruments { ...InstrumentBrief }
        transposition { pitch octave }
    }
`);

export const VersionFieldsFragment = graphql(`
    fragment VersionFields on Version {
        id kind parentId label usedInSpexId date notes arranger tempo duration recommended restricted published
        publishedAt trashed canOpen createdAt lastModifiedAt
        usedIn { ...SpexBrief }
        key { tonic mode }
        modulations { tonic mode }
        instrumentation { count instrument { ...InstrumentBrief } }
    }
`);
