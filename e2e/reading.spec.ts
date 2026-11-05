import { uuidOf } from "./constants";
import { answerDialog, expect, test } from "./fixtures";

const ALI_BABA = uuidOf(11);
const OUVERTYR = uuidOf(411);
const DUETT = uuidOf(412);
const TRUMPET = uuidOf(205);
const TROMBONE = uuidOf(206);

test.describe("Reading", () => {
  test("a user browses from a spex to an arrangement and reads its score", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.locator("[data-slot=\"sidebar\"]:visible").getByRole("link", { name: "Spex", exact: true }).click();
    await page.getByRole("link", { name: /^Ali Baba 1985/ }).click();

    await expect(page.getByRole("heading", { level: 1, name: /Ali Baba/ })).toBeVisible();
    const numbers = page.getByRole("list", { name: "Nummer" });
    await expect(numbers.getByTestId("number-row")).toHaveCount(3);
    await expect(numbers.getByTestId("number-row").nth(2)).toContainText("Arrangemang saknas");
    await numbers.getByRole("link", { name: "Ouvertyr" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Ouvertyr" })).toBeVisible();
    // The versions side by side, with their concert keys in Swedish
    const cards = page.getByTestId("version-card");
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText("F-dur → G-dur");
    await expect(cards.nth(1)).toContainText("D-dur");
    // Parts by instrument, with their transpositions: B♭ is "B" in Swedish
    const original = page.locator(`section#version-${uuidOf(511)}`);
    await expect(original.getByRole("region", { name: "Trumpet" }).getByText("i B", { exact: true })).toHaveCount(1);
    await expect(original.getByRole("region", { name: "Altsaxofon" }).getByText("i Ess", { exact: true })).toBeVisible();
    // A part for alto or tenor saxophone is listed under both
    await expect(original.getByRole("region", { name: "Tenorsaxofon" }).getByText("Alt- eller tenorsax")).toBeVisible();
    await expect(original.getByRole("link", { name: "Alla stämmor (5)" })).toHaveAttribute("href", `/api/versions/${uuidOf(511)}/parts/zip`);
    await expect(original.getByRole("link", { name: "Ladda ner versionen" })).toHaveAttribute("href", `/api/versions/${uuidOf(511)}/zip`);

    await original.getByRole("link", { name: "Läs Ouvertyr partitur" }).click();
    await expect(page).toHaveURL(new RegExp(`/files/${uuidOf(611)}`));
    const reader = page.getByTestId("pdf-reader");
    await expect(reader.getByRole("heading", { name: "Ouvertyr partitur" })).toBeVisible();
    await expect(reader.getByText("av 3")).toBeVisible();
    await expect(reader.getByRole("img", { name: "Sida 1" })).toBeVisible();
    // The text layer makes the page's text readable
    await expect(reader.locator(".textLayer").first()).toContainText("Sida 1");
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/page=2/);
    await expect(reader.getByLabel("Sida", { exact: true })).toHaveValue("2");
    await reader.getByRole("button", { name: "En sida i taget (notställ)" }).click();
    await expect(reader.getByRole("button", { name: "Rulla genom sidorna" })).toHaveAttribute("aria-pressed", "true");
    await reader.getByRole("button", { name: "Nästa sida" }).first().click();
    await expect(reader.getByLabel("Sida", { exact: true })).toHaveValue("3");
    await expect(reader.getByRole("img", { name: "Sida 3" })).toBeVisible();
    await expect(reader.getByRole("link", { name: "Ladda ner" })).toHaveAttribute("href", `/api/files/${uuidOf(611)}?download=true`);
  });

  test("the file route passes byte ranges on, for pdf.js", async ({ page, loginAs }) => {
    await loginAs("user");

    const response = await page.request.get(`/api/files/${uuidOf(611)}`, { headers: { Range: "bytes=0-7" } });

    expect(response.status()).toBe(206);
    expect(response.headers()["content-range"]).toMatch(/^bytes 0-7\/\d+$/);
    expect(response.headers()["accept-ranges"]).toBe("bytes");
    expect((await response.body()).toString("latin1")).toBe("%PDF-1.4");
  });

  test("parts are filtered by two instruments and downloaded as one zip", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.goto(`/arrangements/${OUVERTYR}`);

    const filter = page.getByTestId("part-filter");
    await filter.getByRole("button", { name: "Trumpet" }).click();
    await expect(page).toHaveURL(new RegExp(`instruments=${TRUMPET}`));
    await filter.getByRole("button", { name: "Trombon" }).click();
    await expect(page).toHaveURL(new RegExp(`instruments=${TRUMPET},${TROMBONE}`));

    const original = page.locator(`section#version-${uuidOf(511)}`);
    await expect(original.getByTestId("instrument-group")).toHaveCount(2);
    await expect(original.getByText("3 stämmor matchar")).toBeVisible();
    await expect(original.getByText("Alt- eller tenorsax")).toHaveCount(0);
    await expect(original.getByRole("link", { name: "Valda stämmor (3)" }))
      .toHaveAttribute("href", `/api/versions/${uuidOf(511)}/parts/zip?instrumentIds=${TRUMPET},${TROMBONE}`);

    // By transposition too: only the trumpet part written in B♭ ("B")
    await filter.getByRole("button", { name: "Stämd i B", exact: true }).click();
    await expect(original.getByText("1 stämma matchar")).toBeVisible();
    await filter.getByRole("button", { name: "Rensa" }).click();
    await expect(page).not.toHaveURL(/instruments=/);
  });

  test("the parts of an instrument across a spex come as one zip in show order", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.goto(`/spex/${ALI_BABA}`);
    await page.getByRole("link", { name: "Ladda ner stämmor" }).click();
    await page.getByTestId("part-filter").getByRole("button", { name: "Trumpet" }).click();

    await expect(page.getByRole("link", { name: "Ladda ner stämmor: Trumpet" }))
      .toHaveAttribute("href", `/api/spex/${ALI_BABA}/parts/zip?instrumentIds=${TRUMPET}`);
    await expect(page.getByText("2 stämmor")).toBeVisible();
  });

  test("a restricted version shows a lock and lets the user ask for access", async ({ page, loginAs, mock }) => {
    await loginAs("user");
    await page.goto(`/arrangements/${DUETT}`);

    const version = page.locator(`section#version-${uuidOf(521)}`);
    await expect(version.getByText("Begränsad", { exact: true })).toBeVisible();
    await expect(version.getByTestId("file-row").first()).toContainText("Låst");
    await expect(version.getByRole("link", { name: /Läs/ })).toHaveCount(0);
    await version.getByRole("button", { name: "Be om åtkomst" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Kärleksduetten trumpet")).toBeVisible();
    await dialog.getByLabel("Varför behöver du dem?").fill("Vi sätter upp spexet 2028.");
    await dialog.getByRole("button", { name: "Skicka" }).click();
    await expect(page.getByText("Förfrågan är skickad till redaktörerna")).toBeVisible();
    await expect(version.getByRole("button", { name: "Förfrågan skickad" })).toBeDisabled();

    const { accessRequests } = await mock.state();
    expect(accessRequests).toEqual([expect.objectContaining({ reason: "Vi sätter upp spexet 2028.", fileIds: [uuidOf(631), uuidOf(632)] })]);
  });

  test("an editor opens restricted files", async ({ page, loginAs }) => {
    await loginAs("editor");
    await page.goto(`/arrangements/${DUETT}`);

    await expect(page.getByRole("link", { name: "Läs Kärleksduetten partitur" })).toBeVisible();
    await expect(page.getByTestId("restricted-notice")).toHaveCount(0);
  });

  test("search finds text in files and opens the reader at the page", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.goto("/search?q=kungamantel");

    const hits = page.getByTestId("text-hit");
    await expect(hits.first()).toContainText("sida 2");
    await expect(hits.getByRole("link", { name: "Ali Baba manus" })).toHaveAttribute("href", `/files/${uuidOf(601)}?page=2`);
    // A restricted file of another user is not among the hits
    await expect(hits.filter({ hasText: "Kärleksduetten" })).toHaveCount(0);
  });

  test("search by a key typed in Swedish", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.goto("/search");
    await page.getByLabel("Tonart").fill("b-moll");
    await page.getByRole("button", { name: "Sök", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Versioner i b-moll" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Kärleksduetten" })).toBeVisible();
  });

  test("a manuscript lists its versions with the numbers of the spex", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.goto(`/manuscripts/${uuidOf(401)}`);

    await expect(page.getByRole("heading", { level: 1, name: "Ali Baba" })).toBeVisible();
    await expect(page.getByText("Av Anna Författare, Bo Skribent")).toBeVisible();
    await page.getByText("3 nummer").click();
    await expect(page.getByRole("link", { name: "Kärleksduetten" })).toHaveAttribute("href", `/arrangements/${DUETT}`);
  });

  test("a version's own address opens it in its arrangement", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.goto(`/versions/${uuidOf(521)}`);
    await expect(page).toHaveURL(new RegExp(`/arrangements/${DUETT}#version-${uuidOf(521)}$`));
  });

  test("an editor answers the app's own dialog, never a native one", async ({ page, loginAs }) => {
    await loginAs("editor");
    await page.goto(`/manuscripts/${uuidOf(401)}`);
    await page.getByRole("button", { name: "Lägg i papperskorgen" }).click();
    await answerDialog(page, "Avbryt");
    await expect(page.getByRole("heading", { level: 1, name: "Ali Baba" })).toBeVisible();
  });
});
