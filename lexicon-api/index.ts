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
import * as AppGainforestOrganizationDefaultSite from './types/app/gainforest/organization/defaultSite.js'
import * as AppGainforestOrganizationDefaultSites from './types/app/gainforest/organization/defaultSites.js'
import * as AppGainforestOrganizationDefs from './types/app/gainforest/organization/defs.js'
import * as AppGainforestOrganizationGetIndexedOrganizations from './types/app/gainforest/organization/getIndexedOrganizations.js'
import * as AppGainforestOrganizationInfo from './types/app/gainforest/organization/info.js'
import * as AppGainforestOrganizationLinks from './types/app/gainforest/organization/links.js'
import * as AppGainforestOrganizationMeasuredTrees from './types/app/gainforest/organization/measuredTrees.js'
import * as AppGainforestOrganizationMetrics from './types/app/gainforest/organization/metrics.js'
import * as AppGainforestOrganizationPredictionFlora from './types/app/gainforest/organization/prediction/flora.js'
import * as AppGainforestOrganizationRegistry from './types/app/gainforest/organization/registry.js'
import * as AppGainforestOrganizationSite from './types/app/gainforest/organization/site.js'
import * as AppGainforestOrganizationSites from './types/app/gainforest/organization/sites.js'
import * as AppGainforestOrganizationTags from './types/app/gainforest/organization/tags.js'

export * as AppGainforestOrganizationDefaultSite from './types/app/gainforest/organization/defaultSite.js'
export * as AppGainforestOrganizationDefaultSites from './types/app/gainforest/organization/defaultSites.js'
export * as AppGainforestOrganizationDefs from './types/app/gainforest/organization/defs.js'
export * as AppGainforestOrganizationGetIndexedOrganizations from './types/app/gainforest/organization/getIndexedOrganizations.js'
export * as AppGainforestOrganizationInfo from './types/app/gainforest/organization/info.js'
export * as AppGainforestOrganizationLinks from './types/app/gainforest/organization/links.js'
export * as AppGainforestOrganizationMeasuredTrees from './types/app/gainforest/organization/measuredTrees.js'
export * as AppGainforestOrganizationMetrics from './types/app/gainforest/organization/metrics.js'
export * as AppGainforestOrganizationPredictionFlora from './types/app/gainforest/organization/prediction/flora.js'
export * as AppGainforestOrganizationRegistry from './types/app/gainforest/organization/registry.js'
export * as AppGainforestOrganizationSite from './types/app/gainforest/organization/site.js'
export * as AppGainforestOrganizationSites from './types/app/gainforest/organization/sites.js'
export * as AppGainforestOrganizationTags from './types/app/gainforest/organization/tags.js'

export class AtpBaseClient extends XrpcClient {
  app: AppNS

  constructor(options: FetchHandler | FetchHandlerOptions) {
    super(options, schemas)
    this.app = new AppNS(this)
  }

  /** @deprecated use `this` instead */
  get xrpc(): XrpcClient {
    return this
  }
}

export class AppNS {
  _client: XrpcClient
  gainforest: AppGainforestNS

  constructor(client: XrpcClient) {
    this._client = client
    this.gainforest = new AppGainforestNS(client)
  }
}

export class AppGainforestNS {
  _client: XrpcClient
  organization: AppGainforestOrganizationNS

  constructor(client: XrpcClient) {
    this._client = client
    this.organization = new AppGainforestOrganizationNS(client)
  }
}

export class AppGainforestOrganizationNS {
  _client: XrpcClient
  defaultSite: AppGainforestOrganizationDefaultSiteRecord
  defaultSites: AppGainforestOrganizationDefaultSitesRecord
  info: AppGainforestOrganizationInfoRecord
  links: AppGainforestOrganizationLinksRecord
  measuredTrees: AppGainforestOrganizationMeasuredTreesRecord
  metrics: AppGainforestOrganizationMetricsRecord
  registry: AppGainforestOrganizationRegistryRecord
  site: AppGainforestOrganizationSiteRecord
  sites: AppGainforestOrganizationSitesRecord
  tags: AppGainforestOrganizationTagsRecord
  prediction: AppGainforestOrganizationPredictionNS

