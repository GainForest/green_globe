#!/usr/bin/env node
/*
  Migrate community member data from PostgreSQL to PDS.

  Reads the SQL dump to build:
    1. A project_id-hash → PDS handle/DID mapping (from the Project table)
    2. A per-org list of active User rows
    3. A per-user list of deduplicated Wallet rows

  In dry-run mode (--dry-run) the script outputs a JSON report showing
  per-org member counts and wallet mappings without writing anything to the PDS.

  In live mode the script:
    - Logs in to each org's PDS account
    - Downloads profile images from S3 and uploads them as blobs
    - Creates app.gainforest.organization.member records

  Usage:
    node scripts/migrations/migrate-members-to-pds.js \
      [--sql-dump <path>] \
      [--service https://climateai.org] \
      [--repos-file tmp/pds-repo-inventory-*.json] \
      [--credentials tmp/pds-credentials.json] \
      [--handle handle.climateai.org] \
      [--limit N] \
      [--dry-run] \
      [--out tmp/member-migration-results.json]
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AtpAgent } = require('@atproto/api')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TID } = require('@atproto/common-web')

const AWS_BASE = 'https://gainforest-transparency-dashboard.s3.amazonaws.com'
const MEMBER_COLLECTION = 'app.gainforest.organization.member'

// ---------------------------------------------------------------------------
// Slug helpers (same strategy as upsert-predictions-observations.js)
// ---------------------------------------------------------------------------

/**
 * Overrides for project name slugs that don't match the PDS handle slug
 * directly. Key = project-name slug, value = PDS handle slug (without
 * .climateai.org).
 */
const SLUG_OVERRIDES = {
  'green-ambassadors-club': 'green-ambassadors',
  'masungi-georeserve-foundation': 'masungi-georeserve',
  'xprize-rainforest-finals': 'xprize-rainfor-21p'
}

const MIN_PREFIX_MATCH = 10

