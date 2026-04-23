// GBIF Validator API client
// Hits the /validation endpoints on the same base URL as gbifConfig.apiUrl

import { gbifConfig } from '@/config/gbif'
import type { GbifValidation, ValidationStatus } from './types'

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class ValidationTimeoutError extends Error {
  lastStatus: ValidationStatus

  constructor(lastStatus: ValidationStatus, timeoutMs: number) {
    super(
      `GBIF validation timed out after ${timeoutMs}ms. Last status: ${lastStatus}`,
    )
    this.name = 'ValidationTimeoutError'
    this.lastStatus = lastStatus
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function validationUrl(path: string): string {
  const base = gbifConfig.apiUrl.replace(/\/$/, '')
  return `${base}/validation${path}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Submit a publicly accessible file URL for validation.
 * The fileUrl is sent as a query parameter, NOT in the request body.
 */
export async function submitUrlForValidation(
  fileUrl: string,
  notificationEmail?: string,
): Promise<GbifValidation> {
  const url = new URL(validationUrl('/url'))
  url.searchParams.set('fileUrl', fileUrl)
  if (notificationEmail) {
    url.searchParams.set('notificationEmail', notificationEmail)
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: new FormData(),
  })

  if (!response.ok) {
    throw new Error(
      `GBIF Validator: submitUrlForValidation failed with status ${response.status}`,
    )
  }

  return response.json() as Promise<GbifValidation>
}

/**
 * Submit a file buffer for validation using multipart/form-data.
 */
export async function submitFileForValidation(
  file: Buffer,
  filename: string,
): Promise<GbifValidation> {
  const formData = new FormData()
  const blob = new Blob([new Uint8Array(file)])
  formData.append('file', blob, filename)

  const response = await fetch(validationUrl(''), {
    method: 'POST',
    body: formData,
    // Content-Type is set automatically by fetch when using FormData (multipart/form-data)
  })

  if (!response.ok) {
    throw new Error(
      `GBIF Validator: submitFileForValidation failed with status ${response.status}`,
    )
  }

  return response.json() as Promise<GbifValidation>
}

/**
 * Retrieve the current result/status of a validation job.
 */
export async function getValidationResult(
  validationKey: string,
): Promise<GbifValidation> {
  const response = await fetch(validationUrl(`/${validationKey}`))

  if (!response.ok) {
    throw new Error(
      `GBIF Validator: getValidationResult failed with status ${response.status} for key ${validationKey}`,
    )
  }

  return response.json() as Promise<GbifValidation>
}

// Terminal statuses — polling stops when one of these is reached
const TERMINAL_STATUSES = new Set<ValidationStatus>([
  'FINISHED',
  'FAILED',
  'ABORTED',
])

/**
 * Poll getValidationResult every intervalMs until the validation reaches a
 * terminal status (FINISHED, FAILED, or ABORTED).
 *
 * Throws ValidationTimeoutError if timeoutMs is exceeded before a terminal
 * status is reached.
 */
export async function pollValidationUntilComplete(
  validationKey: string,
  options?: { intervalMs?: number; timeoutMs?: number },
): Promise<GbifValidation> {
  const intervalMs = options?.intervalMs ?? 5_000
  const timeoutMs = options?.timeoutMs ?? 300_000

  const deadline = Date.now() + timeoutMs
  let lastValidation: GbifValidation | null = null

  return new Promise<GbifValidation>((resolve, reject) => {
    const tick = async () => {
      if (Date.now() >= deadline) {
        const lastStatus = lastValidation?.status ?? ('QUEUED' as ValidationStatus)
        reject(new ValidationTimeoutError(lastStatus, timeoutMs))
        return
      }

      let validation: GbifValidation
      try {
        validation = await getValidationResult(validationKey)
      } catch (err) {
        // Network errors during polling propagate immediately
        reject(err)
        return
      }

      lastValidation = validation

      if (TERMINAL_STATUSES.has(validation.status)) {
        resolve(validation)
        return
      }

      // Still in progress (QUEUED, SUBMITTED, DOWNLOADING, RUNNING) — schedule next tick
      const remaining = deadline - Date.now()
      if (remaining <= 0) {
        reject(new ValidationTimeoutError(validation.status, timeoutMs))
        return
      }

      setTimeout(tick, Math.min(intervalMs, remaining))
    }

    // Start the first tick immediately
    void tick()
  })
}

/**
 * Returns true when the validation result indicates the archive is indexeable
 * by GBIF (i.e. it passed validation and can be ingested).
 */
export function isValidationIndexeable(validation: GbifValidation): boolean {
  return validation.metrics?.indexeable === true
}
