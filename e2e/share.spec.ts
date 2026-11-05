import { uuidOf } from "./constants";
import { expect, test } from "./fixtures";

const VALID = "exempel-giltig-delningslank-0000000000000001";
const EXPIRED = "exempel-utgangen-delningslank-00000000000001";
const REVOKED = "exempel-aterkallad-delningslank-000000000001";

test.describe("Share links, without logging in", () => {
  test("a valid link shows what it shares and nothing else of the archive", async ({ page, mock }) => {
    await page.goto(`/share/${VALID}`);

    await expect(page.getByRole("heading", { level: 1, name: "Ali Baba 2028, band" })).toBeVisible();
    await expect(page.getByText("Delat av Erik Redaktör")).toBeVisible();
    await expect(page.getByTestId("shared-version")).toHaveCount(3);
    await expect(page.locator("[data-slot=\"sidebar\"]")).toHaveCount(0);
    await expect(page.getByText("Du behöver vara inloggad")).toHaveCount(0);
    await expect(page.locator("script[src='/stats/script.js']")).toHaveCount(0);
    // Even restricted files open through the link
    const duett = page.getByTestId("shared-version").filter({ hasText: "Kärleksduetten" });
    await expect(duett.getByRole("link", { name: "Ladda ner Kärleksduetten trumpet" }))
      .toHaveAttribute("href", `/api/share/${VALID}/files/${uuidOf(632)}?download=true`);
    await expect(duett.getByText("Låst")).toHaveCount(0);

    // Parts narrowed to an instrument, as a zip through the link
    await page.getByTestId("part-filter").getByRole("button", { name: "Trumpet" }).click();
    const ouvertyr = page.getByTestId("shared-version").filter({ hasText: "Ouvertyr" });
    await expect(ouvertyr.getByRole("link", { name: "Valda stämmor (2)" }))
      .toHaveAttribute("href", `/api/share/${VALID}/versions/${uuidOf(511)}/parts/zip?instrumentIds=${uuidOf(205)}`);

    const download = await page.request.get(`/api/share/${VALID}/files/${uuidOf(632)}?download=true`);
    expect(download.status()).toBe(200);
    expect(download.headers()["content-disposition"]).toContain("attachment");
    expect((await mock.state()).zips).toContain(`/api/share/<token>/files/${uuidOf(632)}?download=true`);
  });

  test("a shared PDF opens in the reader", async ({ page }) => {
    await page.goto(`/share/${VALID}`);
    await page.getByRole("link", { name: "Läs Ali Baba manus" }).click();

    const reader = page.getByTestId("pdf-reader");
    await expect(reader.getByRole("heading", { name: "Ali Baba manus" })).toBeVisible();
    await expect(reader.getByText("av 3")).toBeVisible();
    await expect(reader.getByRole("img", { name: "Sida 1" })).toBeVisible();
    await reader.getByRole("link", { name: "Tillbaka till det delade" }).click();
    await expect(page).toHaveURL(new RegExp(`/share/${VALID}$`));
  });

  test("an expired link says so and names who made it", async ({ page }) => {
    await page.goto(`/share/${EXPIRED}`);

    await expect(page.getByRole("heading", { name: "Länken har gått ut" })).toBeVisible();
    await expect(page.getByText("Länken skapades av Erik Redaktör. Be hen om en ny.")).toBeVisible();

    const response = await page.request.get(`/api/share/${EXPIRED}/files/${uuidOf(601)}`);
    expect(response.status()).toBe(410);
    expect(await response.json()).toEqual(expect.objectContaining({ code: "SHARE_LINK_EXPIRED", createdByName: "Erik Redaktör" }));
  });

  test("a revoked link says so", async ({ page }) => {
    await page.goto(`/share/${REVOKED}`);
    await expect(page.getByRole("heading", { name: "Länken är återkallad" })).toBeVisible();
  });

  test("an unknown link is not found", async ({ page }) => {
    await page.goto("/share/ingen-sadan-lank-000000000000000000000000");
    await expect(page.getByRole("heading", { name: "Länken finns inte" })).toBeVisible();
  });

  test("a logged-in user sees the share page the same way, without the app around it", async ({ page, loginAs }) => {
    await loginAs("user");
    await page.goto(`/share/${VALID}`);

    await expect(page.getByRole("heading", { level: 1, name: "Ali Baba 2028, band" })).toBeVisible();
    await expect(page.locator("[data-slot=\"sidebar\"]")).toHaveCount(0);
  });
});
