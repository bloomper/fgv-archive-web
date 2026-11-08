import { expect, test } from "./fixtures";

test.describe("The application shell", () => {
  test("shows reading, editing and administration to an admin", async ({ page, loginAs }) => {
    await loginAs("admin");

    const sidebar = page.locator("[data-slot=\"sidebar\"]:visible");
    await expect(sidebar.getByRole("link", { name: "Hem" })).toHaveAttribute("href", "/");
    await expect(sidebar.getByRole("link", { name: "Bläddra", exact: true })).toHaveAttribute("href", "/spex");
    await expect(sidebar.getByRole("link", { name: "Redigera" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Administration" })).toBeVisible();
  });

  test("hides editing and administration from a user", async ({ page, loginAs }) => {
    await loginAs("user");

    const sidebar = page.locator("[data-slot=\"sidebar\"]:visible");
    await expect(sidebar.getByRole("link", { name: "Sök" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Redigera" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "Administration" })).toHaveCount(0);
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "Du har inte behörighet" })).toBeVisible();
  });

  test("the command palette goes to a page or searches the archive", async ({ page, loginAs }) => {
    await loginAs("editor");
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Öppna kommandopaletten" })).toBeVisible();

    await page.keyboard.press("ControlOrMeta+k");
    await page.getByPlaceholder("Hoppa till sida eller åtgärd…").fill("papper");
    await page.getByRole("option", { name: "Papperskorgen" }).click();
    await expect(page).toHaveURL(/\/manage\/trash$/);

    await page.getByRole("button", { name: "Öppna kommandopaletten" }).click();
    await page.getByPlaceholder("Hoppa till sida eller åtgärd…").fill("finalen");
    await page.getByRole("option", { name: /Sök i arkivet efter/ }).click();
    await expect(page).toHaveURL(/\/search\?q=finalen$/);
  });

  test("greets the user and lists the recently changed versions, without unpublished ones", async ({ page, loginAs }) => {
    await loginAs("user");

    await expect(page.getByRole("heading", { level: 1, name: "Hej Ulla Användare!" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ouvertyr.*Transponerad till D/ })).toBeVisible();
    await expect(page.getByText("Utkast 2028")).toHaveCount(0);
    // The years are folded into decades
    await expect(page.getByRole("link", { name: "1985", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "1980-talet" }).click();
    await expect(page.getByRole("link", { name: "1985", exact: true })).toHaveAttribute("href", "/spex?year=1985");
  });

  test("loads the visitor statistics only when Umami is configured", async ({ page, loginAs }) => {
    await loginAs("user");
    await expect(page.locator("script[src='/stats/script.js']")).toHaveCount(0);
  });

  test("never hands the tokens to the browser", async ({ page, loginAs }) => {
    await loginAs("user");

    for (const path of ["get-access-token", "refresh-token", "account-info"]) {
      const response = await page.request.post(`/api/auth/${path}`, { data: { providerId: "keycloak" } });

      expect(response.status(), path).toBe(404);
    }
    // The server still reads the token for the user's own requests
    await page.goto("/spex");
    await expect(page.getByRole("heading", { level: 1, name: "Spex", exact: true })).toBeVisible();
    const session = await page.request.get("/api/auth/get-session");

    expect(session.status()).toBe(200);
  });

  test("files are served sandboxed, so nothing in them runs", async ({ page, loginAs }) => {
    await loginAs("user");

    const response = await page.request.get("/api/files/00000000-0000-7000-8000-000000000611");

    expect(response.headers()["content-security-policy"]).toContain("sandbox; default-src 'none'");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });
});
