import { expect, type Page, test as base } from "@playwright/test";
import { MOCK_URL } from "./constants";

type Persona = "admin" | "editor" | "user" | "noaccess";

let logins = 0;

/** A documentation address (RFC 5737) per login: 192.0.2.1, 192.0.2.2, … */
function nextClientIp() {
  logins = logins % 254 + 1;
  return `192.0.2.${logins}`;
}

export const test = base.extend<{
  resetBackend: void;
  noNativeDialogs: void;
  loginAs: (persona: Persona) => Promise<void>;
  mock: Mock
}>({
  resetBackend: [async ({ request }, provide) => {
    await request.post(`${MOCK_URL}/__reset`);
    await provide();
  }, { auto: true }],
  // The application asks in its own dialogs; a native alert, confirm or prompt fails the test
  noNativeDialogs: [async ({ page }, provide) => {
    const native: string[] = [];

    page.on("dialog", dialog => {
      native.push(`${dialog.type()}: ${dialog.message()}`);
      void dialog.dismiss();
    });
    await provide();
    expect(native, "native dialogs").toEqual([]);
  }, { auto: true }],
  loginAs: async ({ page, request }, provide) => {
    await provide(async (persona: Persona) => {
      expect((await request.post(`${MOCK_URL}/__persona`, { data: { persona } })).status(), "persona set").toBe(204);
      // Better Auth limits requests per client IP. Every test comes from the same machine, so without an address
      // of its own each login would count against one shared limit, and a busy run gets "Too many requests"
      await page.setExtraHTTPHeaders({ "x-forwarded-for": nextClientIp() });
      // A second login in one test starts afresh too: c15t also remembers the dismissed notice in local storage
      if (page.url().startsWith("http")) {
        await page.evaluate(() => localStorage.clear());
        // Leave the page first: its own requests would otherwise start logins of their own once the cookies are
        // gone, and theirs replace this login's state cookie ("State mismatch", now and then a failed login)
        await page.goto("about:blank");
      }
      await page.context().clearCookies();
      await page.goto("/api/auth/login");
      await page.waitForURL(url => !url.pathname.startsWith("/api/auth"));
      await dismissConsent(page);
    });
  },
  mock: async ({ request }, provide) => {
    await provide({
      state: async () => (await request.get(`${MOCK_URL}/__state`)).json() as Promise<MockState>,
    });
  },
});

type MockState = {
  uploads: number;
  fileAdds: {
    versionId: string;
    uploadId: string;
    title?: string;
    roleId?: string;
    instrumentIds?: string[];
    desk?: string | null;
    transposition?: { pitch: string; octave: number } | null
  }[];
  fileUpdates: { id: string; input: { instrumentIds?: string[]; transposition?: { pitch: string; octave: number } | null } }[];
  accessRequests: { reason: string; fileIds: string[] }[];
  shareLinks: { id: string; name: string; versionIds: string[]; tokenLength: number }[];
  /** The file and zip addresses asked for, share tokens replaced by "<token>". */
  zips: string[];
  numbers: { id: string; spexId: string; position: number; title: string }[];
};

type Mock = {
  /** What the backend holds, for checking what the web sent. */
  state: () => Promise<MockState>;
};

/**
 * Dismisses c15t's cookie notice and waits until it is stored, so a page opened right away does not show it again over
 * the bottom of the page.
 */
export async function dismissConsent(page: Page) {
  await page.getByRole("button", { name: "Jag förstår" }).click();
  await expect.poll(async () => (await page.context().cookies()).some(cookie => cookie.name === "c15t-notice")).toBe(true);
}

/**
 * Waits until React has hydrated the element: a file chosen with {@code setInputFiles} before that is lost, since the
 * browser's change event fires before React listens.
 */
export async function hydrated(page: Page, selector: string) {
  await page.waitForFunction(css => {
    const element = document.querySelector(css);

    return element !== null && Object.keys(element).some(key => key.startsWith("__reactProps"));
  }, selector);
}

/**
 * Answers the application's own confirm or prompt dialog: fills the text, if any, and clicks the button.
 */
export async function answerDialog(page: Page, button: string, text?: string) {
  const dialog = page.getByRole("dialog");

  if (text !== undefined) {
    await dialog.getByRole("textbox").fill(text);
  }
  await dialog.getByRole("button", { name: button, exact: true }).click();
  await expect(dialog).toBeHidden();
}

export { expect } from "@playwright/test";
