// GBIF API configuration — reads from environment variables

export const gbifConfig = {
  username: process.env.GBIF_USERNAME,
  password: process.env.GBIF_PASSWORD,
  apiUrl: process.env.GBIF_API_URL ?? 'https://api.gbif-uat.org/v1',
  /** GBIF organization UUID. Must be set via GBIF_ORG_KEY env var — no default. */
  orgKey: process.env.GBIF_ORG_KEY,
  installationKey: process.env.GBIF_INSTALLATION_KEY,
} as const

/**
 * Returns true when the configured API URL points to the GBIF production
 * environment (api.gbif.org without 'uat' in the hostname).
 */
export function isProduction(): boolean {
  return (
    gbifConfig.apiUrl.includes('api.gbif.org') &&
    !gbifConfig.apiUrl.includes('uat')
  )
}
