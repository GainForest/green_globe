# GBIF Publishing Guide

This guide explains how to publish GainForest tree-observation datasets to [GBIF](https://www.gbif.org) programmatically using the automated publishing pipeline.

---

## Overview

The pipeline takes an organization's data stored in the AT Protocol PDS and publishes it to GBIF as a Darwin Core Archive (DwC-A).

**Data flow:**

```
PDS (ATProto records)
  → DwC-A generation (src/lib/gbif/dwca/)
  → PDS blob upload (src/lib/gbif/pds-archive-host.ts)
  → GBIF Validator (optional)
  → GBIF Registry API (src/lib/gbif/api/registry-client.ts)
  → GBIF crawler ingestion
```

The PDS is the single source of truth. Both the DwC-A archive blobs and the dataset registration records live there. The GBIF Registry API uses HTTP Basic Auth. Archive endpoint URLs change on every publish because they are CID-based blob URLs.

---

## Prerequisites

- A [GBIF.org account](https://www.gbif.org/user/profile) with `editor_rights` for the GainForest organization (`c02486e8-eb54-4e94-81d8-1038cc58e208`).
- Access to the GainForest PDS (`https://climateai.org`) with a service account that can read organization records.
- Node.js / Bun installed locally.
- The project dependencies installed: `bun install`.

> **UAT vs Production:** Always test against the GBIF UAT environment first (`https://api.gbif-uat.org/v1`). Switch to production only when you have real `editor_rights` and are ready to publish live data. See [Switching to Production](#switching-to-production).

---

## Environment Setup

Copy `.env.example` to `.env` and fill in the GBIF section:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `GBIF_USERNAME` | Your GBIF account username | Yes |
| `GBIF_PASSWORD` | Your GBIF account password | Yes |
| `GBIF_API_URL` | GBIF Registry API base URL. UAT: `https://api.gbif-uat.org/v1` (default). Production: `https://api.gbif.org/v1` | Yes |
| `GBIF_ORG_KEY` | GainForest's GBIF organization UUID. Default: `c02486e8-eb54-4e94-81d8-1038cc58e208` | Yes |
| `GBIF_INSTALLATION_KEY` | GBIF installation UUID. Created once via the bootstrap script (see below). Leave blank until bootstrapped. | Yes (after bootstrap) |

You also need the PDS service account credentials in `.env`:

| Variable | Description |
|---|---|
| `PDS_ADMIN_IDENTIFIER` | PDS handle or email for authentication |
| `PDS_ADMIN_PASSWORD` | PDS account password |

> **Security:** Never commit real credentials to git. The `.env` file is in `.gitignore`. Only placeholder values belong in `.env.example`.

---

## First-Time Setup

Before publishing any dataset, you must create a GBIF **HTTP Installation** for GainForest. This is a one-time step per environment (UAT and production).

```bash
bun run scripts/bootstrap-gbif-installation.ts
```

Optional: override the installation title:

```bash
bun run scripts/bootstrap-gbif-installation.ts --title "My Custom Installation Title"
```

On success the script prints the installation UUID:

```
Installation UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

Add the following to your .env file:

  GBIF_INSTALLATION_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Copy the `GBIF_INSTALLATION_KEY` value into your `.env` file. You only need to do this once per environment — GBIF allows multiple installations per organization.

---

## Publishing a Dataset

Once the installation is bootstrapped, publish a dataset with:

```bash
bun run scripts/publish-to-gbif.ts --did <organization-did>
```

**Examples:**

```bash
# Publish with defaults
bun run scripts/publish-to-gbif.ts --did did:plc:abc123

# Override title and description
bun run scripts/publish-to-gbif.ts \
  --did did:plc:abc123 \
  --title "Reforestation Observations — Kenya 2024" \
  --description "Tree planting records from the Nairobi reforestation project."

# Override contact details
bun run scripts/publish-to-gbif.ts \
  --did did:plc:abc123 \
  --contact-name "Jane Smith" \
  --contact-email "jane@example.org"

# Skip GBIF validation (faster, useful for re-publishing known-good data)
bun run scripts/publish-to-gbif.ts --did did:plc:abc123 --skip-validation

# Dry run: generate and validate but do NOT register or trigger crawl
bun run scripts/publish-to-gbif.ts --did did:plc:abc123 --dry-run
```

**All CLI options:**

| Flag | Description | Default |
|---|---|---|
| `--did <did>` | **(Required)** PDS DID of the organization to publish | — |
| `--title <title>` | Dataset title | `GainForest Tree Observations` |
| `--description <desc>` | Dataset description | Generic GainForest description |
| `--contact-name <name>` | Contact person name | `GainForest Tech` |
| `--contact-email <email>` | Contact email address | `tech@gainforest.net` |
| `--skip-validation` | Skip the GBIF Validator step | off |
| `--dry-run` | Generate + validate only; do not register or crawl | off |
| `--help` | Show usage | — |

On success the script prints a summary including the GBIF dataset URL:

```
--- PUBLISH SUMMARY ---
Dataset:       NEW
GBIF key:      xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Endpoint key:  42
Blob CID:      bafyrei...
Blob URL:      https://climateai.org/xrpc/com.atproto.sync.getBlob?did=...&cid=...
Validation:    passed
Crawl:         triggered

GBIF dataset URL: https://www.gbif-uat.org/dataset/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Done.
```

---

## How It Works

The pipeline is orchestrated by `publishToGbif()` in `src/lib/gbif/publisher.ts` and proceeds in five steps:

1. **Generate** — `src/lib/gbif/dwca/` fetches ATProto records from the PDS (`pds-fetcher.ts`) and assembles a Darwin Core Archive ZIP containing `occurrence.txt`, `multimedia.txt`, `measurementorfact.txt`, `meta.xml`, and `eml.xml`.

2. **Upload** — `src/lib/gbif/pds-archive-host.ts` uploads the ZIP as a blob to the PDS and returns a public blob URL (CID-based, changes on every publish).

3. **Validate** (optional) — `src/lib/gbif/api/validator-client.ts` submits the blob URL to the GBIF Validator and polls until complete. Fails the pipeline if the archive is not indexeable.

4. **Register** — `src/lib/gbif/api/registry-client.ts` either creates a new GBIF dataset or updates the endpoint URL of an existing one. Dataset registration records are stored in the PDS via `src/lib/gbif/pds-dataset-registry.ts` so the pipeline can detect re-publishes.

5. **Crawl** — Triggers the GBIF crawler for the dataset. Crawl failures are non-fatal (a warning is printed but the pipeline succeeds).

---

## Test Environment

GBIF provides a UAT (User Acceptance Testing) environment that mirrors production:

- **API URL:** `https://api.gbif-uat.org/v1`
- **Portal:** `https://www.gbif-uat.org`
- **Credentials:** Use your real GBIF.org account credentials — UAT shares the same user database as production.
- **Organization:** The GainForest organization (`c02486e8-eb54-4e94-81d8-1038cc58e208`) exists in UAT.

The default `GBIF_API_URL` in `.env.example` points to UAT. All development and testing should be done against UAT before switching to production.

Datasets published to UAT appear at:
```
https://www.gbif-uat.org/dataset/<gbifDatasetKey>
```

---

## Troubleshooting

### Missing environment variables

```
Error: Missing required environment variables: GBIF_USERNAME, GBIF_PASSWORD
```

Ensure all required variables are set in your `.env` file. See [Environment Setup](#environment-setup).

### Authentication failure

```
[auth] Authentication failed: Invalid identifier or password
```

Check `PDS_ADMIN_IDENTIFIER` and `PDS_ADMIN_PASSWORD`. The identifier can be a handle (e.g., `admin.climateai.org`) or an email address.

### GBIF API authentication failure (401)

```
GBIF API error 401 Unauthorized
```

Check `GBIF_USERNAME` and `GBIF_PASSWORD`. Ensure the account has `editor_rights` for the GainForest organization in the target environment (UAT or production).

### Missing installation key

```
Error at step 'register': GBIF_INSTALLATION_KEY is not set. Run the bootstrap script first.
```

Run `bun run scripts/bootstrap-gbif-installation.ts` and add the printed UUID to your `.env` as `GBIF_INSTALLATION_KEY`.

### Validation failure

```
Error at step 'validate': GBIF validation failed: archive is not indexeable.
```

The DwC-A archive failed GBIF's validation checks. Use `--dry-run` to inspect the validation result without registering. Common causes: missing required Darwin Core terms, malformed dates, or invalid coordinates. Check the occurrence records in the PDS.

### Crawl not triggered

```
Warning: Failed to trigger GBIF crawl for dataset <key>: ...
```

Crawl failures are non-fatal. The dataset is registered and the endpoint is updated. You can manually trigger a crawl from the GBIF portal or retry the publish script.

---

## Switching to Production

1. Obtain `editor_rights` for the GainForest organization on `gbif.org` (contact GBIF helpdesk).
2. Update `GBIF_API_URL` in your `.env`:
   ```
   GBIF_API_URL=https://api.gbif.org/v1
   ```
3. Re-run the bootstrap script to create a production installation:
   ```bash
   bun run scripts/bootstrap-gbif-installation.ts
   ```
4. Update `GBIF_INSTALLATION_KEY` in your `.env` with the new production UUID.
5. Run the publish script as normal. The success output will show `https://www.gbif.org/dataset/...`.

> **Note:** UAT and production are separate environments. Datasets registered in UAT do not appear in production and vice versa. You will need to publish each dataset again after switching to production.
