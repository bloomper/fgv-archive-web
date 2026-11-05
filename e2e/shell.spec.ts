import { expect, test } from "./fixtures";

test.describe("The application shell", () => {
  test("shows reading, editing and administration to an admin", async ({ page, loginAs }) => {
    await loginAs("admin");

    const sidebar = page.locator("[data-slot=\"sidebar\"]:visible");
    await expect(sidebar.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/");
    await expect(sidebar.getByRole("link", { name: "Spex", exact: true })).toHaveAttribute("href", "/spex");
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

  test("greets the user and lists the recently changed versions, without unpublished ones", async ({ page, loginAs }) => {
    await loginAs("user");

    await expect(page.getByRole("heading", { level: 1, name: "Hej Ulla Användare!" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ouvertyr.*Transponerad till D/ })).toBeVisible();
    await expect(page.getByText("Utkast 2028")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "1985", exact: true })).toHaveAttribute("href", "/spex?year=1985");
  });

  test("loads the visitor statistics only when Umami is configured", async ({ page, loginAs }) => {
    await loginAs("user");
    await expect(page.locator("script[src='/stats/script.js']")).toHaveCount(0);
  });
});
