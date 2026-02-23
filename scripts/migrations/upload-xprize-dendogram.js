#!/usr/bin/env node
/*
  Upload the XPRIZE dendogram SVG to the PDS as an observations.dendogram record.

  Downloads the SVG from S3, uploads it as a blob to the XPRIZE organization's
  PDS account, and creates an app.gainforest.organization.observations.dendogram
  record with rkey 'self'.

  Usage:
    node scripts/migrations/upload-xprize-dendogram.js \
      [--service https://climateai.org] \
      [--credentials tmp/pds-credentials.json] \
      [--handle xprize-rainforest.climateai.org] \
      [--dry-run]

  Flags:
    --service <url>       PDS service URL (default: https://climateai.org)
    --credentials <path>  Path to credentials JSON file (default: tmp/pds-credentials.json)
    --handle <handle>     XPRIZE organization handle to use (default: xprize-rainforest.climateai.org)
    --dry-run             Show what would be created without writing to PDS
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')

const SVG_URL =
  'https://gainforest-transparency-dashboard.s3.amazonaws.com/dendogram/xprize-rainforest-finals_dendogram.svg'

const COLLECTION = 'app.gainforest.organization.observations.dendogram'
const RKEY = 'self'

// Known XPRIZE handles and their DIDs
const XPRIZE_HANDLES = {
  'xprize-rainforest.climateai.org': 'did:plc:y6oovsehm62hkctcwcovbss5',
  'xprize-2024.climateai.org': 'did:plc:je4bmysje3yvaxf2wwo643z3',
  'xprize-rainfor-21p.climateai.org': 'did:plc:axibb3hd3od3635jhihwmohv'
}

const DEFAULT_HANDLE = 'xprize-rainforest.climateai.org'
const DEFAULT_CREDENTIALS_FILE = 'tmp/pds-credentials.json'

function parseArgs(argv) {
  const args = {
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    credentials: process.env.PDS_CREDENTIALS_FILE || DEFAULT_CREDENTIALS_FILE,
    handle: DEFAULT_HANDLE,
    dryRun: false
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--service') args.service = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--handle') args.handle = argv[++i]
    else if (a === '--dry-run') args.dryRun = true
  }

  return args
}

function loadCredentials(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Credentials file not found: ${file}`)
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  return new Map(Object.entries(raw))
}

async function downloadSvg(url) {
  return new Promise((resolve, reject) => {
    const encodedUrl = encodeURI(url)
    https
      .get(encodedUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download SVG: HTTP ${response.statusCode}`))
          return
        }

        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => resolve(Buffer.concat(chunks)))
        response.on('error', reject)
      })
      .on('error', reject)
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('🌿 XPRIZE Dendogram Upload')
  console.log(`   Service:     ${args.service}`)
  console.log(`   Handle:      ${args.handle}`)
  console.log(`   Credentials: ${args.credentials}`)
  console.log(`   Mode:        ${args.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log()

  // Resolve DID for the chosen handle
  const did = XPRIZE_HANDLES[args.handle]
  if (!did) {
    console.error(`❌ Unknown handle: ${args.handle}`)
    console.error(`   Known handles: ${Object.keys(XPRIZE_HANDLES).join(', ')}`)
    process.exit(1)
  }

  console.log(`   DID: ${did}`)
  console.log()

  // Step 1: Download the SVG from S3
  console.log(`⬇️  Downloading SVG from S3...`)
  console.log(`   URL: ${SVG_URL}`)

  let svgBuffer
  try {
    svgBuffer = await downloadSvg(SVG_URL)
    console.log(`   ✓ Downloaded ${(svgBuffer.length / 1024).toFixed(2)} KB`)
  } catch (err) {
    console.error(`❌ Failed to download SVG: ${err.message}`)
    process.exit(1)
  }

  // Build the record we intend to create
  const record = {
    $type: COLLECTION,
    dendogram: {
      $type: 'org.hypercerts.defs#smallBlob',
      // ref will be filled in after blob upload
      mimeType: 'image/svg+xml',
      size: svgBuffer.length
    },
    createdAt: new Date().toISOString(),
    name: 'Flora Phylogenetic Tree - XPRIZE Rainforest Finals',
    treeType: 'phylogenetic',
    taxonGroups: ['flora'],
    dataSource: 'XPRIZE Rainforest Competition'
  }

  if (args.dryRun) {
    console.log()
    console.log('🔍 [DRY RUN] Would upload blob and create record:')
    console.log(`   Collection: ${COLLECTION}`)
    console.log(`   rkey:       ${RKEY}`)
    console.log(`   repo:       ${did} (${args.handle})`)
    console.log()
    console.log('   Record (without blob ref):')
    console.log(JSON.stringify({ ...record, dendogram: { ...record.dendogram, ref: '<blob-ref-after-upload>' } }, null, 4))
    console.log()
    console.log('✅ Dry run complete — no changes made.')
    return
  }

  // Step 2: Load credentials and login
  let credentials
  try {
    credentials = loadCredentials(args.credentials)
  } catch (err) {
    console.error(`❌ ${err.message}`)
    process.exit(1)
  }

  const password = credentials.get(args.handle)
  if (!password) {
    // Try fallback handles
    const fallbacks = Object.keys(XPRIZE_HANDLES).filter((h) => h !== args.handle)
    let found = false
    for (const fallback of fallbacks) {
      const fallbackPassword = credentials.get(fallback)
      if (fallbackPassword) {
        console.warn(`⚠️  No password for ${args.handle}, falling back to ${fallback}`)
        args.handle = fallback
        // Update DID to match fallback handle
        const fallbackDid = XPRIZE_HANDLES[fallback]
        console.log(`   Using DID: ${fallbackDid}`)
        found = true
        break
      }
    }
    if (!found) {
      console.error(`❌ No password found for any XPRIZE handle in ${args.credentials}`)
      console.error(`   Tried: ${Object.keys(XPRIZE_HANDLES).join(', ')}`)
      process.exit(1)
    }
  }

  const activePassword = credentials.get(args.handle)
  const activeDid = XPRIZE_HANDLES[args.handle]

  const agent = new AtpAgent({ service: args.service })

  console.log(`🔐 Logging in as ${args.handle}...`)
  try {
    await agent.login({ identifier: args.handle, password: activePassword })
    console.log(`   ✓ Authenticated`)
  } catch (err) {
    console.error(`❌ Login failed: ${err.message || String(err)}`)
    process.exit(1)
  }

  // Step 3: Upload the SVG as a blob
  console.log()
  console.log(`⬆️  Uploading SVG blob to PDS...`)
  let blobRef
  try {
    const blobResponse = await agent.com.atproto.repo.uploadBlob(svgBuffer, {
      encoding: 'image/svg+xml'
    })
    blobRef = blobResponse.data.blob
    const blobCid = blobRef.ref?.$link || blobRef.ref
    console.log(`   ✓ Uploaded blob`)
    console.log(`      CID:      ${blobCid}`)
    console.log(`      MIME:     ${blobRef.mimeType}`)
    console.log(`      Size:     ${(blobRef.size / 1024).toFixed(2)} KB`)
  } catch (err) {
    console.error(`❌ Blob upload failed: ${err.message || String(err)}`)
    process.exit(1)
  }

  // Step 4: Create the dendogram record
  const finalRecord = {
    ...record,
    dendogram: {
      $type: 'org.hypercerts.defs#smallBlob',
      ref: blobRef.ref,
      mimeType: 'image/svg+xml',
      size: svgBuffer.length
    }
  }

  console.log()
  console.log(`📝 Creating dendogram record...`)
  console.log(`   Collection: ${COLLECTION}`)
  console.log(`   rkey:       ${RKEY}`)
  console.log(`   repo:       ${activeDid}`)

  try {
    await agent.com.atproto.repo.putRecord({
      repo: activeDid,
      collection: COLLECTION,
      rkey: RKEY,
      record: finalRecord
    })
    console.log(`   ✓ Record created`)
  } catch (err) {
    console.error(`❌ Failed to create record: ${err.message || String(err)}`)
    process.exit(1)
  }

  console.log()
  console.log('✅ Done!')
  console.log(`   Dendogram record written to ${activeDid} (${args.handle})`)
  console.log(`   at-uri: at://${activeDid}/${COLLECTION}/${RKEY}`)
}

main().catch((err) => {
  console.error('❌ Upload failed:', err)
  process.exit(1)
})
