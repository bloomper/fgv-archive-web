# Spexarkivet Web

## Overview

Spexarkivet Web is the frontend of Spexarkivet, FGV's archive of the spex' manuscripts and musical arrangements.
Readers browse the spex, read manuscripts and scores in the page (pdf.js, also on a tablet on a music stand), filter
parts by instrument and transposition, download files, versions and parts as zips, search the files' text, and ask for
access to restricted material. Editors keep the numbers of each spex, upload files, edit versions and make share
links; admins keep the settings, instruments and file roles. Share links open their material to anyone, without
logging in. It talks to [Spexarkivet Server][1] over GraphQL and plain HTTP. The product spec is in
[fgv-archive-spec][2].

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Cache Components)
- **UI & Styling:** [shadcn/ui](https://ui.shadcn.com/), [Base UI](https://base-ui.com/) &
  [Tailwind CSS 4](https://tailwindcss.com/)
- **Data Fetching:** [urql](https://formidable.com/open-source/urql/) (GraphQL) with GraphQL Code Generator
- **Authentication:** [Better Auth](https://better-auth.com/) (Keycloak integration, stateless sessions)
- **Internationalization:** [next-intl](https://next-intl-docs.vercel.app/) (Supports Swedish & English)
- **PDF reading:** [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`), loading pages by byte ranges
- **Uploads:** [tus-js-client](https://github.com/tus/tus-js-client), resumable, in chunks of at most 50 MB

The look (logo, favicon and colours) is FGV's, shared with Spexregister, Nyuppsättning, Spexify and Spexflix.

## Getting Started

### Prerequisites

- Node.js 26 (see `.nvmrc`)
- npm (package manager)
- Docker & Docker Compose (optional, for containerized setup)

### Development

1. **Install dependencies:**
   ```bash
   npm ci
   ```

2. **Configure environment:**
   Start fgv-infra-deploy's local stack, Spexregister's and [Spexarkivet Server][1]'s (its getting started guide
   describes all three), then create `.env.local` (`.env` already holds the rest):
   ```
   BETTER_AUTH_URL=http://localhost:3005
   AUTH_SECRET=<random string of at least 32 characters>
   KEYCLOAK_CLIENT_ID=fgv-archive
   KEYCLOAK_CLIENT_SECRET=<secret of the fgv-archive client>
   KEYCLOAK_ISSUER=https://auth.fgv.local.nu:8443/auth/realms/fgv
   API_GRAPHQL_ENDPOINT=https://api.archive.fgv.local.nu:8443/api/graphql
   SPEXREGISTER_WEB_URL=https://register.fgv.local.nu:8443
   FGV_REVIVAL_WEB_URL=http://localhost:3001
   SPEXIFY_WEB_URL=http://localhost:3002
   SPEXFLIX_WEB_URL=http://localhost:3003
   SPEXGRAM_WEB_URL=http://localhost:3004
   ```
   The client secret is in `realm/fgv.json` in [fgv-keycloak][7]; search for `fgv-archive`.
   For visitor statistics, run fgv-infra-deploy's `local/bin/configure-umami.sh` and put the ID it prints for
   Spexarkivet in `.env.local` as `UMAMI_WEBSITE_ID`, with `UMAMI_URL=https://analytics.fgv.local.nu:8443`.
   `npm run dev` and `docker compose` trust the root certificate of fgv-infra-deploy's local Caddy
   (`local/.docker/caddy/data/caddy/pki/authorities/local/root.crt`), read from `../../fgv-infra-deploy`, or from
   `INFRA_DEPLOY` if it is checked out elsewhere.

   | Variable                         | Purpose                                                                   |
   |----------------------------------|---------------------------------------------------------------------------|
   | `API_GRAPHQL_ENDPOINT`           | Spexarkivet Server's GraphQL endpoint; its file, zip, share and upload endpoints share the origin |
   | `SPEXREGISTER_WEB_URL`           | Spexregister, for the application switcher in the header                  |
   | `FGV_REVIVAL_WEB_URL`            | Nyuppsättning, for the application switcher                               |
   | `SPEXIFY_WEB_URL`                | Spexify, for the application switcher                                     |
   | `SPEXFLIX_WEB_URL`               | Spexflix, for the application switcher                                    |
   | `SPEXGRAM_WEB_URL`               | Spexgram, for the application switcher                                    |

3. **Generate GraphQL types:**
   If you change GraphQL queries or the schema, regenerate types from a sibling `fgv-archive-server` checkout:
   ```bash
   npm run gql-codegen
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3005](http://localhost:3005) with your browser to see the result. Port 3005 keeps it
   clear of the other FGV webs (Spexregister on 3000, Nyuppsättning on 3001, Spexify on 3002, Spexflix on 3003,
   Spexgram on 3004). `dev` and `build` first copy pdf.js's worker, fonts and decoders to `public/pdfjs`
   (`scripts/copy-pdfjs.mjs`), which is not in git.

The sample data's users (`admin@fgv.nu`, `editor@fgv.nu`, `user@fgv.nu`, `no-access@fgv.nu`) and share links are listed
under *Test credentials* in Spexarkivet Server's getting started guide.

## Docker

The project includes a `Dockerfile` and `docker-compose.yaml` for containerized deployment, including a Caddy reverse
proxy setup for local development with HTTPS.

### Running with Docker Compose

To start the application along with the Caddy reverse proxy:

```bash
docker compose up --build
```

The application will be accessible at `https://archive.fgv.local.nu:9443` if your hosts file is configured. It talks
to the server's API at `api.archive.fgv.local.nu:8443` and to Keycloak at `auth.fgv.local.nu:8443`, both behind
fgv-infra-deploy's local Caddy. To log in, `ARCHIVE_URL` in fgv-infra-deploy's `local/.env` must be
`https://archive.fgv.local.nu:9443`, since the realm only accepts redirects to that address.

### Published images

CI publishes `bloomper/fgv-archive-web` for `linux/amd64`:

| Trigger              | Tags                              |
|----------------------|-----------------------------------|
| push to `develop`    | `develop`, `sha-<commit>`         |
| push of tag `vX.Y.Z` | `X.Y.Z`, `latest`, `sha-<commit>` |

To release, set `version` in `package.json` to `X.Y.Z`, merge to `main`, then
`git tag vX.Y.Z && git push origin vX.Y.Z`. The publish fails if the tag doesn't match the version or if `X.Y.Z` is
already on Docker Hub.

The image contains no environment-specific values. All configuration is read at runtime: `BETTER_AUTH_URL`,
`AUTH_SECRET`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER`, `API_GRAPHQL_ENDPOINT`,
`SPEXREGISTER_WEB_URL`, `FGV_REVIVAL_WEB_URL`, `SPEXIFY_WEB_URL`, `SPEXFLIX_WEB_URL`, `SPEXGRAM_WEB_URL`,
`SUPPORT_EMAIL`, `FEEDBACK_EMAIL`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `UMAMI_URL` and `UMAMI_WEBSITE_ID`. Visitor
statistics go to Umami only when both Umami variables are set, and never from share link pages.
[fgv-archive-deploy][8] runs it.

## Building and Deployment

### Tests

`npm run test` runs the unit tests and `npm run test:e2e` the Playwright tests, against `e2e/mock-backend.mjs`, which
also acts as Keycloak (ports 3105 and 4105). See the [contributor guidelines][5] for the checks CI runs.

### Production Build

To create an optimized production build manually:

```bash
npm run build
npm run start
```

## Contributing

Contributors to this project agree to uphold its [code of conduct][3].

You can contribute to Spexarkivet Web by:

- Opening a [pull request][4]. Please see the [contributor guidelines][5] for details

## License

Spexarkivet Web is open source software released under the [Apache 2.0 license][6].

[1]: https://github.com/bloomper/fgv-archive-server

[2]: https://github.com/bloomper/fgv-archive-spec

[3]: CODE_OF_CONDUCT.md

[4]: https://help.github.com/articles/using-pull-requests/

[5]: CONTRIBUTING.md

[6]: https://www.apache.org/licenses/LICENSE-2.0.html

[7]: https://github.com/bloomper/fgv-keycloak

[8]: https://github.com/bloomper/fgv-archive-deploy
