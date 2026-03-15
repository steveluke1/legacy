import { expect, test } from "@playwright/test";

test("renders the migrated public home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cabal Legacy", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Conquistas Históricas/i })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: /^Mercado$/i })).toBeVisible();
});
