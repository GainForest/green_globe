import { Buffer } from "node:buffer";
import type { Page, Route } from "@playwright/test";
import {
  DEFAULT_SITE_BY_DID_RESPONSE,
  FIXTURE_LAYER_BOUNDS,
  FIXTURE_PROJECT_HANDLE,
  GEOJSON_FIXTURES,
  GLOBAL_LAYERS_RESPONSE,
  LOCATIONS_BY_DID_RESPONSE,
  MEASUREMENT_RECORDS_RESPONSE,
  MULTIMEDIA_BY_DID_RESPONSE,
  OBSERVATION_OCCURRENCES_RESPONSE,
  OCCURRENCE_RECORDS_RESPONSE,
  ORGANIZATION_INFO_RESPONSE,
  ORGANIZATION_MEMBER_RECORDS_RESPONSE,
  ORGANIZATIONS_RESPONSE,
  PREDICTION_OCCURRENCES_RESPONSE,
  PROJECT_LAYER_RECORDS_RESPONSE,
  SITE_BLOBS,
} from "../fixtures/homepage.js";

type GraphQLPayload = {
  query?: string;
  variables?: Record<string, unknown>;
};

const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YL8o8cAAAAASUVORK5CYII=",
  "base64",
);

const FLAG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16">
  <rect width="24" height="16" fill="#111827" />
  <rect width="24" height="5.33" y="5.33" fill="#16a34a" />
  <rect width="24" height="5.33" y="10.66" fill="#f59e0b" />
</svg>`;

const fulfillJson = async (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

const fulfillPng = async (route: Route) =>
  route.fulfill({
    status: 200,
    contentType: "image/png",
    body: TRANSPARENT_PNG,
  });

const fulfillSvg = async (route: Route) =>
  route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    body: FLAG_SVG,
  });

const getGraphQLPayload = (route: Route): GraphQLPayload => {
  try {
    return (route.request().postDataJSON() as GraphQLPayload | null) ?? {};
  } catch {
    return {};
  }
};

const handleGraphql = async (route: Route) => {
  const { query = "", variables = {} } = getGraphQLPayload(route);

  if (query.includes("query LocationsByDid")) {
    return fulfillJson(route, LOCATIONS_BY_DID_RESPONSE);
  }

  if (query.includes("query DefaultSiteByDid")) {
    return fulfillJson(route, DEFAULT_SITE_BY_DID_RESPONSE);
  }

  if (query.includes("query OrganizationMemberRecords")) {
    return fulfillJson(route, ORGANIZATION_MEMBER_RECORDS_RESPONSE);
  }

  if (query.includes("query MultimediaByDid")) {
    return fulfillJson(route, MULTIMEDIA_BY_DID_RESPONSE);
  }

  if (query.includes("query OccurrencesByDidAndKingdom")) {
    const kingdom = variables.kingdom;
    if (kingdom === "Plantae") {
      return fulfillJson(route, PREDICTION_OCCURRENCES_RESPONSE.Plantae);
    }

    if (kingdom === "Animalia") {
      return fulfillJson(route, PREDICTION_OCCURRENCES_RESPONSE.Animalia);
    }
  }

  if (
    query.includes("query OccurrencesByDidWithDynamic") ||
    query.includes("query OccurrencesByDid(")
  ) {
    return fulfillJson(route, OBSERVATION_OCCURRENCES_RESPONSE);
  }

  return fulfillJson(
    route,
    { errors: [{ message: `Unhandled GraphQL fixture for query: ${query}` }] },
    500,
  );
};

const handleXrpc = async (route: Route) => {
  const url = new URL(route.request().url());

  if (url.pathname.endsWith("/xrpc/com.atproto.repo.describeRepo")) {
    return fulfillJson(route, {
      did: url.searchParams.get("repo"),
      handle: FIXTURE_PROJECT_HANDLE,
      didDoc: {
        "@context": ["https://www.w3.org/ns/did/v1"],
        id: url.searchParams.get("repo"),
        service: [],
      },
      collections: [
        "app.gainforest.organization.info",
        "app.gainforest.organization.layer",
      ],
      handleIsCorrect: true,
    });
  }

  if (url.pathname.endsWith("/xrpc/com.atproto.repo.getRecord")) {
    return fulfillJson(route, ORGANIZATION_INFO_RESPONSE);
  }

  if (url.pathname.endsWith("/xrpc/com.atproto.repo.listRecords")) {
    const collection = url.searchParams.get("collection");

    if (collection === "app.gainforest.organization.layer") {
      return fulfillJson(route, PROJECT_LAYER_RECORDS_RESPONSE);
    }

    if (collection === "app.gainforest.dwc.measurement") {
      return fulfillJson(route, MEASUREMENT_RECORDS_RESPONSE);
    }

    if (collection === "app.gainforest.dwc.occurrence") {
      return fulfillJson(route, OCCURRENCE_RECORDS_RESPONSE);
    }
  }

  if (url.pathname.endsWith("/xrpc/com.atproto.sync.getBlob")) {
    const cid = url.searchParams.get("cid") ?? "";
    if (cid in SITE_BLOBS) {
      return fulfillJson(route, SITE_BLOBS[cid]);
    }
  }

  return fulfillJson(
    route,
    { error: `Unhandled XRPC fixture for ${url.pathname}` },
    404,
  );
};

export const installMockRoutes = async (page: Page) => {
  await page.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    const url = new URL(requestUrl);

    if (
      url.pathname === "/api/list-organizations" &&
      url.searchParams.get("info") === "true" &&
      url.searchParams.get("mapPoint") === "true"
    ) {
      return fulfillJson(route, ORGANIZATIONS_RESPONSE);
    }

    if (url.hostname === "api.hi.gainforest.app" && url.pathname === "/graphql") {
      return handleGraphql(route);
    }

    if (url.hostname === "climateai.org" && url.pathname.startsWith("/xrpc/")) {
      return handleXrpc(route);
    }

    if (requestUrl.includes("/layers/global/layerData.json")) {
      return fulfillJson(route, GLOBAL_LAYERS_RESPONSE);
    }

    const geojsonEntry = Object.entries(GEOJSON_FIXTURES).find(([path]) =>
      requestUrl.includes(path),
    );
    if (geojsonEntry) {
      return fulfillJson(route, geojsonEntry[1]);
    }

    if (requestUrl.includes("/cog/bounds?")) {
      return fulfillJson(route, { bounds: FIXTURE_LAYER_BOUNDS });
    }

    if (
      url.hostname === "services.terrascope.be" ||
      url.hostname === "server.arcgisonline.com"
    ) {
      return fulfillPng(route);
    }

    if (url.hostname === "cdn.jsdelivr.net") {
      if (url.pathname.includes("country-flag-emoji-json")) {
        return fulfillSvg(route);
      }

      if (url.pathname.includes("three-globe/example/img")) {
        return fulfillPng(route);
      }
    }

    return route.continue();
  });
};
