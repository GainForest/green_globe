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
 * Makes biodiversity predictions enter the error state and render
 * `<ErrorMessage>`.
 *
 * The predictions store now fetches occurrences directly from the PDS via
 * `com.atproto.repo.listRecords` on `app.gainforest.dwc.occurrence` (the
 * previous Hyperindex `OccurrencesByDidAndKingdom` path was replaced so
 * `conservationStatus` and `plantTraits` are available). To surface the error
 * state we fail three upstream calls:
 *
 *   1. The PDS `listRecords` XRPC for `app.gainforest.dwc.occurrence` — the
 *      primary data source.
 *   2. The legacy `OccurrencesByDidAndKingdom` GraphQL query — still guarded in
 *      case anything falls back to it.
 *   3. The S3 fallbacks under `/restor/` and `/predictions/` — the store falls
 *      back to these when the PDS call returns null, so they must also fail to
 *      prevent a silent degrade into the no-data state.
 */
export const installErrorRoute_PredictionsFails = async (
  page: Page,
): Promise<void> => {
  await page.route(
    "**/xrpc/com.atproto.repo.listRecords**",
    async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("collection") === "app.gainforest.dwc.occurrence") {
        await fulfillJsonError(route, "InternalServerError", 500);
        return;
      }
      await route.fallback();
    },
  );

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

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname.includes("/restor/") ||
      url.pathname.includes("/predictions/")
    ) {
      await route.abort("failed");
      return;
    }
    await route.fallback();
  });
};

/**
 * Makes the measured-tree observations query fail so the observations panel
 * enters its explicit error state and renders `<ErrorMessage>`.
 *
 * We fail two upstream calls:
 *   1. The hyperindex GraphQL occurrence query (`OccurrencesByDid` /
 *      `OccurrencesByDidWithDynamic`).
 *   2. The PDS `listRecords` XRPC for `app.gainforest.dwc.measurement`.
 *
 * The app now tolerates hyperindex schema drift by catching the GraphQL
 * error and falling back to PDS-only data. To still exercise the error UX
 * end-to-end, we also fail the measurement listRecords call — its rejection
 * propagates out of `fetchMeasurementIndex` and surfaces the error state.
 */
export const installErrorRoute_MeasuredTreesFails = async (
  page: Page,
): Promise<void> => {
  await page.route("**/graphql", async (route) => {
    const { query = "" } = getGraphQLPayload(route);
    if (
      query.includes("OccurrencesByDidWithDynamic") ||
      query.includes("OccurrencesByDid(")
    ) {
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

  await page.route(
    "**/xrpc/com.atproto.repo.listRecords**",
    async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("collection") === "app.gainforest.dwc.measurement") {
        await fulfillJsonError(route, "InternalServerError", 500);
        return;
      }
      await route.fallback();
    },
  );
};
