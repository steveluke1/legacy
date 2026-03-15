import { expect, test } from "@playwright/test";

test("shell navigation and protected redirects behave correctly", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Cabal/i }).first()).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: /Criar Conta/i })).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: /^Ranking$/i }).click();
  await expect(page).toHaveURL(/\/rankings$/);
  await expect(page.getByRole("heading", { name: /^Rankings$/i })).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: /^Enquete$/i }).click();
  await expect(page).toHaveURL(/\/enquetes$/);
  await expect(page.getByRole("heading", { name: /Enquetes da comunidade/i })).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: /^TG ao Vivo$/i }).click();
  await expect(page).toHaveURL(/\/tg-ao-vivo$/);
  await expect(page.getByRole("heading", { name: /Guerra de território em tempo real/i })).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: /^Suporte$/i }).click();
  await expect(page).toHaveURL(/\/suporte$/);
  await expect(page.getByRole("heading", { name: /Central de suporte do portal/i })).toBeVisible();

  await page.goto("/conta");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole("heading", { name: /Entre para abrir sua conta/i })).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/entrar$/);
  await expect(page.getByRole("heading", { name: /Entre para acompanhar usuários/i })).toBeVisible();

  await page.goto("/rota-inexistente");
  await expect(page.getByRole("heading", { name: /Página não encontrada/i })).toBeVisible();
  await page.getByRole("link", { name: /Voltar para a página inicial/i }).click();
  await expect(page).toHaveURL(/\/$/);
});
