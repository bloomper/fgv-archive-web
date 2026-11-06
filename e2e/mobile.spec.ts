import { uuidOf } from "./constants";
import { expect, test } from "./fixtures";

const WIDTH = 375;

async function fits(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(WIDTH);
}

test.describe("Phone width: no page scrolls sideways", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: WIDTH, height: 812 });
  });

  test("the reading pages and the reader fit the screen", async ({ page, loginAs }) => {
    await loginAs("user");

    for (const path of ["/", "/spex", `/spex/${uuidOf(11)}`, `/spex/${uuidOf(11)}/parts`, `/manuscripts/${uuidOf(401)}`,
      `/arrangements/${uuidOf(411)}`, `/arrangements/${uuidOf(412)}`, `/files/${uuidOf(611)}`, "/search?q=kungamantel"]) {
      await fits(page, path);
    }
  });

  test("the editing and admin pages fit the screen", async ({ page, loginAs }) => {
    await loginAs("admin");

    for (const path of [`/versions/${uuidOf(511)}/edit`, `/spex/${uuidOf(11)}/numbers`, "/manage/missing", "/manage/share-links",
      "/manage/trash", "/manage/audit", "/manage/manuscripts/new", "/admin/settings", "/admin/instruments", "/admin/file-roles",
      "/admin/storage", "/admin/maintenance"]) {
      await fits(page, path);
    }
  });

  test("the share pages fit the screen, logged out", async ({ page }) => {
    await fits(page, "/share/exempel-giltig-delningslank-0000000000000001");
    await fits(page, `/share/exempel-giltig-delningslank-0000000000000001/files/${uuidOf(601)}`);
    await fits(page, "/share/exempel-utgangen-delningslank-00000000000001");
  });
});