function slugify(input) {
  return (input || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'org'
}

function longestCommonPrefixLength(a, b) {
  const limit = Math.min(a.length, b.length)
  let i = 0
  while (i < limit && a[i] === b[i]) i++
  return i
}

/**
 * Given a project name, find the best matching PDS handle slug.
 * Strategy (in order):
 *   1. Explicit override map
 *   2. Exact slug match against handle slug or repo name slug
 *   3. Prefix match (≥ MIN_PREFIX_MATCH chars)
 *   4. Name-based exact match (repo.name slugified)
 *
 * @param {string} projectName
 * @param {{ handle: string, did: string, name: string|null }[]} repos
 * @returns {{ handle: string, did: string, reason: string } | null}
 */
function matchProjectToRepo(projectName, repos) {
  const projectSlug = slugify(projectName)

  // 1. Override
  const overrideSlug = SLUG_OVERRIDES[projectSlug]
  if (overrideSlug) {
    const repo = repos.find((r) => r.handle.replace('.climateai.org', '') === overrideSlug)
    if (repo) return { handle: repo.handle, did: repo.did, reason: 'override' }
  }

  // 2. Exact slug match against handle slug
  const exactHandle = repos.find((r) => r.handle.replace('.climateai.org', '') === projectSlug)
  if (exactHandle) return { handle: exactHandle.handle, did: exactHandle.did, reason: 'exact-handle' }

  // 3. Exact slug match against repo name
  const exactName = repos.find((r) => r.name && slugify(r.name) === projectSlug)
  if (exactName) return { handle: exactName.handle, did: exactName.did, reason: 'exact-name' }

  // 4. Prefix match against handle slug
  let bestPrefix = null
  for (const repo of repos) {
    const handleSlug = repo.handle.replace('.climateai.org', '')
    const prefixLen = longestCommonPrefixLength(projectSlug, handleSlug)
    if (
      prefixLen >= MIN_PREFIX_MATCH &&
      (handleSlug.startsWith(projectSlug.substring(0, MIN_PREFIX_MATCH)) ||
        projectSlug.startsWith(handleSlug.substring(0, MIN_PREFIX_MATCH)))
    ) {
      if (!bestPrefix || prefixLen > bestPrefix.score) {
        bestPrefix = { handle: repo.handle, did: repo.did, reason: 'prefix', score: prefixLen }
      }
    }
  }
  if (bestPrefix) return { handle: bestPrefix.handle, did: bestPrefix.did, reason: bestPrefix.reason }

  return null
}

// ---------------------------------------------------------------------------
// SQL dump parsers
// ---------------------------------------------------------------------------

/**
 * Generic COPY block parser. Finds the first COPY statement for the given
 * table name and returns an array of row objects keyed by column name.
 *
 * @param {string} sql  Full SQL dump text
 * @param {string} tableName  Unquoted table name, e.g. "User"
 * @returns {Record<string, string|null>[]}
 */
function parseCopyRows(sql, tableName) {
  const lines = sql.split(/\r?\n/)
  const pattern = new RegExp(`^COPY public\\.["']?${tableName}["']? \\(`)
  const startIdx = lines.findIndex((l) => pattern.test(l))
  if (startIdx === -1) throw new Error(`COPY for public."${tableName}" not found in SQL dump`)

  const headerLine = lines[startIdx]
  const headerColsMatch = headerLine.match(/COPY public\."[^"]+" \(([^)]+)\)/)
  if (!headerColsMatch) throw new Error(`Could not parse COPY column header for table "${tableName}"`)
  const columns = headerColsMatch[1].split(',').map((s) => s.trim().replace(/"/g, ''))

  const rows = []
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line === '\\.') break
    if (!line) continue
    const fields = line.split('\t')
    const obj = {}
    columns.forEach((col, idx) => {
      let v = fields[idx]
      if (v === '\\N' || v === undefined) v = null
      obj[col] = v
    })
    rows.push(obj)
  }
  return rows
}

// ---------------------------------------------------------------------------
// Inventory / credentials helpers (same pattern as other migration scripts)
// ---------------------------------------------------------------------------

function findLatestRepoInventory() {
  const dir = 'tmp'
  try {
    const entries = fs.readdirSync(dir)
    const matches = entries
      .filter((name) => /^pds-repo-inventory-.*\.json$/i.test(name))
      .sort()
    if (!matches.length) return null
    return path.join(dir, matches[matches.length - 1])
  } catch {
    return null
  }
}

function findSqlDump() {
  // Walk up from cwd looking for *.backup or *.sql files
  const candidates = []
  const cwd = process.cwd()
  const parent = path.dirname(cwd)
  for (const dir of [cwd, parent, path.dirname(parent)]) {
    try {
      const entries = fs.readdirSync(dir)
      for (const entry of entries) {
        if (/\.(backup|sql)$/i.test(entry)) {
          candidates.push(path.join(dir, entry))
        }
      }
    } catch {
      // ignore
    }
  }
  return candidates[0] || null
}

function loadInventory(file) {
  if (!file) throw new Error('No repository inventory file found. Run bun run pds:list-repos first or pass --repos-file.')
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const repos = Array.isArray(raw.repos) ? raw.repos : []
  return repos
    .filter((repo) => repo.did)
    .map((repo) => ({
      did: repo.did,
      handle: repo.handle || (repo.knownFromMigration && repo.knownFromMigration.handle) || null,
      name: repo.name || (repo.knownFromMigration && repo.knownFromMigration.name) || null
    }))
    .filter((repo) => repo.handle)
}

// ---------------------------------------------------------------------------
// Credentials helper
// ---------------------------------------------------------------------------

function loadCredentials(file) {
  if (!fs.existsSync(file)) {
    console.warn(`[members] WARNING: Credentials file not found: ${file}. Live writes will be skipped.`)
    return new Map()
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  return new Map(Object.entries(raw))
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/**
 * Download a URL as a Buffer. Returns null on HTTP 4xx/5xx or network error.
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
 */
function fetchBinary(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          res.resume()
          resolve(null)
          return
        }
        const mimeType = res.headers['content-type'] || 'image/jpeg'
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), mimeType: mimeType.split(';')[0].trim() }))
        res.on('error', () => resolve(null))
      })
      .on('error', () => resolve(null))
  })
}

// ---------------------------------------------------------------------------
// Profile image upload
// ---------------------------------------------------------------------------

