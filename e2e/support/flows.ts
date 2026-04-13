import { expect } from "@playwright/test";
import {
  FIXTURE_PROJECT_ID,
  FIXTURE_PROJECT_NAME,
} from "../fixtures/homepage.js";
import { getPage } from "./utils.js";
import type { AppWorld } from "./world.js";

type ProjectView = "info" | "community" | "biodiversity";
type BiodiversityView = "predictions" | "observations";

export const openHomepage = async (world: AppWorld) => {
  const page = getPage(world);
  const url = new URL(world.env.appUrl);
  url.searchParams.set("overlay-active-tab", "search");
  await page.goto(url.toString());
  await expect(page.getByTestId("map-root")).toBeVisible();
  await expect(page.getByTestId("search-input")).toBeVisible();
};

export const openFixtureProject = async (
  world: AppWorld,
  options: {
    overlayTab?: "project" | "layers";
    projectViews?: [ProjectView, BiodiversityView?];
  } = {},
) => {
  const page = getPage(world);
  const url = new URL(`/${FIXTURE_PROJECT_ID}`, world.env.appUrl);

  url.searchParams.set("overlay-active-tab", options.overlayTab ?? "project");

  if (options.projectViews) {
    url.searchParams.set("project-views", options.projectViews.join(","));
  }

  await page.goto(url.toString());

  if ((options.overlayTab ?? "project") === "project") {
    await expect(page.getByTestId("project-overlay")).toBeVisible();
    await expect(page.getByTestId("project-title")).toContainText(
      FIXTURE_PROJECT_NAME,
    );
  } else {
    await expect(page.getByTestId("layers-overlay")).toBeVisible();
  }
};
