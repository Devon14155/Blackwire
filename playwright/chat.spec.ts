import { test, expect } from "@playwright/test";

test("loads console and toggles settings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome to NSTAR Continuum")).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("Model orchestration")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Model orchestration")).not.toBeVisible();
});
