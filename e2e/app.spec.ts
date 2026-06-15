import { test, expect } from "@playwright/test";

test("dashboard control surface loads", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Control" })).toBeVisible();
  await expect(page.getByText("cost · 30d", { exact: false })).toBeVisible();
});

test("broker lists the provider catalogue", async ({ page }) => {
  await page.goto("/broker");
  await expect(page.getByRole("heading", { name: "Broker" })).toBeVisible();
  await expect(page.getByText("add a provider").first()).toBeVisible();
});

test("compliance shows the AI systems registry", async ({ page }) => {
  await page.goto("/compliance");
  await expect(page.getByText("EU AI Act", { exact: false })).toBeVisible();
});
