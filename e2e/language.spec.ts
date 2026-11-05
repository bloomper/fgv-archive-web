import { uuidOf } from "./constants";
import { expect, test } from "./fixtures";

test.describe("Language", () => {
  test("switches to English note names and back", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.goto(`/arrangements/${uuidOf(412)}`);
    await expect(page.getByTestId("version-card")).toContainText("b-moll");

    await page.getByRole("button", { name: "Byt språk" }).click();
    await page.getByRole("menuitem", { name: "English" }).click();
    await expect(page.getByTestId("version-card")).toContainText("B♭ minor");
    await expect(page.getByRole("link", { name: "Search", exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Change language" }).click();
    await page.getByRole("menuitem", { name: "Svenska" }).click();
    await expect(page.getByTestId("version-card")).toContainText("b-moll");
  });
});
