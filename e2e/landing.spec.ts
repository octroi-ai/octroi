import { test, expect } from "@playwright/test";

test("landing renders in English by default", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("All your AI");
  await expect(page.locator("h1")).toContainText("One gate");
});

test("switches the whole UI to Chinese via the language switcher", async ({ context, page }) => {
  await context.addCookies([{ name: "locale", value: "zh", url: "http://localhost:3001" }]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.locator("h1")).toContainText("一道门");
});

test("switches to Spanish", async ({ context, page }) => {
  await context.addCookies([{ name: "locale", value: "es", url: "http://localhost:3001" }]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator("h1")).toContainText("Toda tu IA");
});
