import {expect, test} from "./fixtures";

test("a visitor who is not logged in gets the login screen and no app", async ({page}) => {
    await page.goto("/");

    await expect(page.getByText("Du behöver vara inloggad med ditt FGV-konto för att läsa manus och noter.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Logga in" })).toHaveAttribute("href", "/api/auth/login");
    await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);
});

test("a user without USER sees the no-access page and no music", async ({page, loginAs}) => {
    await loginAs("noaccess");
    await page.goto("/");

    await expect(page).toHaveURL(/\/no-access$/);
    await expect(page.getByRole("heading", {name: "Du har inte åtkomst"})).toBeVisible();
    await expect(page.getByText("Ali Baba 2028")).toHaveCount(0);

    await page.goto("/manage/missing");
    await expect(page).toHaveURL(/\/no-access$/);
    await expect(page.getByText("nils@example.org", {exact: false})).toBeVisible();
    await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);

    await page.getByRole("button", {name: "Logga ut"}).click();
    await expect(page.getByText("Du behöver vara inloggad med ditt FGV-konto för att läsa manus och noter.")).toBeVisible();
});

test("a visitor who is not logged in is sent from the no-access page to the login screen", async ({page}) => {
    await page.goto("/no-access");

    await expect(page).not.toHaveURL(/\/no-access$/);
    await expect(page.getByText("Du behöver vara inloggad med ditt FGV-konto för att läsa manus och noter.")).toBeVisible();
});

test("a user with access is sent from the no-access page to the app", async ({page, loginAs}) => {
    await loginAs("user");
    await page.goto("/no-access");

    await expect(page).not.toHaveURL(/\/no-access$/);
    await expect(page.getByRole("heading", {name: "Du har inte åtkomst"})).toHaveCount(0);
});

test("a visitor is told which cookies are used, once", async ({page}) => {
    await page.goto("/");

    await expect(page.getByText("Cookies på den här webbplatsen")).toBeVisible();
    await page.getByRole("button", {name: "Jag förstår"}).click();
    await expect(page.getByText("Cookies på den här webbplatsen")).toHaveCount(0);
    await expect.poll(async () => (await page.context().cookies()).some(cookie => cookie.name === "c15t-notice")).toBe(true);

    await page.reload();
    await expect(page.getByText("Du behöver vara inloggad med ditt FGV-konto för att läsa manus och noter.")).toBeVisible();
    await expect(page.getByText("Cookies på den här webbplatsen")).toHaveCount(0);
});

test("a version linked from an email logs in and comes back to it", async ({page}) => {
    await page.goto("/versions/00000000-0000-7000-8000-000000000521");

    await expect(page.getByRole("link", { name: "Logga in" }))
        .toHaveAttribute("href", "/api/auth/login?returnTo=%2Fversions%2F00000000-0000-7000-8000-000000000521");
});
