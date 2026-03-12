import { expect, test } from "@playwright/test";

test("home route responds and mounts the app shell", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/");

  await expect(page.locator("#root")).toBeVisible();

  expect(
    consoleErrors,
    `Unexpected runtime errors while loading "/":\n${consoleErrors.join("\n")}`
  ).toEqual([]);
});
