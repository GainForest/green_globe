/**
 * Error route overrides for e2e error-state scenarios.
 *
 * Each function registers a Playwright route override on top of the happy-path
 * mocks already installed by `installMockRoutes`. Playwright resolves routes in
 * LIFO order, so these overrides win for the duration of the scenario. A fresh
 * page is created per scenario, so the override naturally disappears during the
 * `After` hook when the page/context are closed.
 */

import type { Page, Route } from "@playwright/test";

type GraphQLPayload = {
  query?: string;
};

const getGraphQLPayload = (route: Route): GraphQLPayload => {
  try {
    return (route.request().postDataJSON() as GraphQLPayload | null) ?? {};
  } catch {
    return {};
  }
};

const fulfillJsonError = async (route: Route, message: string, status = 500) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ error: message, message }),
  });

/**
 * Makes `com.atproto.repo.getRecord` return a 500 error so that
 * `ProjectOverlay` enters the error state and renders `<ErrorMessage>`.
 *
 * Scoped to the current scenario's page.
 */
export const installErrorRoute_ProjectInfoFails = async (
  page: Page,
): Promise<void> => {
  await page.route(
    "**/xrpc/com.atproto.repo.getRecord**",
    async (route) => {
      await fulfillJsonError(
        route,
        "InternalServerError",
        500,
      );
    },
  );
};

/**
 * Makes the `OrganizationMemberRecords` GraphQL query return a 500 error so
 * that `Community/Members` enters the error state and renders `<ErrorMessage>`.
 *
 * Other GraphQL operations in the same scenario fall through to the happy-path
 * `handleGraphql` handler in `network.ts`.
 */
export const installErrorRoute_CommunityMembersFails = async (
  page: Page,
): Promise<void> => {
  await page.route(
    "**/graphql",
    async (route) => {
      const { query = "" } = getGraphQLPayload(route);
      if (query.includes("OrganizationMemberRecords")) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            errors: [{ message: "Internal server error" }],
            data: null,
          }),
        });
        return;
      }
      // Not the query we want to intercept — fall through to the next handler.
      await route.fallback();
    },
  );
};

/**
 * Makes the `OccurrencesByDidAndKingdom` GraphQL query return a 500 error so
 * that `Biodiversity/Predictions` enters the error state and renders
 * `<ErrorMessage>`.
 *
 * The predictions panel fires two separate queries (Plantae + Animalia), so
 * this handler stays active for the whole scenario and intercepts either/both.
 */
export const installErrorRoute_PredictionsFails = async (
  page: Page,
): Promise<void> => {
  await page.route("**/graphql", async (route) => {
    const { query = "" } = getGraphQLPayload(route);
    if (query.includes("OccurrencesByDidAndKingdom")) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          errors: [{ message: "Internal server error" }],
          data: null,
        }),
      });
      return;
    }
    await route.fallback();
  });
};

/**
 * Makes the measured-tree observations query fail so the observations panel
 * enters its explicit error state and renders `<ErrorMessage>`.
 */
export const installErrorRoute_MeasuredTreesFails = async (
  page: Page,
): Promise<void> => {
  await page.route("**/graphql", async (route) => {
    const { query = "" } = getGraphQLPayload(route);
    if (query.includes("OccurrencesByDidWithDynamic")) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          errors: [{ message: "Internal server error" }],
          data: null,
        }),
      });
      return;
    }
    await route.fallback();
  });
};
