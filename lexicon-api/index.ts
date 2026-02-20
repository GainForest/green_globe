import {
    ComAtprotoRepoListRecords,
    ComAtprotoRepoGetRecord,
    ComAtprotoRepoCreateRecord,
    ComAtprotoRepoPutRecord,
    ComAtprotoRepoDeleteRecord,
  } from "@atproto/api";
/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  XrpcClient,
  type FetchHandler,
  type FetchHandlerOptions,
} from '@atproto/xrpc'
import { schemas } from './lexicons.js'
import { CID } from 'multiformats/cid'
import { type OmitKey, type Un$Typed } from './util.js'
import * as AppBskyRichtextFacet from './types/app/bsky/richtext/facet.js'
import * as AppGainforestCommonDefs from './types/app/gainforest/common/defs.js'
import * as AppGainforestDwcDefs from './types/app/gainforest/dwc/defs.js'
import * as AppGainforestDwcEvent from './types/app/gainforest/dwc/event.js'
import * as AppGainforestDwcMeasurement from './types/app/gainforest/dwc/measurement.js'
import * as AppGainforestDwcOccurrence from './types/app/gainforest/dwc/occurrence.js'
import * as AppGainforestEvaluatorDefs from './types/app/gainforest/evaluator/defs.js'
import * as AppGainforestEvaluatorEvaluation from './types/app/gainforest/evaluator/evaluation.js'
import * as AppGainforestEvaluatorService from './types/app/gainforest/evaluator/service.js'
import * as AppGainforestEvaluatorSubscription from './types/app/gainforest/evaluator/subscription.js'
import * as AppGainforestOrganizationDefaultSite from './types/app/gainforest/organization/defaultSite.js'
import * as AppGainforestOrganizationDonation from './types/app/gainforest/organization/donation.js'
import * as AppGainforestOrganizationGetIndexedOrganizations from './types/app/gainforest/organization/getIndexedOrganizations.js'
import * as AppGainforestOrganizationInfo from './types/app/gainforest/organization/info.js'
import * as AppGainforestOrganizationLayer from './types/app/gainforest/organization/layer.js'
import * as AppGainforestOrganizationMember from './types/app/gainforest/organization/member.js'
import * as AppGainforestOrganizationObservationsDendogram from './types/app/gainforest/organization/observations/dendogram.js'
import * as AppGainforestOrganizationObservationsFauna from './types/app/gainforest/organization/observations/fauna.js'
import * as AppGainforestOrganizationObservationsFlora from './types/app/gainforest/organization/observations/flora.js'
import * as AppGainforestOrganizationObservationsMeasuredTreesCluster from './types/app/gainforest/organization/observations/measuredTreesCluster.js'
import * as AppGainforestOrganizationPredictionsFauna from './types/app/gainforest/organization/predictions/fauna.js'
import * as AppGainforestOrganizationPredictionsFlora from './types/app/gainforest/organization/predictions/flora.js'
import * as AppGainforestOrganizationRecordingsAudio from './types/app/gainforest/organization/recordings/audio.js'
import * as AppGainforestOrganizationSite from './types/app/gainforest/organization/site.js'
import * as ComAtprotoRepoStrongRef from './types/com/atproto/repo/strongRef.js'
import * as OrgHypercertsDefs from './types/org/hypercerts/defs.js'
import * as PubLeafletBlocksBlockquote from './types/pub/leaflet/blocks/blockquote.js'
import * as PubLeafletBlocksBskyPost from './types/pub/leaflet/blocks/bskyPost.js'
import * as PubLeafletBlocksButton from './types/pub/leaflet/blocks/button.js'
import * as PubLeafletBlocksCode from './types/pub/leaflet/blocks/code.js'
import * as PubLeafletBlocksHeader from './types/pub/leaflet/blocks/header.js'
import * as PubLeafletBlocksHorizontalRule from './types/pub/leaflet/blocks/horizontalRule.js'
import * as PubLeafletBlocksIframe from './types/pub/leaflet/blocks/iframe.js'
import * as PubLeafletBlocksImage from './types/pub/leaflet/blocks/image.js'
import * as PubLeafletBlocksMath from './types/pub/leaflet/blocks/math.js'
import * as PubLeafletBlocksPage from './types/pub/leaflet/blocks/page.js'
import * as PubLeafletBlocksPoll from './types/pub/leaflet/blocks/poll.js'
import * as PubLeafletBlocksText from './types/pub/leaflet/blocks/text.js'
import * as PubLeafletBlocksUnorderedList from './types/pub/leaflet/blocks/unorderedList.js'
import * as PubLeafletBlocksWebsite from './types/pub/leaflet/blocks/website.js'
import * as PubLeafletPagesLinearDocument from './types/pub/leaflet/pages/linearDocument.js'
import * as PubLeafletRichtextFacet from './types/pub/leaflet/richtext/facet.js'

