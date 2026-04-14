import { Given, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FIXTURE_PROJECT_ID } from "../fixtures/homepage.js";
import {
  installErrorRoute_CommunityMembersFails,
  installErrorRoute_MeasuredTreesFails,
  installErrorRoute_PredictionsFails,
  installErrorRoute_ProjectInfoFails,
} from "../support/error-routes.js";
import { getPage } from "../support/utils.js";
import type { AppWorld } from "../support/world.js";

const ERROR_UI_TIMEOUT = 15_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigates to the fixture project without asserting a successful load state.
 * Used by error scenarios where the overlay will render an error instead of
 * the normal project title / panel content.
 */
const navigateToFixtureProject = async (
  world: AppWorld,
  options: {
    overlayTab?: "project" | "layers";
    projectViews?: string;
  } = {},
) => {
  const page = getPage(world);
  const url = new URL(`/${FIXTURE_PROJECT_ID}`, world.env.appUrl);
  url.searchParams.set("overlay-active-tab", options.overlayTab ?? "project");
  if (options.projectViews) {
    url.searchParams.set("project-views", options.projectViews);
  }
  await page.goto(url.toString());
  // Wait for the overlay container to mount before asserting error state.
  await expect(page.getByTestId("project-overlay")).toBeVisible();
};

// ---------------------------------------------------------------------------
// Given steps — error-injected navigation
// ---------------------------------------------------------------------------

Given(
  "the fixture project page is open with a failing project info endpoint",
  async function (this: AppWorld) {
    await installErrorRoute_ProjectInfoFails(getPage(this));
    await navigateToFixtureProject(this);
  },
);

Given(
  "the fixture project page is open on the community view with a failing members endpoint",
  async function (this: AppWorld) {
    await installErrorRoute_CommunityMembersFails(getPage(this));
    await navigateToFixtureProject(this, {
      projectViews: "community",
    });
  },
);

Given(
  "the fixture project page is open on the biodiversity predictions view with a failing predictions endpoint",
  async function (this: AppWorld) {
    await installErrorRoute_PredictionsFails(getPage(this));
    await navigateToFixtureProject(this, {
      projectViews: "biodiversity,predictions",
    });
  },
);

Given(
  "the fixture project page is open on the biodiversity observations view with a failing measured trees endpoint",
  async function (this: AppWorld) {
    await installErrorRoute_MeasuredTreesFails(getPage(this));
    await navigateToFixtureProject(this, {
      projectViews: "biodiversity,observations",
    });
  },
);

// ---------------------------------------------------------------------------
// Then steps — error state assertions
// ---------------------------------------------------------------------------

Then("the project error message is visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("error-message")).toBeVisible({
    timeout: ERROR_UI_TIMEOUT,
  });
});

Then("the community error message is visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("error-message")).toBeVisible({
    timeout: ERROR_UI_TIMEOUT,
  });
});

Then(
  "the biodiversity error message is visible",
  async function (this: AppWorld) {
    await expect(getPage(this).getByTestId("error-message")).toBeVisible({
      timeout: ERROR_UI_TIMEOUT,
    });
  },
);

Then("the search empty state is visible", async function (this: AppWorld) {
  await expect(getPage(this).getByTestId("search-empty-state")).toBeVisible();
});
