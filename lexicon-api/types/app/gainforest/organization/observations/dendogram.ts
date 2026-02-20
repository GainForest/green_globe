/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../../util'
import type * as OrgHypercertsDefs from '../../../../org/hypercerts/defs.js'
import type * as AppGainforestCommonDefs from '../../common/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.gainforest.organization.observations.dendogram'

export interface Record {
  $type: 'app.gainforest.organization.observations.dendogram'
  dendogram: OrgHypercertsDefs.SmallBlob
  /** The date and time of the creation of the record */
  createdAt: string
  /** Name or title of the dendogram (e.g., 'Flora Phylogenetic Tree - Site A 2025') */
  name?: string
  description?: AppGainforestCommonDefs.Richtext
  /** AT-URI reference to the site this dendogram represents */
  siteRef?: string
  /** When the phylogenetic analysis was performed */
  analysisDate?: string
  /** Method used to generate the dendogram (e.g., 'Maximum Likelihood with RAxML', 'Neighbor-Joining') */
  analysisMethod?: string
  /** Source of the sequence or trait data used in the analysis */
  dataSource?: string
  /** Number of taxa represented in the dendogram */
  taxonCount?: number
  /** The root taxon of the tree (e.g., 'Plantae') */
  rootTaxon?: string
  /** Type of tree represented in the dendogram */
  treeType?:
    | 'phylogenetic'
    | 'phenetic'
    | 'cladistic'
    | 'functional-trait'
    | 'other'
    | (string & {})
  thumbnail?: AppGainforestCommonDefs.ImageThumbnail
  /** Which taxonomic groups are represented in the dendogram */
  taxonGroups?: (
    | 'flora'
    | 'fauna'
    | 'fungi'
    | 'bacteria'
    | 'archaea'
    | 'protista'
    | 'chromista'
    | (string & {})
  )[]
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
