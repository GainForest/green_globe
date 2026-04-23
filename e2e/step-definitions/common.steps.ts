import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { openHomepage } from "../support/flows.js";
import { getPage, expectUrlToContain } from "../support/utils.js";
import type { AppWorld } from "../support/world.js";

Given("the application is reachable", async function (this: AppWorld) {
  void this;
});

Given("the homepage is open", async function (this: AppWorld) {
  await openHomepage(this);
});

When("the visitor opens the homepage", async function (this: AppWorld) {
  await openHomepage(this);
});

Then("the map shell is visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("map-root")).toBeVisible();
});

Then("the search overlay is visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("search-overlay")).toBeVisible();
});

Then("the overlay tabs are visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("overlay-tabs")).toBeVisible();
});

Then("the current URL contains {string}", async function (
  this: AppWorld,
  value: string,
) {
  await expectUrlToContain(getPage(this), value);
});
