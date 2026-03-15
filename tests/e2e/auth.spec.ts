import { expect, test } from "@playwright/test";

test("user auth works locally", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByPlaceholder("buyer@legacy.local").fill("buyer@legacy.local");
  await page.getByPlaceholder("********").first().fill("buyer123");
  await page.getByRole("button", { name: /Entrar na conta/i }).click();
  await expect(page).toHaveURL(/\/conta$/);
  await expect(page.getByRole("heading", { name: /Central do jogador: Buyer Demo/i })).toBeVisible();
  await page.getByRole("button", { name: /Sair da conta/i }).click();
  await expect(page).toHaveURL(/\/entrar$/);
});

test("admin auth works locally", async ({ page }) => {
  await page.goto("/admin/entrar");
  await page.getByPlaceholder("admin@legacy.local").fill("admin@legacy.local");
  await page.getByPlaceholder("********").fill("admin123");
  await page.getByRole("button", { name: /Entrar como administrador/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /Operação administrativa de Admin Demo/i })).toBeVisible();
  await page.getByRole("button", { name: /Encerrar sessão/i }).click();
  await expect(page).toHaveURL(/\/admin\/entrar$/);
});

test("registration creates a new account and opens the player area", async ({ page }) => {
  const stamp = Date.now();
  const email = `novo.${stamp}@legacy.local`;
  const username = `novo_${stamp}`;

  await page.goto("/entrar");
  await page.getByRole("button", { name: /Quero me cadastrar/i }).click();
  await page.getByPlaceholder("buyer@legacy.local").fill(email);
  await page.getByPlaceholder("buyer_demo").fill(username);
  await page.getByPlaceholder("Nome exibido no portal").fill("Novo Jogador QA");
  await page.getByPlaceholder("********").fill("novaSenha123");
  await page.getByRole("button", { name: /Criar conta e entrar/i }).click();

  await expect(page).toHaveURL(/\/conta$/);
  await expect(page.getByRole("heading", { name: /Central do jogador: Novo Jogador QA/i })).toBeVisible();
});

test("password reset recovers local access through the public auth form", async ({ page }) => {
  const stamp = Date.now();
  const email = `reset.${stamp}@legacy.local`;
  const username = `reset_${stamp}`;
  const newPassword = "resetNova123";

  await page.goto("/entrar");
  await page.getByRole("button", { name: /Quero me cadastrar/i }).click();
  await page.getByPlaceholder("buyer@legacy.local").fill(email);
  await page.getByPlaceholder("buyer_demo").fill(username);
  await page.getByPlaceholder("Nome exibido no portal").fill("Reset QA");
  await page.getByPlaceholder("********").fill("senhaInicial123");
  await page.getByRole("button", { name: /Criar conta e entrar/i }).click();
  await expect(page).toHaveURL(/\/conta$/);
  await page.getByRole("button", { name: /Sair da conta/i }).click();

  await page.getByRole("button", { name: /Esqueci minha senha/i }).click();
  await page.getByPlaceholder("buyer@legacy.local").fill(email);
  await page.getByRole("button", { name: /Gerar token local/i }).click();
  await expect(page.getByText(/Token local gerado/i)).toBeVisible();

  const tokenField = page.getByPlaceholder("Token local de recuperação");
  const token = await tokenField.inputValue();
  expect(token.length).toBeGreaterThan(20);

  await page.getByPlaceholder("Nova senha com 8 ou mais caracteres").fill(newPassword);
  await page.getByRole("button", { name: /Salvar nova senha/i }).click();
  await expect(page.getByText(/Senha redefinida com sucesso/i)).toBeVisible();

  await page.getByPlaceholder("buyer@legacy.local").fill(email);
  await page.getByPlaceholder("********").first().fill(newPassword);
  await page.getByRole("button", { name: /Entrar na conta/i }).click();
  await expect(page).toHaveURL(/\/conta$/);
  await expect(page.getByRole("heading", { name: /Central do jogador: Reset QA/i })).toBeVisible();
});