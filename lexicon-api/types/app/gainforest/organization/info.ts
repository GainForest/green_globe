/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'
import type * as AppGainforestCommonDefs from '../common/defs.js'
import type * as PubLeafletPagesLinearDocument from '../../../pub/leaflet/pages/linearDocument.js'
import type * as OrgHypercertsDefs from '../../../org/hypercerts/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.organization.info'

export interface Record {
  $type: 'app.gainforest.organization.info'
  /** The name of the organization or project */
  displayName: string
  shortDescription: AppGainforestCommonDefs.Richtext
  longDescription: PubLeafletPagesLinearDocument.Main
  coverImage?: OrgHypercertsDefs.SmallImage
  logo?: OrgHypercertsDefs.SmallImage
  /** The objectives of the organization or project */
  objectives: (
    | 'Conservation'
    | 'Research'
    | 'Education'
    | 'Community'
    | 'Other'
  )[]
  /** The start date of the organization or project */
  startDate?: string
  /** The website of the organization or project */
  website?: string
  /** The country of the organization or project in two letter code (ISO 3166-1 alpha-2) */
  country: string
  /** The visibility of the organization or project in the Green Globe */
  visibility: 'Public' | 'Unlisted'
  /** The date and time of the creation of the record */
  createdAt: string
  /** Contact email for the organization */
  email?: string
  /** Social media links for the organization */
  socialLinks?: SocialLink[]
  /** Discord server ID for the organization */
  discordId?: string
  /** Donation link for the organization */
  stripeUrl?: string
  /** Number of team members in the organization */
  teamSize?: number
  /** Year the organization was founded */
  foundedYear?: number
  /** Types of ecosystems the organization works in */
  ecosystemTypes?: (
    | 'tropical-rainforest'
    | 'temperate-forest'
    | 'boreal-forest'
    | 'mangrove'
    | 'coral-reef'
    | 'savanna'
    | 'grassland'
    | 'wetland'
    | 'desert'
    | 'alpine'
    | 'marine'
    | 'freshwater'
    | 'urban'
    | 'agroforestry'
    | 'other'
    | (string & {})
  )[]
  /** Species groups the organization focuses on */
  focusSpeciesGroups?: (
    | 'mammals'
    | 'birds'
    | 'reptiles'
    | 'amphibians'
    | 'fish'
    | 'insects'
    | 'arachnids'
    | 'mollusks'
    | 'crustaceans'
    | 'trees'
    | 'shrubs'
    | 'herbs'
    | 'grasses'
    | 'ferns'
    | 'mosses'
    | 'fungi'
    | 'algae'
    | 'coral'
    | 'other'
    | (string & {})
  )[]
  /** Default license for data published by the organization */
  dataLicense?: string
  /** URL to download the organization's data */
  dataDownloadUrl?: string
  /** Description of available data downloads */
  dataDownloadInfo?: string
  /** Description of the organization's funding sources */
  fundingSourcesDescription?: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}

/** A social media link for an organization */
export interface SocialLink {
  $type?: 'app.gainforest.organization.info#socialLink'
  /** The social media platform */
  platform:
    | 'twitter'
    | 'instagram'
    | 'facebook'
    | 'linkedin'
    | 'youtube'
    | 'tiktok'
    | 'github'
    | 'discord'
    | 'telegram'
    | 'other'
    | (string & {})
  /** The URL of the social media profile or page */
  url: string
}

const hashSocialLink = 'socialLink'

export function isSocialLink<V>(v: V) {
  return is$typed(v, id, hashSocialLink)
}

export function validateSocialLink<V>(v: V) {
  return validate<SocialLink & V>(v, id, hashSocialLink)
}
