import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  setDefaultTimeout,
  Status,
} from "@cucumber/cucumber";
import { chromium, type Browser } from "@playwright/test";
import { installMockRoutes } from "./network.js";
import { testEnv } from "./env.js";
import { toScenarioFileName, waitForAppReachable } from "./utils.js";
import type { AppWorld } from "./world.js";

let browser: Browser | null = null;

setDefaultTimeout(60_000);

BeforeAll(async () => {
  await mkdir(path.resolve(process.cwd(), "reports/screenshots"), {
    recursive: true,
  });

  await waitForAppReachable(testEnv.appUrl);

  browser = await chromium.launch({
    headless: testEnv.headless,
  });
});

Before(async function (this: AppWorld) {
  if (!browser) {
    throw new Error("Playwright browser was not initialized in BeforeAll.");
  }

  this.context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 960,
    },
  });
  this.page = await this.context.newPage();
  this.page.setDefaultNavigationTimeout(60_000);
  this.page.setDefaultTimeout(30_000);
  await installMockRoutes(this.page);
});

After(async function (this: AppWorld, { pickle, result }) {
  if (this.page && result?.status === Status.FAILED) {
    const screenshotPath = path.resolve(
      process.cwd(),
      "reports/screenshots",
      `${toScenarioFileName(pickle.name)}.png`,
    );
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
  }

  await this.page?.close();
  await this.context?.close();
  this.page = null;
  this.context = null;
});

AfterAll(async () => {
  await browser?.close();
  browser = null;
});
