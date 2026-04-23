/**
 * zip-builder.ts — Minimal ZIP archive builder (no external dependencies).
 *
 * Uses DEFLATE compression via Node.js built-in zlib.deflateRawSync.
 * ZIP format reference: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 *
 * Shared by:
 *   - src/lib/gbif/publisher.ts
 *   - scripts/export-dwca.ts
 */

import { deflateRawSync, crc32 } from 'node:zlib'

type ZipEntry = {
  filename: string
  crc: number
  compressedData: Buffer
  compressedSize: number
  uncompressedSize: number
  offset: number
}

/**
 * Build a ZIP archive buffer from a map of filename → string content.
 * Files are stored at the root level (no directory structure).
 * All files are compressed with DEFLATE.
 */
export function buildZip(files: Record<string, string>): Buffer {
  const entries: ZipEntry[] = []
  const localParts: Buffer[] = []
  let currentOffset = 0

  for (const [filename, content] of Object.entries(files)) {
    const rawData = Buffer.from(content, 'utf8')
    const uncompressedSize = rawData.length
    const crcValue = crc32(rawData) as unknown as number
    const compressedData = deflateRawSync(rawData)
    const compressedSize = compressedData.length
    const filenameBytes = Buffer.from(filename, 'utf8')
    const filenameLen = filenameBytes.length

    // Local file header: 30 bytes + filename
    const localHeader = Buffer.alloc(30 + filenameLen)
    localHeader.writeUInt32LE(0x04034b50, 0) // Local file header signature
    localHeader.writeUInt16LE(20, 4) // Version needed: 2.0
    localHeader.writeUInt16LE(0x0800, 6) // General purpose bit flag: UTF-8
    localHeader.writeUInt16LE(8, 8) // Compression method: DEFLATE
    localHeader.writeUInt16LE(0, 10) // Last mod file time
    localHeader.writeUInt16LE(0, 12) // Last mod file date
    localHeader.writeUInt32LE(crcValue, 14) // CRC-32
    localHeader.writeUInt32LE(compressedSize, 18) // Compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22) // Uncompressed size
    localHeader.writeUInt16LE(filenameLen, 26) // Filename length
    localHeader.writeUInt16LE(0, 28) // Extra field length
    filenameBytes.copy(localHeader, 30)

    entries.push({
      filename,
      crc: crcValue,
      compressedData,
      compressedSize,
      uncompressedSize,
      offset: currentOffset,
    })

    currentOffset += localHeader.length + compressedData.length
    localParts.push(localHeader, compressedData)
  }

  // Central directory
  const centralParts: Buffer[] = []
  let centralDirSize = 0

  for (const entry of entries) {
    const filenameBytes = Buffer.from(entry.filename, 'utf8')
    const filenameLen = filenameBytes.length
    const centralHeader = Buffer.alloc(46 + filenameLen)

    centralHeader.writeUInt32LE(0x02014b50, 0) // Central directory signature
    centralHeader.writeUInt16LE(20, 4) // Version made by
    centralHeader.writeUInt16LE(20, 6) // Version needed
    centralHeader.writeUInt16LE(0x0800, 8) // General purpose bit flag: UTF-8
    centralHeader.writeUInt16LE(8, 10) // Compression method: DEFLATE
    centralHeader.writeUInt16LE(0, 12) // Last mod file time
    centralHeader.writeUInt16LE(0, 14) // Last mod file date
    centralHeader.writeUInt32LE(entry.crc, 16) // CRC-32
    centralHeader.writeUInt32LE(entry.compressedSize, 20) // Compressed size
    centralHeader.writeUInt32LE(entry.uncompressedSize, 24) // Uncompressed size
    centralHeader.writeUInt16LE(filenameLen, 28) // Filename length
    centralHeader.writeUInt16LE(0, 30) // Extra field length
    centralHeader.writeUInt16LE(0, 32) // File comment length
    centralHeader.writeUInt16LE(0, 34) // Disk number start
    centralHeader.writeUInt16LE(0, 36) // Internal file attributes
    centralHeader.writeUInt32LE(0, 38) // External file attributes
    centralHeader.writeUInt32LE(entry.offset, 42) // Relative offset of local header
    filenameBytes.copy(centralHeader, 46)

    centralParts.push(centralHeader)
    centralDirSize += centralHeader.length
  }

  // End of central directory record
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // EOCD signature
  eocd.writeUInt16LE(0, 4) // Disk number
  eocd.writeUInt16LE(0, 6) // Disk with start of central directory
  eocd.writeUInt16LE(entries.length, 8) // Number of entries on this disk
  eocd.writeUInt16LE(entries.length, 10) // Total number of entries
  eocd.writeUInt32LE(centralDirSize, 12) // Size of central directory
  eocd.writeUInt32LE(currentOffset, 16) // Offset of central directory
  eocd.writeUInt16LE(0, 20) // Comment length

  return Buffer.concat([...localParts, ...centralParts, eocd])
}