export * as AppBskyRichtextFacet from './types/app/bsky/richtext/facet.js'
export * as AppGainforestCommonDefs from './types/app/gainforest/common/defs.js'
export * as AppGainforestDwcDefs from './types/app/gainforest/dwc/defs.js'
export * as AppGainforestDwcEvent from './types/app/gainforest/dwc/event.js'
export * as AppGainforestDwcMeasurement from './types/app/gainforest/dwc/measurement.js'
export * as AppGainforestDwcOccurrence from './types/app/gainforest/dwc/occurrence.js'
export * as AppGainforestEvaluatorDefs from './types/app/gainforest/evaluator/defs.js'
export * as AppGainforestEvaluatorEvaluation from './types/app/gainforest/evaluator/evaluation.js'
export * as AppGainforestEvaluatorService from './types/app/gainforest/evaluator/service.js'
export * as AppGainforestEvaluatorSubscription from './types/app/gainforest/evaluator/subscription.js'
export * as AppGainforestOrganizationDefaultSite from './types/app/gainforest/organization/defaultSite.js'
export * as AppGainforestOrganizationDonation from './types/app/gainforest/organization/donation.js'
export * as AppGainforestOrganizationGetIndexedOrganizations from './types/app/gainforest/organization/getIndexedOrganizations.js'
export * as AppGainforestOrganizationInfo from './types/app/gainforest/organization/info.js'
export * as AppGainforestOrganizationLayer from './types/app/gainforest/organization/layer.js'
export * as AppGainforestOrganizationMember from './types/app/gainforest/organization/member.js'
export * as AppGainforestOrganizationObservationsDendogram from './types/app/gainforest/organization/observations/dendogram.js'
export * as AppGainforestOrganizationObservationsFauna from './types/app/gainforest/organization/observations/fauna.js'
export * as AppGainforestOrganizationObservationsFlora from './types/app/gainforest/organization/observations/flora.js'
export * as AppGainforestOrganizationObservationsMeasuredTreesCluster from './types/app/gainforest/organization/observations/measuredTreesCluster.js'
export * as AppGainforestOrganizationPredictionsFauna from './types/app/gainforest/organization/predictions/fauna.js'
export * as AppGainforestOrganizationPredictionsFlora from './types/app/gainforest/organization/predictions/flora.js'
export * as AppGainforestOrganizationRecordingsAudio from './types/app/gainforest/organization/recordings/audio.js'
export * as AppGainforestOrganizationSite from './types/app/gainforest/organization/site.js'
export * as ComAtprotoRepoStrongRef from './types/com/atproto/repo/strongRef.js'
export * as OrgHypercertsDefs from './types/org/hypercerts/defs.js'
export * as PubLeafletBlocksBlockquote from './types/pub/leaflet/blocks/blockquote.js'
export * as PubLeafletBlocksBskyPost from './types/pub/leaflet/blocks/bskyPost.js'
export * as PubLeafletBlocksButton from './types/pub/leaflet/blocks/button.js'
export * as PubLeafletBlocksCode from './types/pub/leaflet/blocks/code.js'
export * as PubLeafletBlocksHeader from './types/pub/leaflet/blocks/header.js'
export * as PubLeafletBlocksHorizontalRule from './types/pub/leaflet/blocks/horizontalRule.js'
export * as PubLeafletBlocksIframe from './types/pub/leaflet/blocks/iframe.js'
export * as PubLeafletBlocksImage from './types/pub/leaflet/blocks/image.js'
export * as PubLeafletBlocksMath from './types/pub/leaflet/blocks/math.js'
export * as PubLeafletBlocksPage from './types/pub/leaflet/blocks/page.js'
export * as PubLeafletBlocksPoll from './types/pub/leaflet/blocks/poll.js'
export * as PubLeafletBlocksText from './types/pub/leaflet/blocks/text.js'
export * as PubLeafletBlocksUnorderedList from './types/pub/leaflet/blocks/unorderedList.js'
export * as PubLeafletBlocksWebsite from './types/pub/leaflet/blocks/website.js'
export * as PubLeafletPagesLinearDocument from './types/pub/leaflet/pages/linearDocument.js'
export * as PubLeafletRichtextFacet from './types/pub/leaflet/richtext/facet.js'

