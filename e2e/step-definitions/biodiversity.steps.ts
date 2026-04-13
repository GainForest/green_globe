import { Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { getPage } from "../support/utils.js";
import type { AppWorld } from "../support/world.js";

Then("the biodiversity predictions panel is visible", async function (
  this: AppWorld,
) {
  await expect(getPage(this).getByTestId("biodiversity-predictions")).toBeVisible();
});

Then("the predictions entry {string} is visible", async function (
  this: AppWorld,
  label: string,
) {
  await expect(getPage(this).getByTestId("biodiversity-predictions")).toContainText(label);
});

When("the visitor opens the {string} predictions gallery", async function (
  this: AppWorld,
  label: string,
) {
  const page = getPage(this);
  const testId = `predictions-${label.toLowerCase()}-trigger`;
  await page.getByTestId(testId).click();
});

Then("the predictions gallery shows {string}", async function (
  this: AppWorld,
  title: string,
) {
  await expect(
    getPage(this).getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
});

Then("the measured trees panel is visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("measured-trees-panel")).toBeVisible({
    timeout: 10_000,
  });
});

Then("the measured tree group {string} is visible", async function (
  this: AppWorld,
  label: string,
) {
  await expect(getPage(this).getByTestId("measured-trees-panel")).toContainText(
    label,
    { timeout: 10_000 },
  );
});

When("the visitor changes the measured tree filter to {string}", async function (
  this: AppWorld,
  filterLabel: string,
) {
  const page = getPage(this);
  await page.getByTestId("measured-trees-filter").getByRole("combobox").click();
  await page.getByRole("option", { name: filterLabel, exact: true }).click();
});
