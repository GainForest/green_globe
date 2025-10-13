/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon'
import { type $Typed, is$typed, maybe$typed } from './util'

export const schemaDict = {
  AppGainforestOrganizationDefaultSite: {
    lexicon: 1,
    id: 'app.gainforest.organization.defaultSite',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of the default site for an organization',
        key: 'literal:self',
        record: {
          type: 'object',
          required: ['site'],
          properties: {
            site: {
              type: 'string',
              format: 'at-uri',
              description:
                'The reference to the default site record in the PDS',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationDefaultSites: {
    lexicon: 1,
    id: 'app.gainforest.organization.defaultSites',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of the default site for an organization',
        key: 'literal:self',
        record: {
          type: 'object',
          required: ['site'],
          properties: {
            site: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI of the default site record (app.gainforest.organization.sites)',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationDefs: {
    lexicon: 1,
    id: 'app.gainforest.organization.defs',
    defs: {
      indexedOrganization: {
        type: 'object',
        required: ['name', 'country', 'did', 'mapPoint'],
        properties: {
          name: {
            type: 'string',
            description: 'The name of the organization',
          },
          country: {
            type: 'string',
            description: 'The country of the organization',
            enum: ['US', 'GB', 'CA', 'AU', 'NZ', 'Other'],
          },
          did: {
            type: 'string',
            format: 'at-uri',
            description: 'The DID of the organization',
          },
          mapPoint: {
            type: 'string',
            description:
              'The centerpoint coordinates of the organization, calculated from the default site and seperated by a comma',
          },
        },
      },
    },
  },
  AppGainforestOrganizationGetIndexedOrganizations: {
    lexicon: 1,
    id: 'app.gainforest.organization.getIndexedOrganizations',
    defs: {
      main: {
        type: 'query',
        description: 'Get all organizations to view initially on map',
        parameters: {
          type: 'params',
          properties: {},
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['organizations'],
            properties: {
              organizations: {
                type: 'array',
                items: {
                  type: 'ref',
                  ref: 'lex:app.gainforest.organization.defs#indexedOrganization',
                },
              },
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationInfo: {
    lexicon: 1,
    id: 'app.gainforest.organization.info',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of an organization or project',
        key: 'literal:self',
        record: {
          type: 'object',
          required: [
            'displayName',
            'shortDescription',
            'longDescription',
            'objectives',
            'startDate',
            'website',
            'country',
            'visibility',
          ],
          properties: {
            displayName: {
              type: 'string',
              description: 'The name of the organization or project',
              minLength: 8,
              maxLength: 255,
            },
            shortDescription: {
              type: 'string',
              description: 'The description of the organization or project',
              minLength: 50,
              maxLength: 2000,
            },
            longDescription: {
              type: 'string',
              description:
                'The long description of the organization or project in markdown',
              minLength: 50,
              maxLength: 5000,
            },
            objectives: {
              type: 'array',
              description: 'The objectives of the organization or project',
              items: {
                type: 'string',
                enum: [
                  'Conservation',
                  'Research',
                  'Education',
                  'Community',
                  'Other',
                ],
              },
            },
            startDate: {
              type: 'string',
              description: 'The start date of the organization or project',
              format: 'datetime',
            },
            website: {
              type: 'string',
              description: 'The website of the organization or project',
              format: 'uri',
            },
            country: {
              type: 'string',
              description:
                'The country of the organization or project in two letter code (ISO 3166-1 alpha-2)',
            },
            visibility: {
              type: 'string',
              description: 'The visibility of the organization or project',
              enum: ['Public', 'Private'],
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationLinks: {
    lexicon: 1,
    id: 'app.gainforest.organization.links',
    defs: {
      main: {
        type: 'record',
        description:
          'External links and references for an organization/project',
        key: 'literal:self',
        record: {
          type: 'object',
          required: [],
          properties: {
            website: {
              type: 'string',
              format: 'uri',
              description: 'Primary website (may duplicate info.website)',
            },
            projectUrl: {
              type: 'string',
              format: 'uri',
              description: 'Project registry or overview URL',
            },
            discordId: {
              type: 'string',
              maxLength: 80,
              description: 'Discord server or channel identifier',
            },
            stripeUrl: {
              type: 'string',
              format: 'uri',
              description: 'Stripe checkout or dashboard URL',
            },
            dataDownloadUrl: {
              type: 'string',
              format: 'uri',
              description: 'Data download URL',
            },
            dataDownloadInfo: {
              type: 'string',
              maxLength: 2000,
              description: 'Description of downloadable data',
            },
            customEnterBtnText: {
              type: 'string',
              maxLength: 120,
              description: 'Custom CTA label for project entry',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationMeasuredTrees: {
    lexicon: 1,
    id: 'app.gainforest.organization.measuredTrees',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of measured trees for an organization',
        key: 'literal:self',
        record: {
          type: 'object',
          required: ['shapefile'],
          properties: {
            shapefile: {
              type: 'string',
              format: 'uri',
              description:
                'The uri pointing to the shapefile of the measured trees',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationMetrics: {
    lexicon: 1,
    id: 'app.gainforest.organization.metrics',
    defs: {
      main: {
        type: 'record',
        description: 'Numeric and status metrics for an organization/project',
        key: 'literal:self',
        record: {
          type: 'object',
          required: [],
          properties: {
            lastCreditPrice: {
              type: 'integer',
              description: 'Last known credit price',
            },
            retirementCarbon: {
              type: 'integer',
              description: 'Total retired carbon (tCO2e)',
            },
            supplyCarbon: {
              type: 'integer',
              description: 'Total supply carbon (tCO2e)',
            },
            onChainRetirementCarbon: {
              type: 'integer',
              description: 'On-chain retired carbon (tCO2e)',
            },
            onChainSupplyCarbon: {
              type: 'integer',
              description: 'On-chain supply carbon (tCO2e)',
            },
            bufferCarbon: {
              type: 'integer',
              description: 'Buffer carbon (tCO2e)',
            },
            claimedCarbonOffset: {
              type: 'integer',
              description: 'Claimed carbon offset (tCO2e)',
            },
            communitySize: {
              type: 'integer',
              description: 'Community size (people)',
            },
            soilCarbon: {
              type: 'integer',
              description: 'Estimated soil carbon (tCO2e)',
            },
            avoidedCarbon: {
              type: 'integer',
              description: 'Avoided carbon (tCO2e)',
            },
            isExternalProject: {
              type: 'boolean',
              description: 'Whether the project is externally managed',
            },
            hasReferenceArea: {
              type: 'boolean',
              description: 'Whether a reference area is available',
            },
            kyc: {
              type: 'boolean',
              description: 'KYC completed',
            },
            monitorStrategy: {
              type: 'string',
              maxLength: 200,
              description: 'Monitoring strategy summary',
            },
            restorationType: {
              type: 'string',
              maxLength: 200,
              description: 'Restoration type',
            },
            isProjectOfTheMonth: {
              type: 'boolean',
              description: 'Highlighted as project of the month',
            },
            endDate: {
              type: 'string',
              format: 'datetime',
              description: 'Project end date (if applicable)',
            },
            score: {
              type: 'string',
              maxLength: 200,
              description: 'Optional score label',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationPredictionFlora: {
    lexicon: 1,
    id: 'app.gainforest.organization.prediction.flora',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of flora prediction for an organization',
        key: 'tid',
        record: {
          type: 'object',
          required: ['tbd'],
          properties: {
            tbd: {
              type: 'string',
              description: 'TBD',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationRegistry: {
    lexicon: 1,
    id: 'app.gainforest.organization.registry',
    defs: {
      main: {
        type: 'record',
        description:
          'Legacy identifiers and registry references for an organization/project',
        key: 'literal:self',
        record: {
          type: 'object',
          required: [],
          properties: {
            verraId: {
              type: 'integer',
              description: 'Verra registry project ID',
            },
            methodologyId: {
              type: 'integer',
              description: 'Methodology ID (legacy)',
            },
            verifierId: {
              type: 'integer',
              description: 'Verifier ID (legacy)',
            },
            proponentId: {
              type: 'integer',
              description: 'Proponent ID (legacy)',
            },
            organizationId: {
              type: 'integer',
              description: 'Organization ID (legacy)',
            },
            walletId: {
              type: 'integer',
              description: 'Wallet ID (legacy)',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationSite: {
    lexicon: 1,
    id: 'app.gainforest.organization.site',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of a site for an organization',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'lat', 'lon', 'area'],
          properties: {
            name: {
              type: 'string',
              description: 'The name of the site',
            },
            lat: {
              type: 'integer',
              description: 'The latitude of the centerpoint of the site',
            },
            lon: {
              type: 'integer',
              description: 'The longitude of the centerpoint of the site',
            },
            area: {
              type: 'integer',
              description: 'The area of the site in hectares',
            },
            shapefile: {
              type: 'string',
              format: 'uri',
              description: 'The uri pointing to the shapefile of the site',
            },
            trees: {
              type: 'blob',
              accept: ['application/geo+json', 'application/json'],
              maxSize: 10485760,
              description:
                'GeoJSON blob containing tree planting data for this site (max 10MB)',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationSites: {
    lexicon: 1,
    id: 'app.gainforest.organization.sites',
    defs: {
      main: {
        type: 'record',
        description:
          'A site boundary for an organization, defined by a GeoJSON shapefile',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'The name of the site',
            },
            lat: {
              type: 'integer',
              description: 'The latitude of the centerpoint of the site',
            },
            lon: {
              type: 'integer',
              description: 'The longitude of the centerpoint of the site',
            },
            area: {
              type: 'integer',
              description: 'The area of the site in hectares',
            },
            boundary: {
              type: 'string',
              format: 'uri',
              description:
                'IPFS URI of the GeoJSON file defining the site boundary',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationTags: {
    lexicon: 1,
    id: 'app.gainforest.organization.tags',
    defs: {
      main: {
        type: 'record',
        description:
          'Categorical tags and qualitative attributes for an organization/project',
        key: 'literal:self',
        record: {
          type: 'object',
          required: [],
          properties: {
            category: {
              type: 'string',
              maxLength: 120,
              description: 'Primary category label',
            },
            sdgGoals: {
              type: 'array',
              description: 'UN SDG goal numbers (1-17)',
              items: {
                type: 'integer',
                minimum: 1,
                maximum: 17,
              },
            },
            proponents: {
              type: 'array',
              description: 'List of proponent organization names',
              items: {
                type: 'string',
                maxLength: 160,
              },
            },
            catalogueReason: {
              type: 'string',
              maxLength: 500,
              description: 'Reason or label for catalog inclusion',
            },
            potentialIssues: {
              type: 'array',
              description: 'Potential issues or warnings',
              items: {
                type: 'string',
                maxLength: 500,
              },
            },
            objectiveRaw: {
              type: 'string',
              maxLength: 2000,
              description: 'Original objective text from source system',
            },
          },
        },
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      }
}

export const ids = {
  AppGainforestOrganizationDefaultSite:
    'app.gainforest.organization.defaultSite',
  AppGainforestOrganizationDefaultSites:
    'app.gainforest.organization.defaultSites',
  AppGainforestOrganizationDefs: 'app.gainforest.organization.defs',
  AppGainforestOrganizationGetIndexedOrganizations:
    'app.gainforest.organization.getIndexedOrganizations',
  AppGainforestOrganizationInfo: 'app.gainforest.organization.info',
  AppGainforestOrganizationLinks: 'app.gainforest.organization.links',
  AppGainforestOrganizationMeasuredTrees:
    'app.gainforest.organization.measuredTrees',
  AppGainforestOrganizationMetrics: 'app.gainforest.organization.metrics',
  AppGainforestOrganizationPredictionFlora:
    'app.gainforest.organization.prediction.flora',
  AppGainforestOrganizationRegistry: 'app.gainforest.organization.registry',
  AppGainforestOrganizationSite: 'app.gainforest.organization.site',
  AppGainforestOrganizationSites: 'app.gainforest.organization.sites',
  AppGainforestOrganizationTags: 'app.gainforest.organization.tags',
} as const
