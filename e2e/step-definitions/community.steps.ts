import { Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { getPage } from "../support/utils.js";
import type { AppWorld } from "../support/world.js";

Then("the community panel shows {int} member cards", async function (
  this: AppWorld,
  count: number,
) {
  await expect(getPage(this).getByTestId("community-member-card")).toHaveCount(count);
});

Then("the community member {string} is visible", async function (
  this: AppWorld,
  memberName: string,
) {
  await expect(getPage(this).getByTestId("community-members")).toContainText(memberName);
});
