import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { openFixtureProject } from "../support/flows.js";
import { getPage } from "../support/utils.js";
import type { AppWorld } from "../support/world.js";

Given("the fixture project page is open on the project info view", async function (
  this: AppWorld,
) {
  await openFixtureProject(this, {
    overlayTab: "project",
    projectViews: ["info"],
  });
});

Given("the fixture project page is open on the community view", async function (
  this: AppWorld,
) {
  await openFixtureProject(this, {
    overlayTab: "project",
    projectViews: ["community"],
  });
});

Given(
  "the fixture project page is open on the biodiversity predictions view",
  async function (this: AppWorld) {
    await openFixtureProject(this, {
      overlayTab: "project",
      projectViews: ["biodiversity", "predictions"],
    });
  },
);

Given(
  "the fixture project page is open on the biodiversity observations view",
  async function (this: AppWorld) {
    await openFixtureProject(this, {
      overlayTab: "project",
      projectViews: ["biodiversity", "observations"],
    });
  },
);

Then("the project description contains {string}", async function (
  this: AppWorld,
  value: string,
) {
  await expect(getPage(this).getByTestId("project-description")).toContainText(value);
});

Then("the project site selector shows {string}", async function (
  this: AppWorld,
  siteName: string,
) {
  const page = getPage(this);
  await expect(
    page.getByTestId("project-site-combobox").getByRole("combobox"),
  ).toContainText(siteName);
});

When("the visitor switches the project site to {string}", async function (
  this: AppWorld,
  siteName: string,
) {
  const page = getPage(this);
  await page.getByTestId("project-site-combobox").getByRole("combobox").click();
  await page.getByRole("option", { name: siteName, exact: true }).click();
});