export const PUB_LEAFLET_PAGES = {
  LinearDocumentTextAlignLeft: 'pub.leaflet.pages.linearDocument#textAlignLeft',
  LinearDocumentTextAlignCenter:
    'pub.leaflet.pages.linearDocument#textAlignCenter',
  LinearDocumentTextAlignRight:
    'pub.leaflet.pages.linearDocument#textAlignRight',
  LinearDocumentTextAlignJustify:
    'pub.leaflet.pages.linearDocument#textAlignJustify',
}

export class AtpBaseClient extends XrpcClient {
  app: AppNS
  com: ComNS
  pub: PubNS

  constructor(options: FetchHandler | FetchHandlerOptions) {
    super(options, schemas)
    this.app = new AppNS(this)
    this.com = new ComNS(this)
    this.pub = new PubNS(this)
  }

  /** @deprecated use `this` instead */
  get xrpc(): XrpcClient {
    return this
  }
}

export class AppNS {
  _client: XrpcClient
  bsky: AppBskyNS
  gainforest: AppGainforestNS

  constructor(client: XrpcClient) {
    this._client = client
    this.bsky = new AppBskyNS(client)
    this.gainforest = new AppGainforestNS(client)
  }
}

export class AppBskyNS {
  _client: XrpcClient
  richtext: AppBskyRichtextNS

  constructor(client: XrpcClient) {
    this._client = client
    this.richtext = new AppBskyRichtextNS(client)
  }
}

export class AppBskyRichtextNS {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }
}

export class AppGainforestNS {
  _client: XrpcClient
  dwc: AppGainforestDwcNS
  evaluator: AppGainforestEvaluatorNS
  organization: AppGainforestOrganizationNS

  constructor(client: XrpcClient) {
    this._client = client
    this.dwc = new AppGainforestDwcNS(client)
    this.evaluator = new AppGainforestEvaluatorNS(client)
    this.organization = new AppGainforestOrganizationNS(client)
  }
}

export class AppGainforestDwcNS {
  _client: XrpcClient
  event: AppGainforestDwcEventRecord
  measurement: AppGainforestDwcMeasurementRecord
  occurrence: AppGainforestDwcOccurrenceRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.event = new AppGainforestDwcEventRecord(client)
    this.measurement = new AppGainforestDwcMeasurementRecord(client)
    this.occurrence = new AppGainforestDwcOccurrenceRecord(client)
  }
}

export class AppGainforestDwcEventRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestDwcEvent.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.dwc.event',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestDwcEvent.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.dwc.event',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestDwcEvent.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.dwc.event'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestDwcEvent.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.dwc.event'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.dwc.event', ...params },
      { headers },
    )
  }
}

export class AppGainforestDwcMeasurementRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestDwcMeasurement.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.dwc.measurement',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestDwcMeasurement.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.dwc.measurement',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestDwcMeasurement.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.dwc.measurement'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestDwcMeasurement.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.dwc.measurement'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.dwc.measurement', ...params },
      { headers },
    )
  }
}

export class AppGainforestDwcOccurrenceRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestDwcOccurrence.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.dwc.occurrence',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestDwcOccurrence.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.dwc.occurrence',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestDwcOccurrence.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.dwc.occurrence'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestDwcOccurrence.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.dwc.occurrence'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.dwc.occurrence', ...params },
      { headers },
    )
  }
}

export class AppGainforestEvaluatorNS {
  _client: XrpcClient
  evaluation: AppGainforestEvaluatorEvaluationRecord
  service: AppGainforestEvaluatorServiceRecord
  subscription: AppGainforestEvaluatorSubscriptionRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.evaluation = new AppGainforestEvaluatorEvaluationRecord(client)
    this.service = new AppGainforestEvaluatorServiceRecord(client)
    this.subscription = new AppGainforestEvaluatorSubscriptionRecord(client)
  }
}

export class AppGainforestEvaluatorEvaluationRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestEvaluatorEvaluation.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.evaluator.evaluation',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestEvaluatorEvaluation.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.evaluator.evaluation',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestEvaluatorEvaluation.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.evaluator.evaluation'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestEvaluatorEvaluation.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.evaluator.evaluation'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.evaluator.evaluation', ...params },
      { headers },
    )
  }
}

export class AppGainforestEvaluatorServiceRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestEvaluatorService.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.evaluator.service',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestEvaluatorService.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.evaluator.service',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestEvaluatorService.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.evaluator.service'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      {
        collection,
        rkey: 'self',
        ...params,
        record: { ...record, $type: collection },
      },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestEvaluatorService.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.evaluator.service'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.evaluator.service', ...params },
      { headers },
    )
  }
}

export class AppGainforestEvaluatorSubscriptionRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestEvaluatorSubscription.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.evaluator.subscription',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestEvaluatorSubscription.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.evaluator.subscription',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestEvaluatorSubscription.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.evaluator.subscription'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestEvaluatorSubscription.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.evaluator.subscription'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.evaluator.subscription', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationNS {
  _client: XrpcClient
  defaultSite: AppGainforestOrganizationDefaultSiteRecord
  donation: AppGainforestOrganizationDonationRecord
  info: AppGainforestOrganizationInfoRecord
  layer: AppGainforestOrganizationLayerRecord
  member: AppGainforestOrganizationMemberRecord
  site: AppGainforestOrganizationSiteRecord
  observations: AppGainforestOrganizationObservationsNS
  predictions: AppGainforestOrganizationPredictionsNS
  recordings: AppGainforestOrganizationRecordingsNS

  constructor(client: XrpcClient) {
    this._client = client
    this.observations = new AppGainforestOrganizationObservationsNS(client)
    this.predictions = new AppGainforestOrganizationPredictionsNS(client)
    this.recordings = new AppGainforestOrganizationRecordingsNS(client)
    this.defaultSite = new AppGainforestOrganizationDefaultSiteRecord(client)
    this.donation = new AppGainforestOrganizationDonationRecord(client)
    this.info = new AppGainforestOrganizationInfoRecord(client)
    this.layer = new AppGainforestOrganizationLayerRecord(client)
    this.member = new AppGainforestOrganizationMemberRecord(client)
    this.site = new AppGainforestOrganizationSiteRecord(client)
  }

  getIndexedOrganizations(
    params?: AppGainforestOrganizationGetIndexedOrganizations.QueryParams,
    opts?: AppGainforestOrganizationGetIndexedOrganizations.CallOptions,
  ): Promise<AppGainforestOrganizationGetIndexedOrganizations.Response> {
    return this._client.call(
      'app.gainforest.organization.getIndexedOrganizations',
      params,
      undefined,
      opts,
    )
  }
}

