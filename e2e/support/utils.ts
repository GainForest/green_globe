import { expect, type Page } from "@playwright/test";
import type { AppWorld } from "./world.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getPage = (world: AppWorld) => {
  if (!world.page) {
    throw new Error("Playwright page has not been initialized for this scenario.");
  }

  return world.page;
};

export const waitForAppReachable = async (appUrl: string) => {
  const healthUrl = new URL("/api/healthz", appUrl).toString();

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(healthUrl, { cache: "no-store" });
      if (response.ok) {
        return;
      }
    } catch {
      // Ignore and retry while the dev server is booting.
    }

    await sleep(1000);
  }

  throw new Error(`Application did not become reachable at ${healthUrl}`);
};

export const toScenarioFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const expectUrlToContain = async (page: Page, value: string) => {
  await expect(page).toHaveURL(new RegExp(escapeRegex(value)));
};