/**
 * Download a profile image from S3 and upload it as a PDS blob.
 * Returns the org.hypercerts.defs#smallImage object or null on failure.
 *
 * @param {import('@atproto/api').AtpAgent} agent
 * @param {string} profileImageUrl  e.g. "community/james-thembo.jpg"
 * @param {string} handle  For logging
 * @returns {Promise<{ $type: string, ref: object, mimeType: string, size: number } | null>}
 */
async function uploadProfileImage(agent, profileImageUrl, handle) {
  const url = `${AWS_BASE}/${profileImageUrl}`
  let result
  try {
    result = await fetchBinary(url)
  } catch (err) {
    console.warn(`[members] Image download error for ${handle} (${url}): ${err?.message || String(err)}`)
    return null
  }
  if (!result) {
    console.warn(`[members] Image download failed (non-2xx) for ${handle}: ${url}`)
    return null
  }
  try {
    const uploadRes = await agent.uploadBlob(result.buffer, { encoding: result.mimeType })
    const blobRef = uploadRes.data.blob
    return {
      $type: 'org.hypercerts.defs#smallImage',
      ref: blobRef,
      mimeType: result.mimeType,
      size: result.buffer.length
    }
  } catch (err) {
    console.warn(`[members] Blob upload failed for ${handle} (${url}): ${err?.message || String(err)}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Member record builder
// ---------------------------------------------------------------------------

/**
 * Truncate a string to at most maxGraphemes Unicode grapheme clusters.
 * Uses a simple code-point count as a conservative approximation.
 * @param {string|null|undefined} str
 * @param {number} max
 * @returns {string}
 */
function truncate(str, max) {
  if (!str) return ''
  // Spread to code points (handles surrogate pairs)
  const codePoints = [...str]
  if (codePoints.length <= max) return str
  return codePoints.slice(0, max).join('')
}

/**
 * Build an app.gainforest.organization.member record from a User row.
 *
 * @param {{
 *   id: string,
 *   first_name: string|null,
 *   last_name: string|null,
 *   title: string|null,
 *   bio: string|null,
 *   profile_image_url: string|null,
 *   display_order: string|null
 * }} user
 * @param {{ chain: string, address: string }[]} wallets
 * @param {string} orgDid
 * @param {{ $type: string, ref: object, mimeType: string, size: number } | null} profileImage
 * @returns {object}
 */
function buildMemberRecord(user, wallets, orgDid, profileImage) {
  const firstName = (user.first_name || '').trim()
  const lastName = (user.last_name || '').trim()
  const displayName = truncate([firstName, lastName].filter(Boolean).join(' ') || 'Unknown', 256)

  const rawRole = (user.title || '').trim()
  const role = truncate(rawRole || 'Community Member', 128)

  const record = {
    $type: MEMBER_COLLECTION,
    displayName,
    role,
    did: orgDid,
    createdAt: new Date().toISOString(),
    isPublic: true
  }

  if (firstName) record.firstName = truncate(firstName, 128)
  if (lastName) record.lastName = truncate(lastName, 128)

  const bioText = (user.bio || '').trim()
  if (bioText) {
    record.bio = { $type: 'app.gainforest.common.defs#richtext', text: bioText }
  }

  if (profileImage) {
    record.profileImage = profileImage
  }

  const displayOrder = user.display_order != null ? parseInt(user.display_order, 10) : NaN
  if (!Number.isNaN(displayOrder) && displayOrder >= 0) {
    record.displayOrder = displayOrder
  }

  // Wallet addresses — cap at 5 per lexicon maxLength
  if (wallets.length > 0) {
    record.walletAddresses = wallets.slice(0, 5).map((w) => ({
      $type: 'app.gainforest.organization.member#walletAddress',
      chain: truncate(w.chain, 32),
      address: truncate(w.address, 256)
    }))
  }

  return record
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    sqlDump: process.env.SQL_DUMP_PATH || findSqlDump(),
    service: process.env.PDS_SERVICE_URL || 'https://climateai.org',
    reposFile: process.env.PDS_REPO_INVENTORY_FILE || findLatestRepoInventory(),
    credentials: process.env.PDS_CREDENTIALS_FILE || 'tmp/pds-credentials.json',
    handles: [],
    limit: undefined,
    dryRun: false,
    out: 'tmp/member-migration-results.json'
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--sql-dump') args.sqlDump = argv[++i]
    else if (a === '--service') args.service = argv[++i]
    else if (a === '--repos-file') args.reposFile = argv[++i]
    else if (a === '--credentials') args.credentials = argv[++i]
    else if (a === '--handle') args.handles.push(argv[++i])
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10)
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--out') args.out = argv[++i]
  }
  return args
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[members] Parsed arguments', {
    sqlDump: args.sqlDump,
    service: args.service,
    reposFile: args.reposFile,
    handles: args.handles.length,
    limit: args.limit,
    dryRun: args.dryRun,
    out: args.out
  })

  // ------------------------------------------------------------------
  // 1. Load SQL dump
  // ------------------------------------------------------------------
  if (!args.sqlDump) {
    console.error('[members] ERROR: No SQL dump file found. Pass --sql-dump <path>.')
    process.exit(1)
  }
  if (!fs.existsSync(args.sqlDump)) {
    console.error(`[members] ERROR: SQL dump not found at: ${args.sqlDump}`)
    process.exit(1)
  }
  console.log(`[members] Reading SQL dump: ${args.sqlDump}`)
  const sql = fs.readFileSync(args.sqlDump, 'utf8')

  // ------------------------------------------------------------------
  // 2. Parse Project rows → build id-hash → name map
  // ------------------------------------------------------------------
  const projectRows = parseCopyRows(sql, 'Project')
  console.log(`[members] Parsed ${projectRows.length} Project rows`)

  /** @type {Map<string, string>} projectIdHash → projectName */
  const projectHashToName = new Map()
  for (const row of projectRows) {
    if (row.id && row.name) {
      projectHashToName.set(row.id, row.name)
    }
  }
  console.log(`[members] Built project hash→name map: ${projectHashToName.size} entries`)

  // ------------------------------------------------------------------
  // 3. Load PDS repo inventory
  // ------------------------------------------------------------------
  const repos = loadInventory(args.reposFile)
  console.log(`[members] Loaded ${repos.length} PDS repos from inventory`)

  // ------------------------------------------------------------------
  // 4. Match project hashes to PDS handles
  // ------------------------------------------------------------------
  /** @type {Map<string, { handle: string, did: string, projectName: string, reason: string }>} */
  const projectIdToRepo = new Map()
  const unmatchedProjects = []

  for (const [hash, name] of projectHashToName) {
    const match = matchProjectToRepo(name, repos)
    if (match) {
      projectIdToRepo.set(hash, { handle: match.handle, did: match.did, projectName: name, reason: match.reason })
    } else {
      unmatchedProjects.push({ hash, name })
    }
  }
  console.log(`[members] Matched ${projectIdToRepo.size} project hashes to PDS repos`)
  console.log(`[members] Unmatched projects: ${unmatchedProjects.length}`)

  // ------------------------------------------------------------------
  // 5. Parse User rows — only active users
  // ------------------------------------------------------------------
  const userRows = parseCopyRows(sql, 'User')
  console.log(`[members] Parsed ${userRows.length} User rows total`)

  const activeUsers = userRows.filter((u) => u.active === 't')
  console.log(`[members] Active users: ${activeUsers.length}`)

  /** @type {Map<string, typeof activeUsers>} projectIdHash → users[] */
  const usersByProject = new Map()
  for (const user of activeUsers) {
    if (!user.project_id) continue
    const list = usersByProject.get(user.project_id) || []
    list.push(user)
    usersByProject.set(user.project_id, list)
  }
  console.log(`[members] Active users grouped into ${usersByProject.size} projects`)

  // ------------------------------------------------------------------
  // 6. Parse Wallet rows — deduplicate by (user_id, address)
  // ------------------------------------------------------------------
  const walletRows = parseCopyRows(sql, 'Wallet')
  console.log(`[members] Parsed ${walletRows.length} Wallet rows total`)

  /** @type {Map<string, { chain: string, address: string }[]>} userId → wallets[] */
  const walletsByUser = new Map()
  for (const wallet of walletRows) {
    if (!wallet.user_id || !wallet.address) continue
    const existing = walletsByUser.get(wallet.user_id) || []
    // Deduplicate: same address (case-insensitive) + same chain
    const chain = (wallet.blockchain_type || '').toLowerCase()
    const addr = (wallet.address || '').toLowerCase()
    const isDupe = existing.some(
      (w) => w.address.toLowerCase() === addr && w.chain.toLowerCase() === chain
    )
    if (!isDupe) {
      existing.push({ chain: wallet.blockchain_type || '', address: wallet.address })
    }
    walletsByUser.set(wallet.user_id, existing)
  }
  console.log(`[members] Wallet index built: ${walletsByUser.size} users with wallets`)

  // ------------------------------------------------------------------
  // 7. Build per-org mapping output
  // ------------------------------------------------------------------
  /** @type {Record<string, { handle: string, did: string, projectName: string, reason: string, members: object[] }>} */
  const orgMapping = {}

  // Apply handle filter if provided
  const targetHashes = Array.from(projectIdToRepo.keys()).filter((hash) => {
    if (!args.handles.length) return true
    const repo = projectIdToRepo.get(hash)
    return repo && args.handles.includes(repo.handle)
  })

  const limitedHashes = args.limit ? targetHashes.slice(0, args.limit) : targetHashes

  for (const hash of limitedHashes) {
    const repo = projectIdToRepo.get(hash)
    if (!repo) continue

    const users = usersByProject.get(hash) || []
    const members = users.map((u) => {
      const wallets = walletsByUser.get(String(u.id)) || []
      return {
        id: u.id,
        firstName: u.first_name || null,
        lastName: u.last_name || null,
        displayName: [u.first_name, u.last_name].filter(Boolean).join(' ') || null,
        title: u.title || null,
        bio: u.bio || null,
        profileImageUrl: u.profile_image_url || null,
        displayOrder: u.display_order != null ? parseInt(u.display_order, 10) : null,
        walletAddresses: wallets
      }
    })

    orgMapping[hash] = {
      handle: repo.handle,
      did: repo.did,
      projectName: repo.projectName,
      matchReason: repo.reason,
      memberCount: members.length,
      members
    }
  }

  // ------------------------------------------------------------------
  // 8. Build summary (dry-run path exits here)
  // ------------------------------------------------------------------
  const totalMembersInMapping = Object.values(orgMapping).reduce((sum, o) => sum + o.memberCount, 0)
  const orgsWithMembers = Object.values(orgMapping).filter((o) => o.memberCount > 0)

  const summary = {
    sqlDump: args.sqlDump,
    reposFile: args.reposFile,
    dryRun: args.dryRun,
    projectRowsTotal: projectRows.length,
    projectHashesMapped: projectIdToRepo.size,
    projectHashesUnmatched: unmatchedProjects.length,
    userRowsTotal: userRows.length,
    activeUsers: activeUsers.length,
    walletRowsTotal: walletRows.length,
    usersWithWallets: walletsByUser.size,
    orgsInOutput: Object.keys(orgMapping).length,
    orgsWithMembers: orgsWithMembers.length,
    totalMembersInMapping
  }

  console.log('[members] Summary:', summary)

  if (args.dryRun) {
    // Dry-run: write the mapping report and exit
    const output = {
      summary,
      orgMapping,
      unmatchedProjects
    }
    fs.mkdirSync(path.dirname(args.out), { recursive: true })
    fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
    console.log(`[members] Dry-run complete. Wrote results to ${args.out}`)
    return
  }

  // ------------------------------------------------------------------
  // 9. Live write: login to each org and create member records
  // ------------------------------------------------------------------
  const credentials = loadCredentials(args.credentials)
  console.log(`[members] Loaded credentials for ${credentials.size} orgs`)

  const agent = new AtpAgent({ service: args.service })

  /** @type {Array<object>} */
  const writeResults = []

  for (const [hash, orgData] of Object.entries(orgMapping)) {
    const { handle, did, projectName, members } = orgData

    if (!members.length) {
      console.log(`[members] Skipping ${handle}: no members`)
      writeResults.push({ handle, did, projectName, status: 'skipped', reason: 'no-members' })
      continue
    }

    const password = credentials.get(handle)
    if (!password) {
      console.log(`[members] Skipping ${handle}: no credentials`)
      writeResults.push({ handle, did, projectName, status: 'skipped', reason: 'no-credentials', memberCount: members.length })
      continue
    }

    // Login
    try {
      await agent.login({ identifier: handle, password })
      console.log(`[members] Logged in as ${handle}`)
    } catch (err) {
      console.error(`[members] Login failed for ${handle}: ${err?.message || String(err)}`)
      writeResults.push({
        handle,
        did,
        projectName,
        status: 'failed',
        reason: 'login-failed',
        error: err?.message || String(err),
        memberCount: members.length
      })
      continue
    }

    const orgResults = []

    for (const member of members) {
      const wallets = member.walletAddresses || []

      // Upload profile image if present
      let profileImage = null
      if (member.profileImageUrl) {
        console.log(`[members]   Uploading image for ${member.displayName || member.id} (${member.profileImageUrl})`)
        profileImage = await uploadProfileImage(agent, member.profileImageUrl, handle)
        if (!profileImage) {
          console.warn(`[members]   Image upload failed for ${member.displayName || member.id} — continuing without image`)
        }
      }

      // Build the record
      const record = buildMemberRecord(
        {
          id: member.id,
          first_name: member.firstName,
          last_name: member.lastName,
          title: member.title,
          bio: member.bio,
          profile_image_url: member.profileImageUrl,
          display_order: member.displayOrder != null ? String(member.displayOrder) : null
        },
        wallets,
        did,
        profileImage
      )

      const rkey = TID.nextStr()

      try {
        await agent.com.atproto.repo.createRecord({
          repo: did,
          collection: MEMBER_COLLECTION,
          rkey,
          record
        })
        console.log(`[members]   Created member record: ${member.displayName || member.id} (rkey=${rkey})`)
        orgResults.push({
          memberId: member.id,
          displayName: member.displayName,
          rkey,
          status: 'success',
          hasImage: Boolean(profileImage),
          walletCount: wallets.length
        })
      } catch (err) {
        console.error(`[members]   Failed to create record for ${member.displayName || member.id}: ${err?.message || String(err)}`)
        orgResults.push({
          memberId: member.id,
          displayName: member.displayName,
          rkey,
          status: 'failed',
          error: err?.message || String(err)
        })
      }
    }

    const orgSuccessCount = orgResults.filter((r) => r.status === 'success').length
    const orgFailCount = orgResults.filter((r) => r.status === 'failed').length
    console.log(`[members] ${handle}: ${orgSuccessCount} created, ${orgFailCount} failed`)

    writeResults.push({
      handle,
      did,
      projectName,
      status: orgFailCount === 0 ? 'success' : orgSuccessCount > 0 ? 'partial' : 'failed',
      memberCount: members.length,
      successCount: orgSuccessCount,
      failCount: orgFailCount,
      members: orgResults
    })
  }

  // ------------------------------------------------------------------
  // 10. Write final output
  // ------------------------------------------------------------------
  const writeSummary = {
    ...summary,
    dryRun: false,
    orgsProcessed: writeResults.length,
    orgsSuccess: writeResults.filter((r) => r.status === 'success').length,
    orgsPartial: writeResults.filter((r) => r.status === 'partial').length,
    orgsFailed: writeResults.filter((r) => r.status === 'failed').length,
    orgsSkipped: writeResults.filter((r) => r.status === 'skipped').length,
    totalCreated: writeResults.reduce((sum, r) => sum + (r.successCount || 0), 0),
    totalFailed: writeResults.reduce((sum, r) => sum + (r.failCount || 0), 0)
  }

  console.log('[members] Write summary:', writeSummary)

  const output = {
    summary: writeSummary,
    results: writeResults,
    orgMapping,
    unmatchedProjects
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(`[members] Wrote results to ${args.out}`)
}

main().catch((err) => {
  console.error('[members] Fatal error:', err)
  process.exit(1)
})
