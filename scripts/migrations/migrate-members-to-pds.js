#!/usr/bin/env node
/*
  Migrate community member data from PostgreSQL to PDS.

  Reads the SQL dump to build:
    1. A project_id-hash → PDS handle/DID mapping (from the Project table)
    2. A per-org list of active User rows
    3. A per-user list of deduplicated Wallet rows

  In dry-run mode (--dry-run) the script outputs a JSON report showing
  per-org member counts and wallet mappings without writing anything to the PDS.

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

function main() {
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
  // 8. Build summary
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

  // ------------------------------------------------------------------
  // 9. Write output
  // ------------------------------------------------------------------
  const output = {
    summary,
    orgMapping,
    unmatchedProjects
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(`[members] Wrote results to ${args.out}`)
}

main()