export class AppGainforestOrganizationObservationsNS {
  _client: XrpcClient
  dendogram: AppGainforestOrganizationObservationsDendogramRecord
  fauna: AppGainforestOrganizationObservationsFaunaRecord
  flora: AppGainforestOrganizationObservationsFloraRecord
  measuredTreesCluster: AppGainforestOrganizationObservationsMeasuredTreesClusterRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.dendogram = new AppGainforestOrganizationObservationsDendogramRecord(
      client,
    )
    this.fauna = new AppGainforestOrganizationObservationsFaunaRecord(client)
    this.flora = new AppGainforestOrganizationObservationsFloraRecord(client)
    this.measuredTreesCluster =
      new AppGainforestOrganizationObservationsMeasuredTreesClusterRecord(
        client,
      )
  }
}

export class AppGainforestOrganizationObservationsDendogramRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: {
      uri: string
      value: AppGainforestOrganizationObservationsDendogram.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.observations.dendogram',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationObservationsDendogram.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.observations.dendogram',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationObservationsDendogram.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.observations.dendogram'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      {
        collection,
        rkey: 'self',
        ...params,
        record: { ...record, $type: collection },
      },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationObservationsDendogram.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.observations.dendogram'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      {
        collection: 'app.gainforest.organization.observations.dendogram',
        ...params,
      },
      { headers },
    )
  }
}

export class AppGainforestOrganizationObservationsFaunaRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: {
      uri: string
      value: AppGainforestOrganizationObservationsFauna.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.observations.fauna',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationObservationsFauna.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.observations.fauna',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationObservationsFauna.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.observations.fauna'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationObservationsFauna.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.observations.fauna'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      {
        collection: 'app.gainforest.organization.observations.fauna',
        ...params,
      },
      { headers },
    )
  }
}

export class AppGainforestOrganizationObservationsFloraRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: {
      uri: string
      value: AppGainforestOrganizationObservationsFlora.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.observations.flora',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationObservationsFlora.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.observations.flora',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationObservationsFlora.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.observations.flora'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationObservationsFlora.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.observations.flora'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      {
        collection: 'app.gainforest.organization.observations.flora',
        ...params,
      },
      { headers },
    )
  }
}

export class AppGainforestOrganizationObservationsMeasuredTreesClusterRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: {
      uri: string
      value: AppGainforestOrganizationObservationsMeasuredTreesCluster.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection:
        'app.gainforest.organization.observations.measuredTreesCluster',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationObservationsMeasuredTreesCluster.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection:
        'app.gainforest.organization.observations.measuredTreesCluster',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationObservationsMeasuredTreesCluster.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection =
      'app.gainforest.organization.observations.measuredTreesCluster'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationObservationsMeasuredTreesCluster.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection =
      'app.gainforest.organization.observations.measuredTreesCluster'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      {
        collection:
          'app.gainforest.organization.observations.measuredTreesCluster',
        ...params,
      },
      { headers },
    )
  }
}

export class AppGainforestOrganizationPredictionsNS {
  _client: XrpcClient
  fauna: AppGainforestOrganizationPredictionsFaunaRecord
  flora: AppGainforestOrganizationPredictionsFloraRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.fauna = new AppGainforestOrganizationPredictionsFaunaRecord(client)
    this.flora = new AppGainforestOrganizationPredictionsFloraRecord(client)
  }
}

export class AppGainforestOrganizationPredictionsFaunaRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: {
      uri: string
      value: AppGainforestOrganizationPredictionsFauna.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.predictions.fauna',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationPredictionsFauna.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.predictions.fauna',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationPredictionsFauna.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.predictions.fauna'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationPredictionsFauna.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.predictions.fauna'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      {
        collection: 'app.gainforest.organization.predictions.fauna',
        ...params,
      },
      { headers },
    )
  }
}

