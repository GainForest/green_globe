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
            coverImage: {
              type: 'blob',
              description: 'The cover image of the organization or project',
              accept: ['image/*'],
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
            coverImage: {
              type: 'blob',
              accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
              maxSize: 5242880,
              description: 'Cover image blob for the organization (max 5MB)',
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
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'The name of the site',
            },
            lat: {
              type: 'string',
              description:
                'Latitude of the site centerpoint as a decimal string',
            },
            lon: {
              type: 'string',
              description:
                'Longitude of the site centerpoint as a decimal string',
            },
            area: {
              type: 'string',
              description: 'Area of the site in hectares as a decimal string',
            },
            boundary: {
              type: 'string',
              format: 'uri',
              description:
                'The URI pointing to the GeoJSON boundary of the site',
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
  AppGainforestOrganizationDefs: 'app.gainforest.organization.defs',
  AppGainforestOrganizationGetIndexedOrganizations:
    'app.gainforest.organization.getIndexedOrganizations',
  AppGainforestOrganizationInfo: 'app.gainforest.organization.info',
  AppGainforestOrganizationMeasuredTrees:
    'app.gainforest.organization.measuredTrees',
  AppGainforestOrganizationPredictionFlora:
    'app.gainforest.organization.prediction.flora',
  AppGainforestOrganizationSite: 'app.gainforest.organization.site',
} as const
