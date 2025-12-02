// keep this list in one place so both the SDK and your app agree on it
export const allowedPDSDomains = ["climateai.org"] as "climateai.org"[];

export type AllowedPDSDomain = (typeof allowedPDSDomains)[number];
