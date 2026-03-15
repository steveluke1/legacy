import { expect, test } from "@playwright/test";

test("public routes for rankings, guilds and character details render from local data", async ({ page }) => {
  await page.goto("/rankings");
  await expect(page.getByRole("heading", { name: /^Rankings$/i })).toBeVisible();
  await page.getByRole("link", { name: /Ver personagem/i }).first().click();
  await expect(page.getByRole("heading", { name: /Blade Vesper/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Atributos e histórico/i })).toBeVisible();

  await page.goto("/guildas");
  await expect(page.getByRole("heading", { name: /Alianças ativas do Cabal Legacy/i })).toBeVisible();
  await page.getByRole("link", { name: /Ver detalhes/i }).first().click();
  await expect(page.getByRole("heading", { name: /Apocalypse/i })).toBeVisible();
  await page.getByRole("link", { name: /Ver personagem/i }).first().click();
  await expect(page.getByRole("heading", { name: /Blade Vesper/i })).toBeVisible();
});