  constructor(client: XrpcClient) {
    this._client = client
    this.prediction = new AppGainforestOrganizationPredictionNS(client)
    this.defaultSite = new AppGainforestOrganizationDefaultSiteRecord(client)
    this.defaultSites = new AppGainforestOrganizationDefaultSitesRecord(client)
    this.info = new AppGainforestOrganizationInfoRecord(client)
    this.links = new AppGainforestOrganizationLinksRecord(client)
    this.measuredTrees = new AppGainforestOrganizationMeasuredTreesRecord(
      client,
    )
    this.metrics = new AppGainforestOrganizationMetricsRecord(client)
    this.registry = new AppGainforestOrganizationRegistryRecord(client)
    this.site = new AppGainforestOrganizationSiteRecord(client)
    this.sites = new AppGainforestOrganizationSitesRecord(client)
    this.tags = new AppGainforestOrganizationTagsRecord(client)
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

export class AppGainforestOrganizationPredictionNS {
  _client: XrpcClient
  flora: AppGainforestOrganizationPredictionFloraRecord

  constructor(client: XrpcClient) {
    this._client = client
    this.flora = new AppGainforestOrganizationPredictionFloraRecord(client)
  }
}

export class AppGainforestOrganizationPredictionFloraRecord {
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
      value: AppGainforestOrganizationPredictionFlora.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.prediction.flora',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationPredictionFlora.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.prediction.flora',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationPredictionFlora.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.prediction.flora'
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
    record: Un$Typed<AppGainforestOrganizationPredictionFlora.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.prediction.flora'
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
      { collection: 'app.gainforest.organization.prediction.flora', ...params },
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

export class AppGainforestOrganizationDefaultSitesRecord {
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
      value: AppGainforestOrganizationDefaultSites.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.defaultSites',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationDefaultSites.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.defaultSites',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationDefaultSites.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.defaultSites'
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
    record: Un$Typed<AppGainforestOrganizationDefaultSites.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.defaultSites'
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
      { collection: 'app.gainforest.organization.defaultSites', ...params },
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

export class AppGainforestOrganizationLinksRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationLinks.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.links',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationLinks.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.links',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationLinks.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.links'
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
    record: Un$Typed<AppGainforestOrganizationLinks.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.links'
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
      { collection: 'app.gainforest.organization.links', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationMeasuredTreesRecord {
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
      value: AppGainforestOrganizationMeasuredTrees.Record
    }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.measuredTrees',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationMeasuredTrees.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.measuredTrees',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationMeasuredTrees.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.measuredTrees'
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
    record: Un$Typed<AppGainforestOrganizationMeasuredTrees.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.measuredTrees'
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
      { collection: 'app.gainforest.organization.measuredTrees', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationMetricsRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationMetrics.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.metrics',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationMetrics.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.metrics',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationMetrics.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.metrics'
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
    record: Un$Typed<AppGainforestOrganizationMetrics.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.metrics'
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
      { collection: 'app.gainforest.organization.metrics', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationRegistryRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationRegistry.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.registry',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationRegistry.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.registry',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationRegistry.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.registry'
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
    record: Un$Typed<AppGainforestOrganizationRegistry.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.registry'
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
      { collection: 'app.gainforest.organization.registry', ...params },
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

export class AppGainforestOrganizationSitesRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationSites.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.sites',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationSites.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.sites',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationSites.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.sites'
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
    record: Un$Typed<AppGainforestOrganizationSites.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.sites'
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
      { collection: 'app.gainforest.organization.sites', ...params },
      { headers },
    )
  }
}

export class AppGainforestOrganizationTagsRecord {
  _client: XrpcClient

  constructor(client: XrpcClient) {
    this._client = client
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, 'collection'>,
  ): Promise<{
    cursor?: string
    records: { uri: string; value: AppGainforestOrganizationTags.Record }[]
  }> {
    const res = await this._client.call('com.atproto.repo.listRecords', {
      collection: 'app.gainforest.organization.tags',
      ...params,
    })
    return res.data
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, 'collection'>,
  ): Promise<{
    uri: string
    cid: string
    value: AppGainforestOrganizationTags.Record
  }> {
    const res = await this._client.call('com.atproto.repo.getRecord', {
      collection: 'app.gainforest.organization.tags',
      ...params,
    })
    return res.data
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      'collection' | 'record'
    >,
    record: Un$Typed<AppGainforestOrganizationTags.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.tags'
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
    record: Un$Typed<AppGainforestOrganizationTags.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = 'app.gainforest.organization.tags'
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
      { collection: 'app.gainforest.organization.tags', ...params },
      { headers },
    )
  }
}
