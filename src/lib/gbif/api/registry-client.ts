// GBIF Registry API client — native fetch only, HTTP Basic Auth
// All functions delegate to gbifFetch; no retry logic.

import { gbifConfig } from '@/config/gbif'
import type {
  GbifContact,
  GbifCrawlStatus,
  GbifDataset,
  GbifEndpoint,
  GbifInstallation,
  GbifPaginated,
} from './types'

// ---------------------------------------------------------------------------
// Custom error type
// ---------------------------------------------------------------------------

export class GbifApiError extends Error {
  status: number
  statusText: string
  responseBody: string

  constructor(status: number, statusText: string, responseBody: string) {
    super(`GBIF API error ${status} ${statusText}: ${responseBody}`)
    this.name = 'GbifApiError'
    this.status = status
    this.statusText = statusText
    this.responseBody = responseBody
  }
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

export function buildAuthHeader(username: string, password: string): string {
  const encoded = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${encoded}`
}

// ---------------------------------------------------------------------------
// Base request helper
// ---------------------------------------------------------------------------

/**
 * Low-level fetch wrapper. Prepends gbifConfig.apiUrl, sets Content-Type and
 * Authorization headers, and throws GbifApiError on non-2xx responses.
 * Returns the raw Response so callers can parse the body as needed.
 */
async function gbifFetch(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<Response> {
  const { method = 'GET', body } = options ?? {}

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: buildAuthHeader(
      gbifConfig.username ?? '',
      gbifConfig.password ?? '',
    ),
  }

  const response = await fetch(`${gbifConfig.apiUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const responseBody = await response.text()
    throw new GbifApiError(response.status, response.statusText, responseBody)
  }

  return response
}

// ---------------------------------------------------------------------------
// Installation
// ---------------------------------------------------------------------------

/**
 * POST /installation — creates a new installation and returns its UUID.
 */
export async function createInstallation(
  installation: Omit<GbifInstallation, 'key'>,
): Promise<string> {
  const response = await gbifFetch('/installation', {
    method: 'POST',
    body: installation,
  })
  return response.json() as Promise<string>
}

/**
 * GET /installation/{key} — retrieves an installation by UUID.
 */
export async function getInstallation(key: string): Promise<GbifInstallation> {
  const response = await gbifFetch(`/installation/${key}`)
  return response.json() as Promise<GbifInstallation>
}

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

/**
 * POST /dataset — creates a new dataset and returns its UUID string.
 * NOTE: GBIF returns a plain UUID string (not a JSON object).
 */
export async function createDataset(
  dataset: Omit<GbifDataset, 'key'>,
): Promise<string> {
  const response = await gbifFetch('/dataset', {
    method: 'POST',
    body: dataset,
  })
  // GBIF returns a plain UUID string, not a JSON object
  return response.text()
}

/**
 * GET /dataset/{key} — retrieves a dataset by UUID.
 */
export async function getDataset(key: string): Promise<GbifDataset> {
  const response = await gbifFetch(`/dataset/${key}`)
  return response.json() as Promise<GbifDataset>
}

/**
 * PUT /dataset/{key} — updates a dataset. Returns 204 with no body.
 */
export async function updateDataset(
  key: string,
  dataset: Partial<GbifDataset>,
): Promise<void> {
  await gbifFetch(`/dataset/${key}`, { method: 'PUT', body: dataset })
}

/**
 * GET /organization/{orgKey}/publishedDataset — lists datasets published by an org.
 */
export async function listOrgDatasets(
  orgKey: string,
  limit?: number,
  offset?: number,
): Promise<GbifPaginated<GbifDataset>> {
  const params = new URLSearchParams()
  if (limit !== undefined) params.set('limit', String(limit))
  if (offset !== undefined) params.set('offset', String(offset))
  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await gbifFetch(
    `/organization/${orgKey}/publishedDataset${query}`,
  )
  return response.json() as Promise<GbifPaginated<GbifDataset>>
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

/**
 * POST /dataset/{key}/contact — adds a contact to a dataset.
 * Returns the integer contact key.
 */
export async function addContact(
  datasetKey: string,
  contact: Omit<GbifContact, 'key'>,
): Promise<number> {
  const response = await gbifFetch(`/dataset/${datasetKey}/contact`, {
    method: 'POST',
    body: contact,
  })
  return response.json() as Promise<number>
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * POST /dataset/{key}/endpoint — adds an endpoint to a dataset.
 * Returns the integer endpoint key (not a UUID).
 */
export async function addEndpoint(
  datasetKey: string,
  endpoint: Omit<GbifEndpoint, 'key'>,
): Promise<number> {
  const response = await gbifFetch(`/dataset/${datasetKey}/endpoint`, {
    method: 'POST',
    body: endpoint,
  })
  return response.json() as Promise<number>
}

/**
 * GET /dataset/{key}/endpoint — lists all endpoints for a dataset.
 */
export async function listEndpoints(
  datasetKey: string,
): Promise<GbifEndpoint[]> {
  const response = await gbifFetch(`/dataset/${datasetKey}/endpoint`)
  return response.json() as Promise<GbifEndpoint[]>
}

/**
 * DELETE /dataset/{key}/endpoint/{endpointKey} — deletes an endpoint.
 * Returns 204 with no body.
 */
export async function deleteEndpoint(
  datasetKey: string,
  endpointKey: number,
): Promise<void> {
  await gbifFetch(`/dataset/${datasetKey}/endpoint/${endpointKey}`, {
    method: 'DELETE',
  })
}

// ---------------------------------------------------------------------------
// Crawling
// ---------------------------------------------------------------------------

/**
 * POST /dataset/{key}/crawl — triggers a crawl for a dataset.
 * Returns 204 with no body.
 */
export async function triggerCrawl(datasetKey: string): Promise<void> {
  await gbifFetch(`/dataset/${datasetKey}/crawl`, { method: 'POST' })
}

/**
 * GET /dataset/{key}/process — lists crawl attempts for a dataset.
 */
export async function listCrawlAttempts(
  datasetKey: string,
  limit?: number,
): Promise<GbifPaginated<GbifCrawlStatus>> {
  const params = new URLSearchParams()
  if (limit !== undefined) params.set('limit', String(limit))
  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await gbifFetch(`/dataset/${datasetKey}/process${query}`)
  return response.json() as Promise<GbifPaginated<GbifCrawlStatus>>
}
