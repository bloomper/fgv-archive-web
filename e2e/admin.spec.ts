import { expect, test } from "./fixtures";

test.describe("Administration", () => {
  test("an admin adds an instrument with its default transposition", async ({ page, loginAs }) => {
    await loginAs("admin");
    await page.goto("/admin/instruments");
    await page.getByRole("button", { name: "Lägg till instrument" }).click();

    const form = page.getByRole("form", { name: "Instrument" });
    await form.getByLabel("Svenskt namn").fill("Klarinett");
    await form.getByLabel("Engelskt namn").fill("Clarinet");
    await form.getByLabel("Grupp").selectOption("WOODWIND");
    await form.getByLabel("Stämning", { exact: true }).selectOption("B_FLAT");
    await form.getByRole("button", { name: "Spara" }).click();

    await expect(page.getByRole("region", { name: "Träblås" }).getByText("Klarinett")).toBeVisible();
    await expect(page.getByRole("region", { name: "Träblås" }).getByText(/Clarinet · i B/)).toBeVisible();
    // One in use is merged, not deleted
    await expect(page.getByRole("button", { name: "Radera Trumpet" })).toBeDisabled();
  });

  test("an admin changes the settings and sees storage and jobs", async ({ page, loginAs }) => {
    await loginAs("admin");
    await page.goto("/admin/settings");
    await page.getByLabel("Största uppladdning (MB)").fill("300");
    await page.getByRole("button", { name: "Spara" }).click();
    await expect(page.getByText("Sparat")).toBeVisible();

    await page.goto("/admin/storage");
    await expect(page.getByText("12,5 MB")).toBeVisible();
    await page.goto("/admin/maintenance");
    await expect(page.getByRole("heading", { name: "Text och förhandsvisningar" })).toBeVisible();
  });

  test("an admin sees everyone's share links and the trash", async ({ page, loginAs }) => {
    await loginAs("admin");
    await page.goto("/admin/share-links");
    await expect(page.getByTestId("share-link")).toHaveCount(4);
    await expect(page.getByTestId("share-link").filter({ hasText: "Gammal länk" })).toContainText("Utgången");
    await page.goto("/manage/trash");
    await expect(page.getByText("Papperskorgen är tom.")).toBeVisible();
  });
});