export class AppGainforestOrganizationPredictionsFloraRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: {
      uri: string
      value: AppGainforestOrganizationPredictionsFlora.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.predictions.flora',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationPredictionsFlora.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.predictions.flora',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationPredictionsFlora.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.predictions.flora'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationPredictionsFlora.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.predictions.flora'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      {
        collection: 'app.gainforest.organization.predictions.flora',
        ...params,
      },
      { headers },
    )
  }
}

export class AppGainforestOrganizationRecordingsNS {
  _client: XrpcClient
  audio: AppGainforestOrganizationRecordingsAudioRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.audio = new AppGainforestOrganizationRecordingsAudioRecord(client)
  }
}

export class AppGainforestOrganizationRecordingsAudioRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: {
      uri: string
      value: AppGainforestOrganizationRecordingsAudio.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.recordings.audio',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationRecordingsAudio.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.recordings.audio',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationRecordingsAudio.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.recordings.audio'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationRecordingsAudio.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.recordings.audio'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.organization.recordings.audio', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationDefaultSiteRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: {
      uri: string
      value: AppGainforestOrganizationDefaultSite.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.defaultSite',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationDefaultSite.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.defaultSite',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationDefaultSite.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.defaultSite'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      {
        collection,
        rkey: 'self',
        ...params,
        record: { ...record, $type: collection },
      },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationDefaultSite.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.defaultSite'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.organization.defaultSite', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationDonationRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationDonation.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.donation',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationDonation.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.donation',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationDonation.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.donation'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationDonation.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.donation'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.organization.donation', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationInfoRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationInfo.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.info',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationInfo.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.info',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationInfo.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.info'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      {
        collection,
        rkey: 'self',
        ...params,
        record: { ...record, $type: collection },
      },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationInfo.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.info'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.organization.info', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationLayerRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationLayer.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.layer',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationLayer.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.layer',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationLayer.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.layer'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationLayer.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.layer'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.organization.layer', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationMemberRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationMember.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.member',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationMember.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.member',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationMember.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.member'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationMember.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.member'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.organization.member', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationSiteRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationSite.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.site',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationSite.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.site',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationSite.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.site'
    const res = await this._client.call(
      'com.atproto.repo.createRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationSite.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.site'
    const res = await this._client.call(
      'com.atproto.repo.putRecord',
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: 'application/json', headers },
    )
    return res.data
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      'com.atproto.repo.deleteRecord',
      undefined,
      { collection: 'app.gainforest.organization.site', ...params },
      { headers },
    )
  }
}

export class ComNS {
  _client: XrpcClient
  atproto: ComAtprotoNS

  constructor(client: XrpcClient) {
    this._client = client
    this.atproto = new ComAtprotoNS(client)
  }
}

export class ComAtprotoNS {
  _client: XrpcClient
  repo: ComAtprotoRepoNS

  constructor(client: XrpcClient) {
    this._client = client
    this.repo = new ComAtprotoRepoNS(client)
  }
}

export class ComAtprotoRepoNS {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }
}

export class PubNS {
  _client: XrpcClient
  leaflet: PubLeafletNS

  constructor(client: XrpcClient) {
    this._client = client
    this.leaflet = new PubLeafletNS(client)
  }
}

export class PubLeafletNS {
  _client: XrpcClient
  blocks: PubLeafletBlocksNS
  pages: PubLeafletPagesNS
  richtext: PubLeafletRichtextNS

  constructor(client: XrpcClient) {
    this._client = client
    this.blocks = new PubLeafletBlocksNS(client)
    this.pages = new PubLeafletPagesNS(client)
    this.richtext = new PubLeafletRichtextNS(client)
  }
}

export class PubLeafletBlocksNS {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }
}

export class PubLeafletPagesNS {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }
}

export class PubLeafletRichtextNS {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }
}
