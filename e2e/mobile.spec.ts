import type { Page } from "@playwright/test";
import { uuidOf } from "./constants";
import { expect, test } from "./fixtures";

/** A small phone, a common phone and a tablet held upright. */
const WIDTHS = [360, 390, 768];

const READING = ["/", "/spex", `/spex/${uuidOf(11)}`, `/spex/${uuidOf(11)}/parts`, `/manuscripts/${uuidOf(401)}`,
  `/arrangements/${uuidOf(411)}`, `/arrangements/${uuidOf(412)}`, `/files/${uuidOf(611)}`, "/search?q=kungamantel",
  "/about", "/support"];
const EDITING = [`/versions/${uuidOf(511)}/edit`, `/spex/${uuidOf(11)}/numbers`, "/manage/missing", "/manage/share-links",
  "/manage/trash", "/manage/audit", "/manage/access-requests?show=all", "/manage/manuscripts/new", "/admin/settings",
  "/admin/instruments", "/admin/file-roles", "/admin/storage", "/admin/maintenance", "/admin/share-links"];
const SHARED = ["/share/exempel-giltig-delningslank-0000000000000001",
  "/share/exempel-instrumentlank-trumpet-000000000001",
  `/share/exempel-giltig-delningslank-0000000000000001/files/${uuidOf(601)}`,
  "/share/exempel-utgangen-delningslank-00000000000001"];

async function fits(page: Page, path: string, width: number) {
  await page.goto(path);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} at ${width} px`).toBeLessThanOrEqual(width);
}

test.describe("Phones and tablets: no page scrolls sideways", () => {
  for (const width of WIDTHS) {
    test.describe(`${width} px`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
      });

      test("the reading pages and the reader fit the screen", async ({ page, loginAs }) => {
        await loginAs("user");

        for (const path of READING) {
          await fits(page, path, width);
        }
      });

      test("the editing and admin pages fit the screen", async ({ page, loginAs }) => {
        test.setTimeout(60_000);
        await loginAs("admin");

        for (const path of EDITING) {
          await fits(page, path, width);
        }
      });

      test("the start page and the share pages fit the screen, logged out", async ({ page }) => {
        for (const path of ["/", ...SHARED]) {
          await fits(page, path, width);
        }
      });
    });
  }
});

test.describe("The reader on a tablet held upright", () => {
  test("has the whole width: the sidebar collapses while it is open and comes back after", async ({ page, loginAs }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAs("user");
    const sidebar = page.locator("[data-slot=sidebar][data-state]");

    await page.goto(`/manuscripts/${uuidOf(401)}`);
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await page.goto(`/files/${uuidOf(611)}`);
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await page.goBack();
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  });
});

test.describe("The header on a phone", () => {
  test("shows the application's whole name, and search as a button to the search page", async ({ page, loginAs }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await loginAs("user");

    const name = page.locator("header").first().getByText("Spexarkiv", { exact: true });

    await expect(page.locator("header").first().getByRole("button", { name: "Visa menyn" })).toBeVisible();

    await expect(name).toBeVisible();
    expect(await name.evaluate(element => element.scrollWidth <= element.clientWidth), "the name is not cut off").toBe(true);
    await expect(page.getByRole("searchbox", { name: "Sök i arkivet" })).toBeHidden();

    await page.locator("header").first().getByRole("link", { name: "Sök", exact: true }).click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole("searchbox", { name: "Sökord" })).toBeVisible();
  });
});
