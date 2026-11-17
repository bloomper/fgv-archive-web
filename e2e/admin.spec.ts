import { answerDialog, expect, test } from "./fixtures";

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

  test("an admin adds, reorders, retires and merges document kinds", async ({ page, loginAs }) => {
    await loginAs("admin");
    await page.goto("/admin/document-kinds");
    const list = page.getByRole("list", { name: "Dokumenttyper" });
    await expect(list.getByRole("listitem").first()).toContainText("Manus");
    await expect(list.getByRole("listitem").first()).toContainText("1 dokument");

    await page.getByRole("button", { name: "Lägg till dokumenttyp" }).click();
    const form = page.getByRole("form", { name: "Dokumenttyp" });
    await form.getByLabel("Svenskt namn").fill("Affisch");
    await form.getByLabel("Engelskt namn").fill("Poster");
    await form.getByLabel("Alias").fill("affischer\nposters");
    await form.getByRole("button", { name: "Spara" }).click();
    await expect(list.getByRole("listitem").last()).toContainText("Poster · affischer, posters · inga dokument");

    await page.getByRole("button", { name: "Flytta upp Affisch" }).click();
    await expect(list.getByRole("listitem").nth(4)).toContainText("Affisch");

    await page.getByRole("button", { name: "Ta Synopsis ur bruk" }).click();
    await expect(list.getByRole("listitem").filter({ hasText: "Synopsis" })).toContainText("Ur bruk");
    await page.getByRole("button", { name: "Ta Synopsis i bruk igen" }).click();
    await expect(list.getByRole("listitem").filter({ hasText: "Synopsis" })).not.toContainText("Ur bruk");

    await page.getByRole("button", { name: "Slå ihop Spexbok med en annan typ" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Övrigt" }).click();
    await answerDialog(page, "Slå ihop");
    await expect(list.getByRole("listitem").filter({ hasText: "Spexbok" })).toHaveCount(1);
    await expect(list.getByRole("listitem").filter({ hasText: "Övrigt" })).toContainText("Spexbok, Spex book, sångbok · 1 dokument");
    // The menu follows
    await expect(page.locator("[data-slot=\"sidebar\"]:visible").getByRole("link", { name: "Spexbok", exact: true })).toHaveCount(0);
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
