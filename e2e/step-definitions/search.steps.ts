import { Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FIXTURE_PROJECT_ID } from "../fixtures/homepage.js";
import { getPage } from "../support/utils.js";
import type { AppWorld } from "../support/world.js";

When("the visitor searches for {string}", async function (
  this: AppWorld,
  query: string,
) {
  const page = getPage(this);
  await page.getByTestId("search-input").fill(query);
});

Then("the project result {string} is visible", async function (
  this: AppWorld,
  projectName: string,
) {
  await expect(getPage(this).getByTestId("search-results")).toContainText(projectName);
});

Then("the project result {string} is not visible", async function (
  this: AppWorld,
  projectName: string,
) {
  await expect(getPage(this).getByTestId("search-results")).not.toContainText(projectName);
});

When("the visitor opens the fixture project from search", async function (
  this: AppWorld,
) {
  const page = getPage(this);
  await page.getByTestId(`project-search-result-${FIXTURE_PROJECT_ID}`).click();
});

Then("the fixture project overlay is visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("project-overlay")).toBeVisible();
});

Then("the project title is {string}", async function (
  this: AppWorld,
  title: string,
) {
  await expect(getPage(this).getByTestId("project-title")).toContainText(title);
});
