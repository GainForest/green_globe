import {
  World,
  type IWorldOptions,
  setWorldConstructor,
} from "@cucumber/cucumber";
import type { BrowserContext, Page } from "@playwright/test";
import { testEnv, type TestEnv } from "./env.js";

export class AppWorld extends World {
  env: TestEnv;
  context: BrowserContext | null;
  page: Page | null;

  constructor(options: IWorldOptions) {
    super(options);
    this.env = testEnv;
    this.context = null;
    this.page = null;
  }
}

setWorldConstructor(AppWorld);
