import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), "e2e/.env"),
  override: false,
});

const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }
  return value;
};

export const testEnv = {
  appUrl: required("E2E_APP_URL"),
  headless: process.env.E2E_HEADLESS === "true",
};

export type TestEnv = typeof testEnv;
