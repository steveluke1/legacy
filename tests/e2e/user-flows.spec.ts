import { expect, test } from "@playwright/test";

test("user flow covers account, notifications, shop, marketplace and password change locally", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByPlaceholder("buyer@legacy.local").fill("seller@legacy.local");
  await page.getByPlaceholder("********").first().fill("seller123");
  await page.getByRole("button", { name: /Entrar na conta/i }).click();

  await expect(page).toHaveURL(/\/conta$/);
  await expect(page.getByRole("heading", { name: /Central do jogador: Seller Demo/i })).toBeVisible();

  await page.goto("/notificacoes");
  await expect(page.getByRole("heading", { name: /Central de mensagens do jogador/i })).toBeVisible();
  await page.getByRole("button", { name: /Marcar todas como lidas/i }).click();
  await expect(page.getByText(/Todas as notificações foram marcadas como lidas/i)).toBeVisible();

  await page.goto("/loja");
  await expect(page.getByRole("heading", { name: /Planos premium/i })).toBeVisible();
  await page.getByRole("button", { name: /Premium & VIP/i }).click();
  await page.getByRole("button", { name: /Ativar plano/i }).nth(2).click();
  await expect(page.getByText(/Plano ativado com sucesso/i)).toBeVisible();
  await expect(page.getByText(/^Ouro$/)).toBeVisible();

  await page.goto("/mercado");
  await expect(page.getByRole("heading", { name: /^Mercado$/i })).toBeVisible();
  await page.getByRole("link", { name: /Anunciar meu ALZ/i }).click();
  await expect(page).toHaveURL(/\/mercado\/vender$/);

  const createListingRequest = page.waitForResponse((response) => response.url().includes("/api/marketplace/listings") && response.request().method() === "POST");
  await page.getByLabel(/Personagem anunciante/i).selectOption({ index: 0 });
  await page.getByPlaceholder(/Ex.: lote rápido/i).fill("Oferta QA Seller");
  await page.getByPlaceholder(/Explique a oferta/i).fill("Oferta criada durante a auditoria funcional automatizada.");
  await page.getByPlaceholder(/Preço por ALZ/i).fill("0.021");
  await page.getByPlaceholder(/Quantidade de ALZ/i).fill("2000");
  const createButton = page.getByRole("button", { name: /Criar oferta/i });
  await createButton.scrollIntoViewIfNeeded();
  await createButton.click({ force: true });
  const createListingResponse = await createListingRequest;
  expect(createListingResponse.ok()).toBeTruthy();
  await expect(page.getByText(/Oferta criada com sucesso/i)).toBeVisible();

  await page.goto("/mercado/ofertas");
  await expect(page.getByRole("heading", { name: /Minhas ofertas/i })).toBeVisible();
  await expect(page.getByText(/Oferta QA Seller/i)).toBeVisible();

  await page.goto("/mercado/comprar");
  await page.getByRole("button", { name: /Comprar oferta/i }).first().click();
  await expect(page.getByText(/Compra concluída com sucesso/i)).toBeVisible();

  await page.goto("/mercado/compras");
  await expect(page.getByRole("heading", { name: /Minhas compras/i })).toBeVisible();
  await expect(page.getByText(/ALZ/i).first()).toBeVisible();

  await page.goto("/conta");
  await page.getByPlaceholder("Senha atual").fill("seller123");
  await page.getByPlaceholder("Nova senha com 8 ou mais caracteres").fill("seller45678");
  await page.getByRole("button", { name: /Alterar senha/i }).click();
  await expect(page.getByText(/Senha atualizada com sucesso/i)).toBeVisible();

  await page.getByRole("button", { name: /Sair da conta/i }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  await page.getByPlaceholder("buyer@legacy.local").fill("seller@legacy.local");
  await page.getByPlaceholder("********").first().fill("seller45678");
  await page.getByRole("button", { name: /Entrar na conta/i }).click();
  await expect(page).toHaveURL(/\/conta$/);
  await expect(page.getByRole("heading", { name: /Central do jogador: Seller Demo/i })).toBeVisible();
});
