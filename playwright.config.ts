import {defineConfig, devices} from "@playwright/test";
import {APP_PORT, AUTH_SECRET, BASE_URL, MOCK_PORT} from "./e2e/constants";

const appEnv: Record<string, string> = {
    AUTH_SECRET,
    KEYCLOAK_CLIENT_ID: "fgv-archive",
    KEYCLOAK_CLIENT_SECRET: "e2e",
    KEYCLOAK_ISSUER: `http://localhost:${MOCK_PORT}/realms/fgv`,
    API_GRAPHQL_ENDPOINT: `http://localhost:${MOCK_PORT}/api/graphql`,
    BETTER_AUTH_URL: BASE_URL,
    SUPPORT_EMAIL: "support.archive@example.org",
    FEEDBACK_EMAIL: "feedback.archive@example.org",
    UMAMI_URL: "",
    UMAMI_WEBSITE_ID: "",
};

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI
        ? [["github"], ["html", {open: "never"}], ["junit", {outputFile: "test-results/e2e-results.xml"}]]
        : [["list"], ["html", {open: "never"}]],
    timeout: 30_000,
    use: {
        baseURL: BASE_URL,
        locale: "sv-SE",
        trace: "on-first-retry",
    },
    projects: [
        {name: "chromium", use: {...devices["Desktop Chrome"]}},
    ],
    webServer: [
        {
            command: "node e2e/mock-backend.mjs",
            port: MOCK_PORT,
            env: {MOCK_PORT: String(MOCK_PORT)},
            reuseExistingServer: !process.env.CI,
            stdout: "pipe",
        },
        {
            command: `npm run build && next start -p ${APP_PORT}`,
            port: APP_PORT,
            env: {...appEnv, PORT: String(APP_PORT)},
            timeout: 240_000,
            reuseExistingServer: !process.env.CI,
            stdout: "pipe",
        },
    ],
});
