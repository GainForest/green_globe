#!/usr/bin/env node
/*
  Targeted migration script to re-upload correct tree blob for Oceanus Conservation.

  All 5 Oceanus Conservation site records ended up referencing an empty blob.
  This script downloads the correct GeoJSON from S3, uploads it to PDS, and
  updates all 5 site records atomically.

  Usage:
    node scripts/migrations/fix-oceanus-tree-blob.js \
      [--service https://climateai.org] \
      [--dry-run]

  Requires:
    - tmp/pds-credentials.json (key: 'oceanus-conservati.climateai.org')

  Outputs:
    tmp/fix-oceanus-tree-results.json
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')

const CREDENTIALS_FILE = 'tmp/pds-credentials.json'
const OUTPUT_FILE = 'tmp/fix-oceanus-tree-results.json'
const SMALL_BLOB_TYPE = 'app.gainforest.common.defs#smallBlob'

const OCEANUS_HANDLE = 'oceanus-conservati.climateai.org'
const OCEANUS_DID = 'did:plc:6oxtzu7gxz7xcldvtwfh3bpt'
const OCEANUS_COLLECTION = 'app.gainforest.organization.site'
const OCEANUS_SITE_RKEYS = [
  '3m2d63roz2c26',
  '3m2d63rhiss26',
  '3m2d63r7zkk26',
  '3m2d63qyegs26',
  '3m2d63qbymk26'
]
const TREE_GEOJSON_URL =
  'https://gainforest-transparency-dashboard.s3.amazonaws.com/shapefiles/oceanus-conservation-all-tree-plantings.geojson'

function parseArgs(argv) {
  const out = {
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    dryRun: false
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') out.service = argv[++i]
    else if (a === '--dry-run') out.dryRun = true
  }
  return out
}

function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (requestUrl) => {
      const protocol = requestUrl.startsWith('https') ? https : require('http') // eslint-disable-line @typescript-eslint/no-require-imports
      protocol.get(requestUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          makeRequest(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${requestUrl}`))
          return
        }
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    }
    makeRequest(url)
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('🌊 Oceanus Conservation Tree Blob Fix')
  console.log(`   Service: ${args.service}`)
  if (args.dryRun) {
    console.log('   🔍 DRY RUN MODE - No changes will be made')
  }

  // --- Step 1: Download GeoJSON from S3 ---
  console.log(`\n📥 Downloading tree GeoJSON from S3...`)
  console.log(`   URL: ${TREE_GEOJSON_URL}`)

  let geojsonBuffer
  try {
    geojsonBuffer = await downloadUrl(TREE_GEOJSON_URL)
    console.log(`   ✓ Downloaded ${(geojsonBuffer.length / 1024 / 1024).toFixed(2)}MB`)
  } catch (err) {
    console.error(`   ❌ Download failed: ${err.message}`)
    process.exit(1)
  }

  // --- Step 2: Validate GeoJSON ---
  console.log('\n🔍 Validating GeoJSON...')
  let geojson
  try {
    geojson = JSON.parse(geojsonBuffer.toString('utf8'))
  } catch (err) {
    console.error(`   ❌ Invalid JSON: ${err.message}`)
    process.exit(1)
  }

  if (!geojson.features || !Array.isArray(geojson.features)) {
    console.error('   ❌ GeoJSON has no features array')
    process.exit(1)
  }

  if (geojson.features.length === 0) {
    console.error('   ❌ GeoJSON features array is empty — aborting')
    process.exit(1)
  }

  console.log(`   ✓ Valid GeoJSON with ${geojson.features.length} features`)

  // --- Step 3: Load credentials ---
  console.log('\n🔑 Loading credentials...')
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    console.error(`   ❌ Credentials file not found: ${CREDENTIALS_FILE}`)
    process.exit(1)
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'))
  const password = credentials[OCEANUS_HANDLE]
  if (!password) {
    console.error(`   ❌ No password found for ${OCEANUS_HANDLE} in ${CREDENTIALS_FILE}`)
    process.exit(1)
  }
  console.log(`   ✓ Found credentials for ${OCEANUS_HANDLE}`)

  const agent = new AtpAgent({ service: args.service })

  // --- Step 4: Login ---
  let blobRef = null
  let newBlobCid = null

  if (!args.dryRun) {
    console.log(`\n🔐 Logging in as ${OCEANUS_HANDLE}...`)
    try {
      await agent.login({ identifier: OCEANUS_HANDLE, password })
      console.log('   ✓ Authenticated')
    } catch (err) {
      console.error(`   ❌ Login failed: ${err.message}`)
      process.exit(1)
    }

    // --- Step 5: Upload blob ---
    console.log('\n⬆️  Uploading tree GeoJSON blob to PDS...')
    try {
      const blobResponse = await agent.com.atproto.repo.uploadBlob(geojsonBuffer, {
        encoding: 'application/geo+json'
      })
      blobRef = blobResponse.data.blob
      newBlobCid = blobRef.ref?.$link || blobRef.ref
      console.log(`   ✓ Uploaded blob`)
      console.log(`   CID: ${newBlobCid}`)
      console.log(`   Size: ${(blobRef.size / 1024).toFixed(2)}KB`)
    } catch (err) {
      console.error(`   ❌ Blob upload failed: ${err.message}`)
      process.exit(1)
    }
  } else {
    console.log('\n🔍 [DRY RUN] Would login and upload blob to PDS')
    newBlobCid = '<dry-run-cid>'
  }

  // --- Step 6: List and update site records ---
  console.log(`\n📋 Listing site records for ${OCEANUS_DID}...`)
  console.log(`   Expected rkeys: ${OCEANUS_SITE_RKEYS.join(', ')}`)

  const results = []

  for (const rkey of OCEANUS_SITE_RKEYS) {
    const siteUri = `at://${OCEANUS_DID}/${OCEANUS_COLLECTION}/${rkey}`
    const result = {
      rkey,
      siteUri,
      siteName: null,
      previousTreesCid: null,
      newBlobCid,
      status: 'pending',
      error: null
    }

    try {
      if (args.dryRun) {
        console.log(`\n   🔍 [DRY RUN] Would fetch and update site rkey: ${rkey}`)
        result.status = 'dry-run'
        results.push(result)
        continue
      }

      // Fetch existing record
      const existingRecord = await agent.com.atproto.repo.getRecord({
        repo: OCEANUS_DID,
        collection: OCEANUS_COLLECTION,
        rkey
      })

      const recordValue = existingRecord.data.value
      result.siteName = recordValue.name || rkey
      result.previousTreesCid =
        recordValue.trees?.blob?.ref?.$link ||
        recordValue.trees?.blob?.ref ||
        null

      console.log(`\n   📍 Site: ${result.siteName} (${rkey})`)
      console.log(`      Previous trees CID: ${result.previousTreesCid || 'none'}`)

      // Update record with new blob ref
      await agent.com.atproto.repo.putRecord({
        repo: OCEANUS_DID,
        collection: OCEANUS_COLLECTION,
        rkey,
        record: {
          ...recordValue,
          trees: { $type: SMALL_BLOB_TYPE, blob: blobRef }
        }
      })

      console.log(`      ✓ Updated with new blob CID: ${newBlobCid}`)

      // --- Step 7: Verify update ---
      const verifyRecord = await agent.com.atproto.repo.getRecord({
        repo: OCEANUS_DID,
        collection: OCEANUS_COLLECTION,
        rkey
      })

      const verifiedCid =
        verifyRecord.data.value?.trees?.blob?.ref?.$link ||
        verifyRecord.data.value?.trees?.blob?.ref ||
        null

      if (verifiedCid === newBlobCid) {
        console.log(`      ✓ Verified: trees CID matches`)
        result.status = 'success'
        result.verifiedCid = verifiedCid
      } else {
        console.log(`      ⚠️  Verification mismatch: expected ${newBlobCid}, got ${verifiedCid}`)
        result.status = 'verification-mismatch'
        result.verifiedCid = verifiedCid
      }
    } catch (err) {
      result.status = 'failed'
      result.error = err.message || String(err)
      console.log(`\n   ❌ Failed for rkey ${rkey}: ${result.error}`)
    }

    results.push(result)
  }

  // --- Save results ---
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
  const output = {
    fixedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    service: args.service,
    organizationDid: OCEANUS_DID,
    organizationHandle: OCEANUS_HANDLE,
    newBlobCid,
    treeGeoJsonUrl: TREE_GEOJSON_URL,
    featuresCount: geojson.features.length,
    stats: {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      dryRun: results.filter(r => r.status === 'dry-run').length,
      failed: results.filter(r => r.status === 'failed').length,
      verificationMismatch: results.filter(r => r.status === 'verification-mismatch').length
    },
    results
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))

  console.log(`\n\n📁 Results saved to: ${OUTPUT_FILE}`)
  console.log('\n✅ Fix complete!')
  console.log(`   Total sites: ${output.stats.total}`)
  console.log(`   Success: ${output.stats.success}`)
  console.log(`   Failed: ${output.stats.failed}`)
  if (args.dryRun) {
    console.log(`   Dry-run: ${output.stats.dryRun}`)
  }
  if (output.stats.verificationMismatch > 0) {
    console.log(`   ⚠️  Verification mismatches: ${output.stats.verificationMismatch}`)
  }

  if (!args.dryRun && newBlobCid) {
    console.log(`\n🔗 Verify blob at:`)
    console.log(
      `   ${args.service}/xrpc/com.atproto.sync.getBlob?did=${OCEANUS_DID}&cid=${newBlobCid}`
    )
  }
}

main().catch(err => {
  console.error('❌ Fix script failed:', err)
  process.exit(1)
})
