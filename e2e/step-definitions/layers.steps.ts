import { Given, Then, When } from "@cucumber/cucumber";
import { expect, type Locator } from "@playwright/test";
import { openFixtureProject } from "../support/flows.js";
import { getPage } from "../support/utils.js";
import type { AppWorld } from "../support/world.js";

const toKebabCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureToggleIsEnabled = async (selector: Locator) => {
  if ((await selector.getAttribute("data-state")) !== "checked") {
    await selector.click();
  }
};

Given("the fixture project page is open on the layers view", async function (
  this: AppWorld,
) {
  await openFixtureProject(this, {
    overlayTab: "layers",
  });
});

Then("the layers overlay is visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("layers-overlay")).toBeVisible();
});

Then("the global layer {string} is visible", async function (
  this: AppWorld,
  layerName: string,
) {
  await expect(getPage(this).getByTestId("layers-overlay")).toContainText(layerName);
});

Then("the project-specific layer {string} is visible", async function (
  this: AppWorld,
  layerName: string,
) {
  await expect(getPage(this).getByTestId("project-specific-layers")).toContainText(
    layerName,
    { timeout: 10_000 },
  );
});

When("the visitor enables the landcover layer", async function (this: AppWorld) {
  await ensureToggleIsEnabled(getPage(this).getByTestId("layer-toggle-landcover"));
});

When("the visitor enables the historical satellite layer", async function (
  this: AppWorld,
) {
  await ensureToggleIsEnabled(
    getPage(this).getByTestId("layer-toggle-historical-satellite"),
  );
});

When("the visitor enables the project-specific layer {string}", async function (
  this: AppWorld,
  layerName: string,
) {
  await ensureToggleIsEnabled(
    getPage(this).getByTestId(`layer-toggle-${toKebabCase(layerName)}`),
  );
});

Then("the current URL contains a historical satellite month", async function (
  this: AppWorld,
) {
  await expect(getPage(this)).toHaveURL(/layers-historical-satellite-date=\d{4}-\d{2}/);
});
