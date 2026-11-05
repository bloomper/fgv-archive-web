import { uuidOf } from "./constants";
import { answerDialog, expect, hydrated, test } from "./fixtures";

const VERSION = uuidOf(511);
const TRUMPET = uuidOf(205);
const FLUTE = uuidOf(201);

test.describe("Editing", () => {
  test("an editor uploads a file and corrects its instruments and transposition", async ({ page, loginAs, mock }) => {
    await loginAs("editor");
    await page.goto(`/versions/${VERSION}/edit`);
    await hydrated(page, "[data-testid=file-input]");
    await page.getByTestId("file-input").setInputFiles({ name: "Trumpet 2.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });

    const upload = page.getByTestId("pending-upload");
    await expect(upload.getByText("Uppladdad")).toBeVisible();
    // Guessed from the name: a part for trumpet, desk 2, in B♭ (Swedish B)
    await expect(upload.getByLabel("Roll")).toHaveValue(uuidOf(303));
    await expect(upload.getByRole("list", { name: "Valda instrument" })).toContainText("Trumpet");
    await expect(upload.getByLabel("Stämma/pult")).toHaveValue("2");
    await expect(upload.getByLabel("Stämning", { exact: true })).toHaveValue("B_FLAT");

    await upload.getByLabel("Lägg till fler instrument").selectOption({ label: "Flöjt" });
    await upload.getByLabel("Stämning", { exact: true }).selectOption("C");
    await upload.getByRole("button", { name: "Lägg till filen" }).click();
    await expect(page.getByText("Trumpet 2 är tillagd")).toBeVisible();
    await expect(page.getByTestId("managed-file").filter({ hasText: "Trumpet 2" })).toBeVisible();

    const { fileAdds } = await mock.state();
    expect(fileAdds).toEqual([expect.objectContaining({
      versionId: VERSION, title: "Trumpet 2", instrumentIds: [TRUMPET, FLUTE], desk: "2", transposition: { pitch: "C", octave: 0 },
    })]);
  });

  test("a new part's transposition follows its first instrument until the editor picks one", async ({ page, loginAs }) => {
    await loginAs("editor");
    await page.goto(`/versions/${VERSION}/edit`);
    await hydrated(page, "[data-testid=file-input]");
    await page.getByTestId("file-input").setInputFiles({ name: "Okänd.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });

    const upload = page.getByTestId("pending-upload");
    await expect(upload.getByText("Uppladdad")).toBeVisible();
    await upload.getByLabel("Lägg till instrument", { exact: true }).selectOption({ label: "Valthorn" });
    await expect(upload.getByLabel("Stämning", { exact: true })).toHaveValue("F");
  });

  test("an editor changes a part's instruments and transposition", async ({ page, loginAs, mock }) => {
    await loginAs("editor");
    await page.goto(`/versions/${VERSION}/edit`);
    await page.getByRole("button", { name: "Redigera Trombon" }).click();

    const form = page.getByRole("form", { name: "Redigera Trombon" });
    await form.getByLabel("Lägg till fler instrument").selectOption({ label: "Valthorn" });
    await form.getByLabel("Stämning", { exact: true }).selectOption("B_FLAT");
    await form.getByLabel("Oktav").selectOption("-1");
    await form.getByRole("button", { name: "Spara" }).click();
    await expect(page.getByText("Sparat")).toBeVisible();

    const { fileUpdates } = await mock.state();
    expect(fileUpdates).toEqual([{
      id: uuidOf(614),
      input: expect.objectContaining({ instrumentIds: [uuidOf(206), uuidOf(207)], transposition: { pitch: "B_FLAT", octave: -1 } }),
    }]);
  });

  test("an editor sets a version's key with modulations", async ({ page, loginAs }) => {
    await loginAs("editor");
    await page.goto(`/versions/${uuidOf(512)}/edit`);

    await page.getByLabel("Grundton").first().selectOption("E_FLAT");
    await page.getByRole("button", { name: "Lägg till modulation" }).click();
    await page.getByRole("group", { name: "Modulation 1" }).getByLabel("Grundton").selectOption("F");
    await page.getByRole("button", { name: "Spara", exact: true }).click();
    await expect(page.getByText("Sparat")).toBeVisible();

    await page.goto(`/arrangements/${uuidOf(411)}`);
    await expect(page.getByTestId("version-card").filter({ hasText: "Transponerad till D" })).toContainText("Ess-dur → F-dur");
  });

  test("an editor shares a version and sees the address once", async ({ page, loginAs, mock }) => {
    await loginAs("editor");
    await page.goto(`/versions/${VERSION}/edit`);
    await page.getByRole("button", { name: "Dela versionen" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Vem är den till?").fill("Ali Baba 2028, bleck");
    await dialog.getByRole("button", { name: "Skapa länken" }).click();
    await expect(dialog.getByText("Kopiera adressen nu: den visas bara den här gången.")).toBeVisible();
    await expect(dialog.getByLabel("Delningslänkens adress")).toHaveValue(/\/share\/e2e-[0-9a-f]{32}$/);
    await dialog.getByRole("button", { name: "Klar" }).click();

    const { shareLinks } = await mock.state();
    expect(shareLinks[0]).toEqual(expect.objectContaining({ name: "Ali Baba 2028, bleck", versionIds: [VERSION] }));

    await page.goto("/manage/share-links");
    await expect(page.getByTestId("share-link").filter({ hasText: "Ali Baba 2028, bleck" })).toContainText("Giltig");
  });

  test("an editor shares a spex' recommended versions", async ({ page, loginAs, mock }) => {
    await loginAs("editor");
    await page.goto(`/spex/${uuidOf(11)}`);
    await page.getByRole("button", { name: "Dela spexets material (3 versioner)" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Skapa länken" }).click();
    await expect(page.getByRole("dialog").getByLabel("Delningslänkens adress")).toHaveValue(/\/share\//);

    const { shareLinks } = await mock.state();
    expect(shareLinks[0].versionIds).toEqual([uuidOf(501), uuidOf(511), uuidOf(521)]);
  });

  test("an editor revokes a share link in the app's own dialog", async ({ page, loginAs }) => {
    await loginAs("editor");
    await page.goto("/manage/share-links");
    await page.getByRole("button", { name: "Återkalla Ali Baba 2028, band" }).click();
    await answerDialog(page, "Återkalla");
    await expect(page.getByTestId("share-link").filter({ hasText: "Ali Baba 2028, band" })).toContainText("Återkallad");
  });

  test("an editor pastes numbers and deletes one", async ({ page, loginAs, mock }) => {
    await loginAs("editor");
    await page.goto(`/spex/${uuidOf(11)}/numbers`);
    await page.getByLabel("Klistra in nummer").fill("4. Rövarvisan (Dancing Queen)\nEpilog");
    await page.getByRole("button", { name: "Lägg till", exact: true }).click();
    await expect(page.getByTestId("number-row")).toHaveCount(5);

    await page.getByRole("button", { name: "Radera Epilog" }).click();
    await answerDialog(page, "Radera");
    await expect(page.getByTestId("number-row")).toHaveCount(4);
    expect((await mock.state()).numbers.map(number => number.title)).toContain("Rövarvisan");
    // A number with an arrangement can only be merged
    await expect(page.getByRole("button", { name: "Radera Ouvertyr" })).toBeDisabled();
  });

  test("an editor creates a manuscript and lands on its first version", async ({ page, loginAs }) => {
    await loginAs("editor");
    await page.goto(`/manage/manuscripts/new?spex=${uuidOf(13)}`);
    await page.getByLabel("Författare").fill("Nina Nobel");
    await page.getByRole("button", { name: "Skapa manus" }).click();

    await expect(page.getByRole("heading", { level: 1, name: /Redigera Original/ })).toBeVisible();
    await expect(page.getByText("Opublicerad").first()).toBeVisible();
  });
});
