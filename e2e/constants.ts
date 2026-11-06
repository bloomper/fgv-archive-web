export const AUTH_SECRET = "e2e-super-secret-key-for-tests-only-0123456789abcdef";
export const MOCK_PORT = 4105;
export const APP_PORT = 3105;
export const BASE_URL = `http://localhost:${APP_PORT}`;
export const MOCK_URL = `http://localhost:${MOCK_PORT}`;

/** The UUID the mock backend gives the entity numbered n. */
export const uuidOf = (n: number) => `00000000-0000-7000-8000-${String(n).padStart(12, "0")}`;
