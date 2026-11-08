<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Spexarkiv Web — project notes

Next.js 16 App Router + React 19 frontend for Spexarkiv, FGV's archive of the spex' manuscripts and arrangements. It
is backed by `fgv-archive-server`'s GraphQL API and its plain HTTP endpoints for files, previews, zips, share links and
tus uploads. Stack and setup: `README.md`. Product spec: `fgv-archive-spec`. The scaffolding (auth, layout, i18n,
shadcn, dialogs, change log, CI) comes from `fgv-spexify-web`; keep them alike.

## Commands

- `npm run dev` (port 3005) / `build` / `start` — `dev` and `build` first copy pdf.js's assets to `public/pdfjs`
- `npm run lint`, `npm run typecheck` (covers `src/**` only)
- `npm run test` (Vitest), `npm run test:e2e` (Playwright on ports 3105/4105, `e2e/mock-backend.mjs` stands in for the
  server and Keycloak)
- `npm run gql-codegen` — regenerate `src/gql/` from a sibling `fgv-archive-server` checkout. Commit the result.

**Don't run `npm run format`**: `.prettierrc` uses 2 spaces and the code base 4.

## Conventions

- `"use client"` ⇔ `*.client.ts(x)`; `import "server-only"` and `"use server"` ⇔ `*.server.ts`. Exceptions:
  `src/auth.ts`, Next.js reserved file names, and shadcn's `src/components/ui/**` and `src/hooks/use-mobile.ts`.
- Cache Components is on. A page that fetches at the top needs a `loading.tsx`, and `(app)/layout.tsx` keeps
  `export const instant = false`. The root layout's metadata stays static.
- Cache Components keeps visited pages alive, so a client component that copies a server prop into state uses
  `useServerState` (`src/hooks/use-server-state.client.ts`), never `useState(prop)`; a form whose fields start from the
  server's values is keyed by the record's `lastModifiedAt` (`VersionForm`) or its content (`SettingsForm`).
- Locale is a cookie (`sv` default); messages in `messages/{sv,en}.json`, kept in step by `src/__tests__/messages.test.ts`.
- Auth: Better Auth + Keycloak, stateless. Its `/get-access-token`, `/refresh-token` and `/account-info` routes are
  disabled (`disabledPaths` in `src/auth.ts`), so browsers never see the tokens; the server calls `auth.api` directly. `getSessionContext()` in `src/utils/auth.server.ts` is the single entry
  point; roles come from `resource_access["fgv-archive"].roles`: `USER` (access), `EDITOR`, `ADMIN`. Gate pages with
  `withPolicyPage(Policies.<area>.require…)`; `Policies` are `app.requireAccess`, `editor.requireEditor`,
  `admin.requireAdmin`. The server enforces every rule anyway.
- No `NEXT_PUBLIC_*` variables: read config on the server at request time and pass it as props.
- Mutations are server actions in `src/app/(app)/manage/actions.server.ts` (editors) and
  `src/app/(app)/admin/actions.server.ts` (admins); they check ids, return `ActionResult` and revalidate the whole app
  (`revalidatePath("/", "layout")`), since material shows on many pages.

## How Spexarkiv works in the web

- **Notes and keys** (`src/utils/music.ts`): the server's enums are ASCII (`C_SHARP`, `B_FLAT`); show them with
  `noteName`, `formatKey`, `formatKeys` (with modulations, "F-dur → G-dur") and `formatTransposition` ("B 8vb"). Swedish
  uses Swedish names (B♭ is B, B is H, E♭ is Ess, C♯ is Ciss …; minor keys in lower case, "h-moll"), English ♯ and ♭.
  `parseTonic`/`parseKey` accept what people type (`Bb`, `F#m`, `Ess-dur`, `h-moll`; B is B♭ in Swedish only).
- **Part filters** (`src/utils/filters.ts`): a page's filter is `?instruments=<ids>&pitches=<Pitch>`, comma separated;
  the API's zips take `instrumentIds` and `transpositions`. `PartFilterControls` toggles chips and replaces the address.
  A part matches when it carries any chosen instrument and is written in any chosen pitch.
- **Files** never go to the browser from the API directly: `/api/files/[id]` (`?download=true`), `/api/files/[id]/preview`,
  `/api/versions/[id]/zip`, `/api/versions/[id]/parts/zip`, `/api/spex/[id]/parts/zip` stream the server's answer with
  the user's token (`streamFromApi`, passing `Range`, `Content-Range`, `Accept-Ranges`, `Content-Disposition` and the
  server's `Content-Security-Policy`). Every such answer also gets `Content-Security-Policy: sandbox; default-src
  'none'` and `nosniff` from the web (`FILE_CSP`): files are served on the web's origin, and the page CSP in `proxy.ts`
  does not cover `/api/*`. The server serves only PDFs and images inline.
  Addresses are built in `src/utils/links.ts`.
- **The reader** (`src/components/reader/`) is pdf.js (`pdfjs-dist`), loaded only in the browser, with its worker, fonts,
  CMaps and decoders from `public/pdfjs` (the CSP allows nothing else; `'wasm-unsafe-eval'`, for its decoders, only on
  the reader's pages, `isReaderPath`; elsewhere pdf.js uses its JavaScript fallbacks). Scripts keep `'unsafe-inline'`:
  a nonce needs every page rendered per request, which Cache Components' static shells rule out. It
  loads byte ranges (`disableAutoFetch`, `disableStream`), renders pages as they come into view with a text layer, has
  thumbnails, zoom (fit width / fit page), full screen, a page view for a music stand (tap the left or right quarter,
  arrow keys or a page-turner pedal) and keeps `?page=` in the address. Shortcuts: arrows, PageUp/PageDown, space,
  Home/End, `+`/`-`/`0`, `f`, `t`, `p`.
- **Restricted versions** list their files with a lock for users; `AccessRequest` asks the editors with a reason.
  Editors see the requests at `/manage/access-requests` (open first; `?show=handled|all`) and answer one with
  `ShareRequestButton`: a share link for exactly the requested files, named after the person, with a `mailto:` carrying
  the address, marking the request handled when the dialog closes (`ShareLinkButton`'s `afterCreate` and `onDone`).
  They can also mark requests handled, or open them again, by hand (`accessRequestHandle`).
  `/versions/[id]` (linked from the access request emails) redirects to the version in its parent's page; logging in
  from there comes back to it (`/api/auth/login?returnTo=`).
- **Numbers** are the archive's own until Spexipedia (spec 4.4): `/spex/[id]/numbers` pastes, adds, edits, reorders
  (drag or arrows), deletes a number without an arrangement and merges one that has one (`useDialogs().choose`).
- **Uploads** use tus through `/api/uploads/[[...path]]` (chunks of 50 MB, `proxyClientMaxBodySize` 55 MB). `FileManager`
  asks `fileGuess` for each dropped file, uploads it at once, and lets the editor correct the role, instruments (ordered,
  `InstrumentsPicker`), desk and transposition before `fileAdd`; a new part's transposition follows its first
  instrument's default until the editor picks one.
- **A spex' parts** (`/spex/[id]/parts`) list, per arrangement, `Arrangement.partsVersion(usedIn: <spex>)`: the version
  the zip takes, chosen by the server with the zip's own rule. Don't choose it in the web.
- **Share links** are shown once, right after they are made (`ShareLinkButton`), from a version, the spex page (each
  manuscript's and arrangement's recommended published version), chosen files, or a spex' instruments and
  transpositions (`/spex/[id]/parts`); editors rename, extend and revoke them under `/manage/share-links`. `/share/[token]` and `/share/[token]/files/[id]` live
  outside `(app)`: no login, no sidebar or switcher, no Umami (the tracker is only rendered by the `(app)` layout, and
  `/stats/api/send` drops anything naming `/share/`), `noindex` and no referrer. They read `sharedView` without the
  visitor's session (`src/lib/share/share.server.ts`), with the page's part filter (`files(parts)`; `allFiles` for the
  filter's choices); every file it lists has `canOpen: true`, and `sharedView.spex`, `instruments` and `transpositions`
  say when a link was made for instruments, which gets the zip in the order of the show, and their files through `/api/share/[token]/[...path]`, which
  passes only the share endpoints on, anonymously; expired and revoked links name who made them.
- **Dialogs**: never `window.confirm`, `window.prompt` or `window.alert`. Ask with `useDialogs()` (`confirm`, `prompt`,
  `choose`). The e2e fixture `noNativeDialogs` fails any test that opens a native dialog.
- **The change log** (`ChangeLog`, `RecordHistory`) is Spexify's; record kinds and their pages are in
  `src/app/(app)/manage/audit/links.ts`.
- **Editors** work under `/manage` and on `/versions/[id]/edit`, **admins** under `/admin`.

## Look

The look is FGV's, the same as Spexregister's, Nyuppsättning's, Spexify's and Spexflix's: `Logo`, `LogoText` and
`LogoHome` in `src/components/`, `src/app/favicon.ico`, and the colours in `src/app/globals.css`. Don't give the
application a logo or colours of its own; its name, Spexarkiv, appears as text (the header's title, the share
pages). `src/app/icon.svg` (the FGV logo) is only for the installable app's manifest. `globals.css` also holds pdf.js's
text layer rules.

## Consent and visitor statistics

The cookie banner is c15t (`src/components/consent-manager.client.tsx`) in offline mode with only the `necessary`
category. Umami, self-hosted in `fgv-infra-deploy`, is reached server-side at `UMAMI_URL`: `src/app/stats/` serves the
tracker and forwards events. `src/components/umami.tsx` renders nothing unless `UMAMI_URL` and `UMAMI_WEBSITE_ID` are
both set, and drops query strings. Events go through `track()` (`src/utils/umami.ts`), enum values, counts and booleans
only: `access-request` (`files`), `arrangement-create`, `manuscript-create`, `version-publish` (`published`),
`file-upload` (`instruments`), `share-link-create` (`versions`, `files`, `instruments`), and `data-umami-event` on the
download links.

## Application switcher

As in the other webs (`src/utils/applications.ts`, `src/components/app-switcher.client.tsx` and their tests are
identical copies); only the id in `applications.server.ts` (`archive`) differs.

## Testing

- E2E specs per area: shell, no access, reading (browse, reader, filters, restricted, search), editing (upload, file
  metadata, key, share links, numbers), share links (logged out), admin, language, mobile (375 px, no sideways scroll).
  The mock backend keeps state per test (reset automatically), implements tus, byte ranges and the share endpoints, and
  makes small PDFs itself; `mock.state()` lets a spec check what the web sent. Personas: `admin`, `editor`, `user`,
  `noaccess`.
- Call `hydrated(page, selector)` before `setInputFiles`: a file chosen before React hydrates the input is lost.
- Unit tests in `__tests__/` beside the code. All test data is fictitious.
- Cache Components keeps visited routes mounted but hidden, so prefer role queries, and use `{exact: true}` for labels
  that are part of others.
