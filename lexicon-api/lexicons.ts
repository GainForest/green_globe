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
  AppBskyRichtextFacet: {
    lexicon: 1,
    id: 'app.bsky.richtext.facet',
    defs: {
      main: {
        type: 'object',
        description: 'Annotation of a sub-string within rich text.',
        required: ['index', 'features'],
        properties: {
          index: {
            type: 'ref',
            ref: 'lex:app.bsky.richtext.facet#byteSlice',
          },
          features: {
            type: 'array',
            items: {
              type: 'union',
              refs: [
                'lex:app.bsky.richtext.facet#mention',
                'lex:app.bsky.richtext.facet#link',
                'lex:app.bsky.richtext.facet#tag',
              ],
            },
          },
        },
      },
      mention: {
        type: 'object',
        description:
          "Facet feature for mention of another account. The text is usually a handle, including a '@' prefix, but the facet reference is a DID.",
        required: ['did'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
        },
      },
      link: {
        type: 'object',
        description:
          'Facet feature for a URL. The text URL may have been simplified or truncated, but the facet reference should be a complete URL.',
        required: ['uri'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
          },
        },
      },
      tag: {
        type: 'object',
        description:
          "Facet feature for a hashtag. The text usually includes a '#' prefix, but the facet reference should not (except in the case of 'double hash tags').",
        required: ['tag'],
        properties: {
          tag: {
            type: 'string',
            maxLength: 640,
            maxGraphemes: 64,
          },
        },
      },
      byteSlice: {
        type: 'object',
        description:
          'Specifies the sub-string range a facet feature applies to. Start index is inclusive, end index is exclusive. Indices are zero-indexed, counting bytes of the UTF-8 encoded text. NOTE: some languages, like Javascript, use UTF-16 or Unicode codepoints for string slice indexing; in these languages, convert to byte arrays before working with facets.',
        required: ['byteStart', 'byteEnd'],
        properties: {
          byteStart: {
            type: 'integer',
            minimum: 0,
          },
          byteEnd: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
    },
  },
  AppGainforestAcMultimedia: {
    lexicon: 1,
    id: 'app.gainforest.ac.multimedia',
    description:
      'Audubon Core multimedia resource record. Represents a single media item (image, audio, video, spectrogram) associated with a biodiversity occurrence. Based on the TDWG Audiovisual Core standard (http://www.tdwg.org/standards/638). Each media item is a separate record linked to a dwc.occurrence via occurrenceRef.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['subjectPart', 'file', 'createdAt'],
          properties: {
            occurrenceRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI of the dwc.occurrence record this media is evidence for.',
            },
            siteRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI of the organization site record where this media was captured.',
            },
            subjectPart: {
              type: 'string',
              description:
                'The part of the organism depicted, using TDWG Audubon Core subjectPart controlled values (http://rs.tdwg.org/acpart/values/). Examples: entireOrganism, leaf, bark, flower, fruit, seed, stem, twig, bud, root.',
              maxGraphemes: 128,
              knownValues: [
                'entireOrganism',
                'leaf',
                'bark',
                'flower',
                'fruit',
                'seed',
                'stem',
                'twig',
                'bud',
                'root',
                'head',
                'wing',
                'shell',
                'unspecifiedPart',
              ],
            },
            subjectPartUri: {
              type: 'string',
              format: 'uri',
              description:
                'Full IRI of the subjectPart term from the TDWG controlled vocabulary. Example: http://rs.tdwg.org/acpart/values/p0002 for bark.',
            },
            subjectOrientation: {
              type: 'string',
              description:
                'Viewing orientation relative to the subject, using TDWG Audubon Core subjectOrientation controlled values. Examples: dorsal, ventral, lateral, anterior, posterior.',
              maxGraphemes: 128,
            },
            file: {
              type: 'blob',
              accept: [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
                'image/heic',
                'image/heif',
                'image/tiff',
                'image/tif',
                'image/gif',
                'image/bmp',
                'image/svg+xml',
                'audio/wav',
                'audio/x-wav',
                'audio/mpeg',
                'audio/mp3',
                'audio/mp4',
                'audio/x-m4a',
                'audio/aac',
                'audio/flac',
                'audio/x-flac',
                'audio/ogg',
                'audio/opus',
                'audio/webm',
                'video/mp4',
                'video/quicktime',
                'video/webm',
                'video/x-matroska',
              ],
              maxSize: 104857600,
              description:
                'The media file blob. Images up to 100MB, audio up to 100MB, video up to 100MB. For PDS-stored compressed versions; original full-res referenced via accessUri.',
            },
            format: {
              type: 'string',
              description:
                "MIME type of the media file (e.g. image/webp, audio/flac). Should match the blob's actual content type.",
              maxGraphemes: 128,
            },
            accessUri: {
              type: 'string',
              format: 'uri',
              description:
                'URI to the original full-resolution media resource (e.g. S3 URL). The PDS blob is a compressed variant; this points to the archival original.',
              maxGraphemes: 2048,
            },
            variantLiteral: {
              type: 'string',
              description:
                'AC variant describing the quality/size of this service access point. Values: Thumbnail, Lower Quality, Medium Quality, Good Quality, Best Quality, Offline.',
              maxGraphemes: 64,
              knownValues: [
                'Thumbnail',
                'Lower Quality',
                'Medium Quality',
                'Good Quality',
                'Best Quality',
                'Offline',
              ],
            },
            caption: {
              type: 'string',
              description: 'Human-readable description of the media content.',
              maxGraphemes: 1024,
            },
            creator: {
              type: 'string',
              description:
                'Name of the person or agent who created the media resource.',
              maxGraphemes: 256,
            },
            createDate: {
              type: 'string',
              format: 'datetime',
              description:
                'Date and time the media resource was originally created (e.g. when the photo was taken).',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp of record creation in the ATProto PDS.',
            },
          },
        },
      },
    },
  },
  AppGainforestCommonDefs: {
    lexicon: 1,
    id: 'app.gainforest.common.defs',
    description:
      'Shared type definitions for biodiversity and environmental data collection',
    defs: {
      richtext: {
        type: 'object',
        required: ['text'],
        description:
          'An object that contains the text and an object that defins and enables richtext formatting on the text.',
        properties: {
          text: {
            type: 'string',
            description: 'The text to be formatted',
          },
          facets: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:app.bsky.richtext.facet',
            },
          },
        },
      },
      uri: {
        type: 'object',
        required: ['uri'],
        description: 'Reference to external data via URI',
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
            maxGraphemes: 1024,
            description: 'URI to external resource',
          },
        },
      },
      image: {
        type: 'object',
        required: ['file'],
        description:
          'Image file for photos, camera traps, drone stills, scanned documents',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/webp',
              'image/heic',
              'image/heif',
              'image/tiff',
              'image/tif',
              'image/gif',
              'image/bmp',
              'image/svg+xml',
            ],
            maxSize: 20971520,
            description:
              'Image up to 20MB. Supports JPEG, PNG, WebP, HEIC (phones), TIFF (scientific), GIF, BMP, SVG.',
          },
        },
      },
      imageThumbnail: {
        type: 'object',
        required: ['file'],
        description: 'Small image for thumbnails and previews',
        properties: {
          file: {
            type: 'blob',
            accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            maxSize: 1048576,
            description: 'Thumbnail image up to 1MB',
          },
        },
      },
      video: {
        type: 'object',
        required: ['file'],
        description:
          'Video file for camera traps, drone footage, underwater video, behavioral observations',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'video/mp4',
              'video/quicktime',
              'video/x-msvideo',
              'video/webm',
              'video/x-matroska',
              'video/mpeg',
              'video/3gpp',
              'video/3gpp2',
            ],
            maxSize: 104857600,
            description:
              'Video up to 100MB. Supports MP4, MOV, AVI, WebM, MKV, MPEG, 3GP.',
          },
        },
      },
      audio: {
        type: 'object',
        required: ['file'],
        description:
          'Audio file for bioacoustics, soundscapes, field recordings, species calls',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'audio/wav',
              'audio/x-wav',
              'audio/mpeg',
              'audio/mp3',
              'audio/mp4',
              'audio/x-m4a',
              'audio/aac',
              'audio/flac',
              'audio/x-flac',
              'audio/ogg',
              'audio/opus',
              'audio/webm',
              'audio/aiff',
              'audio/x-aiff',
            ],
            maxSize: 104857600,
            description:
              'Audio up to 100MB. Supports WAV, MP3, M4A, AAC, FLAC, OGG, Opus, WebM, AIFF.',
          },
        },
      },
      spectrogram: {
        type: 'object',
        required: ['file'],
        description:
          'Spectrogram image - visual representation of audio frequency content',
        properties: {
          file: {
            type: 'blob',
            accept: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            maxSize: 5242880,
            description: 'Spectrogram image up to 5MB',
          },
        },
      },
      document: {
        type: 'object',
        required: ['file'],
        description:
          'Document file for reports, field notes, permits, publications',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'application/pdf',
              'text/plain',
              'text/markdown',
              'text/html',
              'application/rtf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            maxSize: 20971520,
            description:
              'Document up to 20MB. Supports PDF, TXT, Markdown, HTML, RTF, DOC, DOCX.',
          },
        },
      },
      dataFile: {
        type: 'object',
        required: ['file'],
        description:
          'Structured data file for observations, measurements, exports',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'text/csv',
              'text/tab-separated-values',
              'application/json',
              'application/ld+json',
              'application/xml',
              'text/xml',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.oasis.opendocument.spreadsheet',
            ],
            maxSize: 52428800,
            description:
              'Data file up to 50MB. Supports CSV, TSV, JSON, JSON-LD, XML, XLS, XLSX, ODS.',
          },
        },
      },
      gpsTrack: {
        type: 'object',
        required: ['file'],
        description:
          'GPS track file for transects, survey routes, patrol paths',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'application/gpx+xml',
              'application/vnd.google-earth.kml+xml',
              'application/vnd.google-earth.kmz',
              'application/geo+json',
              'application/json',
            ],
            maxSize: 10485760,
            description:
              'GPS track up to 10MB. Supports GPX, KML, KMZ, GeoJSON.',
          },
        },
      },
      geospatial: {
        type: 'object',
        required: ['file'],
        description:
          'Geospatial data file for maps, boundaries, habitat layers',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'application/geo+json',
              'application/json',
              'application/vnd.google-earth.kml+xml',
              'application/vnd.google-earth.kmz',
              'application/geopackage+sqlite3',
              'application/x-shapefile',
              'application/zip',
              'image/tiff',
              'image/geotiff',
            ],
            maxSize: 104857600,
            description:
              'Geospatial data up to 100MB. Supports GeoJSON, KML, KMZ, GeoPackage, Shapefile (zipped), GeoTIFF.',
          },
        },
      },
      sensorData: {
        type: 'object',
        required: ['file'],
        description:
          'Sensor data file for environmental monitoring (temperature, humidity, light, etc.)',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'text/csv',
              'application/json',
              'text/plain',
              'application/x-netcdf',
              'application/x-hdf5',
            ],
            maxSize: 52428800,
            description:
              'Sensor data up to 50MB. Supports CSV, JSON, TXT, NetCDF, HDF5.',
          },
        },
      },
      geneticData: {
        type: 'object',
        required: ['file'],
        description:
          'Genetic/genomic data file for eDNA, barcoding, sequencing results',
        properties: {
          file: {
            type: 'blob',
            accept: [
              'text/x-fasta',
              'application/x-fasta',
              'text/x-fastq',
              'application/x-fastq',
              'text/plain',
              'text/csv',
              'application/json',
            ],
            maxSize: 104857600,
            description:
              'Genetic data up to 100MB. Supports FASTA, FASTQ, CSV, JSON.',
          },
        },
      },
      indexedOrganization: {
        type: 'object',
        required: ['id', 'name'],
        description: 'Reference to an indexed organization',
        properties: {
          id: {
            type: 'string',
            format: 'uri',
            description: 'The URI of the organization',
          },
          name: {
            type: 'string',
            description: 'The name of the organization',
          },
        },
      },
      conservationStatus: {
        type: 'object',
        description:
          'IUCN and other conservation status information for a species or population',
        properties: {
          iucnCategory: {
            type: 'string',
            maxGraphemes: 16,
            knownValues: ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE'],
            description: 'IUCN Red List category code',
          },
          iucnTaxonId: {
            type: 'string',
            maxGraphemes: 32,
            description: 'IUCN taxon identifier',
          },
          iucnAssessmentDate: {
            type: 'string',
            maxGraphemes: 64,
            description: 'Date of the IUCN assessment',
          },
          citesAppendix: {
            type: 'string',
            maxGraphemes: 8,
            knownValues: ['I', 'II', 'III'],
            description: 'CITES appendix listing',
          },
          nationalStatus: {
            type: 'string',
            maxGraphemes: 256,
            description: 'National or regional conservation status',
          },
          nativeStatus: {
            type: 'string',
            maxGraphemes: 32,
            knownValues: [
              'native',
              'invasive',
              'introduced',
              'endemic',
              'uncertain',
            ],
            description: 'Native status of the species in the observed region',
          },
        },
      },
      speciesProfile: {
        type: 'object',
        required: ['scientificName'],
        description: 'Display-ready species profile for UI rendering',
        properties: {
          scientificName: {
            type: 'string',
            maxGraphemes: 512,
            description: 'Scientific (Latin) name of the species',
          },
          commonName: {
            type: 'string',
            maxGraphemes: 256,
            description: 'Vernacular name of the species',
          },
          gbifTaxonKey: {
            type: 'string',
            maxGraphemes: 64,
            description: 'GBIF taxon key identifier',
          },
          kingdom: {
            type: 'string',
            maxGraphemes: 128,
            description: 'Taxonomic kingdom',
          },
          family: {
            type: 'string',
            maxGraphemes: 128,
            description: 'Taxonomic family',
          },
          genus: {
            type: 'string',
            maxGraphemes: 128,
            description: 'Taxonomic genus',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            maxGraphemes: 512,
            description: 'Representative species image URL',
          },
          thumbnailUrl: {
            type: 'string',
            format: 'uri',
            maxGraphemes: 512,
            description: 'Small thumbnail image URL',
          },
          conservationStatus: {
            type: 'ref',
            ref: 'lex:app.gainforest.common.defs#conservationStatus',
            description: 'Conservation status information for this species',
          },
        },
      },
      coordinatePair: {
        type: 'object',
        required: ['lat', 'lon'],
        description:
          'A simple lat/lon pair for lightweight location references',
        properties: {
          lat: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Decimal latitude',
          },
          lon: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Decimal longitude',
          },
        },
      },
      dateRange: {
        type: 'object',
        required: ['startDate'],
        description: 'A date range for temporal queries',
        properties: {
          startDate: {
            type: 'string',
            maxGraphemes: 64,
            description: 'ISO 8601 start date',
          },
          endDate: {
            type: 'string',
            maxGraphemes: 64,
            description: 'ISO 8601 end date',
          },
        },
      },
      externalReference: {
        type: 'object',
        required: ['system', 'identifier'],
        description: 'A reference to an external system or database',
        properties: {
          system: {
            type: 'string',
            maxGraphemes: 128,
            knownValues: [
              'gbif',
              'iucn',
              'ncbi',
              'bold',
              'ebird',
              'inaturalist',
              'wdpa',
              'restor',
              'other',
            ],
            description: 'External system name',
          },
          identifier: {
            type: 'string',
            maxGraphemes: 256,
            description: 'Identifier in the external system',
          },
          url: {
            type: 'string',
            format: 'uri',
            maxGraphemes: 512,
            description: 'Direct URL to the record in the external system',
          },
        },
      },
    },
  },
  AppGainforestDwcDefs: {
    lexicon: 1,
    id: 'app.gainforest.dwc.defs',
    description:
      'Shared type definitions for Darwin Core aligned biodiversity records',
    defs: {
      geolocation: {
        type: 'object',
        description:
          'A geographic point with uncertainty, following Darwin Core Location class',
        required: ['decimalLatitude', 'decimalLongitude'],
        properties: {
          decimalLatitude: {
            type: 'string',
            description:
              'Geographic latitude in decimal degrees (WGS84). Positive values north of the Equator, negative south. Range: -90 to 90.',
            maxGraphemes: 32,
          },
          decimalLongitude: {
            type: 'string',
            description:
              'Geographic longitude in decimal degrees (WGS84). Positive values east of the Greenwich Meridian, negative west. Range: -180 to 180.',
            maxGraphemes: 32,
          },
          coordinateUncertaintyInMeters: {
            type: 'integer',
            description:
              'Horizontal distance from the coordinates describing the smallest circle containing the whole location. Zero is not valid.',
            minimum: 1,
          },
          geodeticDatum: {
            type: 'string',
            description:
              "The ellipsoid, geodetic datum, or spatial reference system. Recommended: 'EPSG:4326' (WGS84)",
            maxGraphemes: 64,
          },
        },
      },
      taxonIdentification: {
        type: 'object',
        description: 'A taxonomic identification with provenance metadata',
        required: ['scientificName'],
        properties: {
          scientificName: {
            type: 'string',
            description:
              'The full scientific name including authorship and date',
            maxGraphemes: 512,
          },
          gbifTaxonKey: {
            type: 'string',
            description: 'GBIF backbone taxonomy key for the identified taxon',
            maxGraphemes: 64,
          },
          identifiedBy: {
            type: 'string',
            description:
              'Person(s) who made the identification (pipe-delimited for multiple)',
            maxGraphemes: 512,
          },
          identifiedByID: {
            type: 'string',
            description:
              'ORCID or other persistent identifier for the person(s) who identified (pipe-delimited)',
            maxGraphemes: 512,
          },
          dateIdentified: {
            type: 'string',
            description: 'Date the identification was made (ISO 8601)',
            maxGraphemes: 64,
          },
          identificationQualifier: {
            type: 'string',
            description:
              "Uncertainty qualifier applied to the taxon name (e.g., 'cf. agrestis', 'aff. agrestis')",
            maxGraphemes: 256,
          },
          identificationRemarks: {
            type: 'string',
            description: 'Notes or comments about the identification',
            maxGraphemes: 2048,
          },
        },
      },
      basisOfRecordEnum: {
        type: 'string',
        description:
          'The specific nature of the data record. Controlled vocabulary per Darwin Core.',
        maxGraphemes: 64,
        knownValues: [
          'HumanObservation',
          'MachineObservation',
          'PreservedSpecimen',
          'LivingSpecimen',
          'FossilSpecimen',
          'MaterialSample',
          'MaterialEntity',
          'MaterialCitation',
        ],
      },
      occurrenceStatusEnum: {
        type: 'string',
        description:
          'Statement about the presence or absence of a taxon at a location.',
        maxGraphemes: 64,
        knownValues: ['present', 'absent'],
      },
      dublinCoreTypeEnum: {
        type: 'string',
        description:
          'Dublin Core type vocabulary for the nature of the resource.',
        maxGraphemes: 64,
        knownValues: [
          'PhysicalObject',
          'StillImage',
          'MovingImage',
          'Sound',
          'Text',
          'Event',
          'Dataset',
        ],
      },
      nomenclaturalCodeEnum: {
        type: 'string',
        description:
          'The nomenclatural code under which the scientific name is constructed.',
        maxGraphemes: 64,
        knownValues: ['ICZN', 'ICN', 'ICNP', 'ICTV', 'BioCode'],
      },
      sexEnum: {
        type: 'string',
        description:
          'The sex of the biological individual(s) represented in the occurrence.',
        maxGraphemes: 64,
        knownValues: ['male', 'female', 'hermaphrodite'],
      },
      taxonRankEnum: {
        type: 'string',
        description:
          'The taxonomic rank of the most specific name in the scientificName.',
        maxGraphemes: 64,
        knownValues: [
          'kingdom',
          'phylum',
          'class',
          'order',
          'family',
          'subfamily',
          'genus',
          'subgenus',
          'species',
          'subspecies',
          'variety',
          'form',
        ],
      },
      plantTraits: {
        type: 'object',
        description: 'Functional plant traits from databases like TRY, Restor',
        properties: {
          woodDensity: {
            type: 'string',
            description: 'Wood density in g/cm³',
            maxGraphemes: 32,
          },
          maxHeight: {
            type: 'string',
            description: 'Maximum height in meters',
            maxGraphemes: 32,
          },
          stemDiameter: {
            type: 'string',
            description: 'Typical stem diameter in cm',
            maxGraphemes: 32,
          },
          stemConduitDiameter: {
            type: 'string',
            description: 'Stem conduit diameter in μm',
            maxGraphemes: 32,
          },
          barkThickness: {
            type: 'string',
            description: 'Bark thickness in mm',
            maxGraphemes: 32,
          },
          rootDepth: {
            type: 'string',
            description: 'Root depth in meters',
            maxGraphemes: 32,
          },
          leafArea: {
            type: 'string',
            description: 'Leaf area in cm²',
            maxGraphemes: 32,
          },
          specificLeafArea: {
            type: 'string',
            description: 'Specific leaf area in mm²/mg',
            maxGraphemes: 32,
          },
          seedMass: {
            type: 'string',
            description: 'Seed mass in mg',
            maxGraphemes: 32,
          },
          growthForm: {
            type: 'string',
            description: 'Growth form of the plant',
            maxGraphemes: 64,
            knownValues: [
              'tree',
              'shrub',
              'herb',
              'grass',
              'vine',
              'epiphyte',
              'fern',
              'palm',
              'bamboo',
              'succulent',
              'other',
            ],
          },
          leafType: {
            type: 'string',
            description: 'Leaf type of the plant',
            maxGraphemes: 32,
            knownValues: [
              'broadleaf-deciduous',
              'broadleaf-evergreen',
              'needleleaf-deciduous',
              'needleleaf-evergreen',
              'other',
            ],
          },
          dispersalMode: {
            type: 'string',
            description: 'Primary seed dispersal mode',
            maxGraphemes: 64,
            knownValues: [
              'wind',
              'water',
              'animal',
              'gravity',
              'ballistic',
              'other',
            ],
          },
          pollinationMode: {
            type: 'string',
            description: 'Primary pollination mode',
            maxGraphemes: 64,
            knownValues: [
              'insect',
              'wind',
              'bird',
              'bat',
              'water',
              'self',
              'other',
            ],
          },
          edibleParts: {
            type: 'array',
            description:
              "Edible parts of the plant (e.g., 'fruit', 'leaves', 'seeds')",
            maxLength: 10,
            items: {
              type: 'string',
              maxGraphemes: 64,
            },
          },
          economicUses: {
            type: 'array',
            description:
              "Economic uses of the plant (e.g., 'timber', 'medicine')",
            maxLength: 10,
            items: {
              type: 'string',
              maxGraphemes: 128,
            },
          },
          traitSource: {
            type: 'string',
            description:
              "Source database for trait data (e.g., 'TRY', 'Restor', 'BIEN')",
            maxGraphemes: 256,
          },
        },
      },
      abundanceEstimate: {
        type: 'object',
        description: 'A structured abundance/density estimate',
        required: ['value', 'unit'],
        properties: {
          value: {
            type: 'string',
            description: 'Numeric value as string',
            maxGraphemes: 64,
          },
          unit: {
            type: 'string',
            description:
              "Unit of the estimate (e.g., 'individuals/ha', 'stems/ha', '% cover', 'relative abundance')",
            maxGraphemes: 64,
          },
          method: {
            type: 'string',
            description: 'Estimation method',
            maxGraphemes: 256,
          },
          confidence: {
            type: 'string',
            description: 'Confidence interval or qualifier',
            maxGraphemes: 64,
          },
          date: {
            type: 'string',
            description: 'Date of estimate (ISO 8601)',
            maxGraphemes: 64,
          },
        },
      },
      lifeHistoryEnum: {
        type: 'string',
        description: 'Life history strategy of the organism',
        maxGraphemes: 32,
        knownValues: ['annual', 'biennial', 'perennial', 'ephemeral'],
      },
      establishmentMeansEnum: {
        type: 'string',
        description:
          'Darwin Core establishment means — the process by which the organism came to be in a given place at a given time',
        maxGraphemes: 64,
        knownValues: [
          'native',
          'introduced',
          'naturalised',
          'invasive',
          'managed',
          'uncertain',
        ],
      },
    },
  },
  AppGainforestDwcEvent: {
    lexicon: 1,
    id: 'app.gainforest.dwc.event',
    description:
      'A sampling event record aligned with Darwin Core Event class. Enables star-schema pattern where multiple occurrences reference a shared event context (location, protocol, effort).',
    defs: {
      main: {
        type: 'record',
        description:
          'A sampling or collecting event. Multiple dwc.occurrence records can reference the same event via eventRef, sharing location and protocol metadata.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['eventID', 'eventDate', 'createdAt'],
          properties: {
            eventID: {
              type: 'string',
              description:
                'An identifier for the event. Should be globally unique or unique within the dataset.',
              maxGraphemes: 256,
            },
            parentEventID: {
              type: 'string',
              description:
                'An identifier for the broader event that this event is part of (e.g., a survey campaign that contains multiple transects).',
              maxGraphemes: 256,
            },
            parentEventRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI reference to the parent app.gainforest.dwc.event record.',
            },
            eventDate: {
              type: 'string',
              description:
                "The date or date range during which the event occurred. ISO 8601 format (e.g., '2024-03-15', '2024-03-15/2024-03-17').",
              maxGraphemes: 64,
            },
            eventTime: {
              type: 'string',
              description:
                "The time or time range during which the event occurred. ISO 8601 format (e.g., '06:30:00', '06:30:00/09:00:00').",
              maxGraphemes: 64,
            },
            habitat: {
              type: 'string',
              description:
                "A category or description of the habitat in which the event occurred (e.g., 'primary tropical rainforest', 'degraded pasture', 'riparian zone').",
              maxGraphemes: 512,
            },
            samplingProtocol: {
              type: 'string',
              description:
                "The names of, references to, or descriptions of the methods used during the event (e.g., 'camera trap array', 'line transect distance sampling', 'audio point count 10-min').",
              maxGraphemes: 1024,
            },
            sampleSizeValue: {
              type: 'string',
              description:
                "A numeric value for a measurement of the size of a sample in the event (e.g., '20', '0.25').",
              maxGraphemes: 64,
            },
            sampleSizeUnit: {
              type: 'string',
              description:
                "The unit of measurement for the sampleSizeValue (e.g., 'square meters', 'hectares', 'trap-nights').",
              maxGraphemes: 128,
            },
            samplingEffort: {
              type: 'string',
              description:
                "The amount of effort expended during the event (e.g., '3 person-hours', '14 trap-nights', '2 km transect walked').",
              maxGraphemes: 256,
            },
            fieldNotes: {
              type: 'string',
              description:
                'Notes or a reference to notes taken in the field about the event.',
              maxGraphemes: 10000,
            },
            eventRemarks: {
              type: 'string',
              description: 'Comments or notes about the event.',
              maxGraphemes: 5000,
            },
            locationID: {
              type: 'string',
              description:
                'Identifier for the location where the event occurred.',
              maxGraphemes: 256,
            },
            decimalLatitude: {
              type: 'string',
              description:
                'Geographic latitude in decimal degrees (WGS84). Range: -90 to 90.',
              maxGraphemes: 32,
            },
            decimalLongitude: {
              type: 'string',
              description:
                'Geographic longitude in decimal degrees (WGS84). Range: -180 to 180.',
              maxGraphemes: 32,
            },
            geodeticDatum: {
              type: 'string',
              description:
                "The spatial reference system. Recommended: 'EPSG:4326'.",
              maxGraphemes: 64,
            },
            coordinateUncertaintyInMeters: {
              type: 'integer',
              description:
                'Uncertainty radius in meters around the coordinates.',
              minimum: 1,
            },
            country: {
              type: 'string',
              description: 'The name of the country.',
              maxGraphemes: 128,
            },
            countryCode: {
              type: 'string',
              description: 'ISO 3166-1 alpha-2 country code.',
              minLength: 2,
              maxLength: 2,
            },
            stateProvince: {
              type: 'string',
              description: 'First-level administrative division.',
              maxGraphemes: 256,
            },
            county: {
              type: 'string',
              description: 'Second-level administrative division.',
              maxGraphemes: 256,
            },
            municipality: {
              type: 'string',
              description: 'Third-level administrative division.',
              maxGraphemes: 256,
            },
            locality: {
              type: 'string',
              description: 'Specific locality description.',
              maxGraphemes: 1024,
            },
            minimumElevationInMeters: {
              type: 'integer',
              description:
                'Lower limit of elevation range in meters above sea level.',
            },
            maximumElevationInMeters: {
              type: 'integer',
              description:
                'Upper limit of elevation range in meters above sea level.',
            },
            locationRemarks: {
              type: 'string',
              description: 'Comments about the location.',
              maxGraphemes: 2048,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp of record creation in the ATProto PDS.',
            },
            projectRef: {
              type: 'string',
              format: 'at-uri',
              description: 'AT-URI reference to the organization info record.',
            },
            siteRef: {
              type: 'string',
              format: 'at-uri',
              description: 'AT-URI reference to the organization site record.',
            },
            monitoringProgramme: {
              type: 'string',
              description:
                "Name of the monitoring programme (e.g., 'Annual Biodiversity Survey 2025').",
              maxGraphemes: 256,
            },
            monitoringFrequency: {
              type: 'string',
              description:
                "How often this type of event recurs (e.g., 'monthly', 'quarterly', 'annual', 'one-time').",
              maxGraphemes: 64,
            },
            temperature: {
              type: 'string',
              description: 'Temperature in Celsius during event.',
              maxGraphemes: 16,
            },
            humidity: {
              type: 'string',
              description: 'Relative humidity percentage.',
              maxGraphemes: 16,
            },
            windSpeed: {
              type: 'string',
              description: 'Wind speed during event.',
              maxGraphemes: 16,
            },
            cloudCover: {
              type: 'string',
              description: 'Cloud cover percentage.',
              maxGraphemes: 16,
            },
            precipitation: {
              type: 'string',
              description:
                "Precipitation description (e.g., 'none', 'light rain', '5mm').",
              maxGraphemes: 32,
            },
            weatherRemarks: {
              type: 'string',
              description: 'General weather description.',
              maxGraphemes: 512,
            },
            moonPhase: {
              type: 'string',
              description: 'Moon phase (relevant for nocturnal surveys).',
              maxGraphemes: 32,
            },
            waterLevel: {
              type: 'string',
              description:
                "Water level if aquatic survey (e.g., 'low', '2.3m').",
              maxGraphemes: 32,
            },
            waterTemperature: {
              type: 'string',
              description: 'Water temperature in Celsius.',
              maxGraphemes: 16,
            },
            visibility: {
              type: 'string',
              description:
                "Visibility conditions (e.g., 'clear', 'foggy', '10m underwater').",
              maxGraphemes: 32,
            },
            teamSize: {
              type: 'integer',
              description: 'Number of people involved in the event.',
              minimum: 1,
            },
            recordedBy: {
              type: 'string',
              description:
                "Person(s) who conducted the event. Pipe-delimited for multiple people (e.g., 'Jane Smith | John Doe').",
              maxGraphemes: 512,
            },
            recordedByID: {
              type: 'string',
              description:
                'ORCID or other persistent identifiers for the recorder(s). Pipe-delimited for multiple IDs.',
              maxGraphemes: 512,
            },
            equipmentUsed: {
              type: 'string',
              description: 'Description of equipment used during the event.',
              maxGraphemes: 1024,
            },
            qualityControlNotes: {
              type: 'string',
              description:
                'Notes on data quality issues encountered during or after the event.',
              maxGraphemes: 2048,
            },
            completeness: {
              type: 'string',
              description:
                "Assessment of survey completeness (e.g., 'complete', 'partial - rain stopped survey', 'incomplete').",
              maxGraphemes: 64,
            },
          },
        },
      },
    },
  },
  AppGainforestDwcMeasurement: {
    lexicon: 1,
    id: 'app.gainforest.dwc.measurement',
    description:
      'A measurement or fact record aligned with the Darwin Core MeasurementOrFact class. Extension record that links to an occurrence, enabling multiple measurements per organism (e.g., DBH, height, canopy cover for a tree).',
    defs: {
      main: {
        type: 'record',
        description:
          'A measurement, fact, characteristic, or assertion about an occurrence. Multiple measurement records can reference the same occurrence, solving the Simple DwC one-measurement-per-record limitation.',
        key: 'tid',
        record: {
          type: 'object',
          required: [
            'occurrenceRef',
            'measurementType',
            'measurementValue',
            'createdAt',
          ],
          properties: {
            measurementID: {
              type: 'string',
              description:
                'An identifier for the measurement. Should be unique within the dataset.',
              maxGraphemes: 256,
            },
            occurrenceRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI reference to the app.gainforest.dwc.occurrence record this measurement belongs to.',
            },
            occurrenceID: {
              type: 'string',
              description:
                'The occurrenceID of the linked occurrence record (for cross-system interoperability).',
              maxGraphemes: 256,
            },
            measurementType: {
              type: 'string',
              description:
                "The nature of the measurement, fact, characteristic, or assertion (e.g., 'DBH', 'tree height', 'canopy cover', 'tail length', 'body mass', 'soil pH', 'water temperature').",
              maxGraphemes: 256,
            },
            measurementValue: {
              type: 'string',
              description:
                "The value of the measurement, fact, characteristic, or assertion (e.g., '45.2', 'present', 'blue').",
              maxGraphemes: 1024,
            },
            measurementUnit: {
              type: 'string',
              description:
                "The units for the measurementValue (e.g., 'cm', 'm', 'kg', 'mm', '%', 'degrees Celsius').",
              maxGraphemes: 64,
            },
            measurementAccuracy: {
              type: 'string',
              description:
                "The description of the potential error associated with the measurementValue (e.g., '0.5 cm', '5%').",
              maxGraphemes: 256,
            },
            measurementMethod: {
              type: 'string',
              description:
                "The description of or reference to the method used to determine the measurement (e.g., 'diameter tape at 1.3m height', 'laser rangefinder', 'Bitterlich method').",
              maxGraphemes: 1024,
            },
            measurementDeterminedBy: {
              type: 'string',
              description:
                'Person(s) who determined the measurement. Pipe-delimited for multiple.',
              maxGraphemes: 512,
            },
            measurementDeterminedDate: {
              type: 'string',
              description:
                'The date the measurement was made. ISO 8601 format.',
              maxGraphemes: 64,
            },
            measurementRemarks: {
              type: 'string',
              description: 'Comments or notes accompanying the measurement.',
              maxGraphemes: 5000,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp of record creation in the ATProto PDS.',
            },
          },
        },
      },
    },
  },
  AppGainforestDwcOccurrence: {
    lexicon: 1,
    id: 'app.gainforest.dwc.occurrence',
    description:
      'A single biodiversity occurrence record aligned with Simple Darwin Core (TDWG Standard 450, version 2023-09-13). Represents one organism or group of organisms at a particular place and time.',
    defs: {
      main: {
        type: 'record',
        description:
          'A biodiversity occurrence record following the Simple Darwin Core standard. Each record represents one occurrence of an organism at a location and time.',
        key: 'tid',
        record: {
          type: 'object',
          required: [
            'basisOfRecord',
            'scientificName',
            'eventDate',
            'createdAt',
          ],
          properties: {
            occurrenceID: {
              type: 'string',
              description:
                'A globally unique identifier for the occurrence record. Recommended: a persistent URI (e.g., DOI, LSID, or UUID-based URI).',
              maxGraphemes: 256,
            },
            basisOfRecord: {
              type: 'string',
              description:
                'The specific nature of the data record. Must be one of the Darwin Core class names.',
              maxGraphemes: 64,
              enum: [
                'HumanObservation',
                'MachineObservation',
                'PreservedSpecimen',
                'LivingSpecimen',
                'FossilSpecimen',
                'MaterialSample',
                'MaterialEntity',
                'MaterialCitation',
              ],
            },
            dcType: {
              type: 'string',
              description:
                'The Dublin Core type class that best describes the resource (dc:type).',
              maxGraphemes: 64,
              enum: [
                'PhysicalObject',
                'StillImage',
                'MovingImage',
                'Sound',
                'Text',
                'Event',
                'Dataset',
              ],
            },
            license: {
              type: 'string',
              description:
                "A legal document giving official permission to do something with the record. Recommended: a Creative Commons URI (e.g., 'http://creativecommons.org/licenses/by/4.0/').",
              maxGraphemes: 512,
            },
            rightsHolder: {
              type: 'string',
              description:
                'Person or organization owning or managing rights over the resource.',
              maxGraphemes: 256,
            },
            institutionCode: {
              type: 'string',
              description:
                'The name or acronym of the institution having custody of the object(s) or information in the record.',
              maxGraphemes: 256,
            },
            collectionCode: {
              type: 'string',
              description:
                'The name, acronym, or code identifying the collection or dataset from which the record was derived.',
              maxGraphemes: 256,
            },
            datasetName: {
              type: 'string',
              description:
                'The name identifying the dataset from which the record was derived.',
              maxGraphemes: 256,
            },
            informationWithheld: {
              type: 'string',
              description:
                "A description of what information is withheld from this record and why (e.g., 'coordinates generalized to protect endangered species').",
              maxGraphemes: 1024,
            },
            dataGeneralizations: {
              type: 'string',
              description:
                "A description of actions taken to make the data less specific or complete (e.g., 'coordinates rounded to nearest 0.1 degree').",
              maxGraphemes: 1024,
            },
            references: {
              type: 'string',
              format: 'uri',
              description:
                'A related resource that is referenced, cited, or otherwise pointed to by the record (URL).',
            },
            recordedBy: {
              type: 'string',
              description:
                "Person(s) responsible for recording the occurrence in the field. Pipe-delimited for multiple (e.g., 'Jane Smith | John Doe').",
              maxGraphemes: 512,
            },
            recordedByID: {
              type: 'string',
              description:
                'Persistent identifier(s) (e.g., ORCID) of the person(s) who recorded. Pipe-delimited for multiple.',
              maxGraphemes: 512,
            },
            individualCount: {
              type: 'integer',
              description:
                'The number of individuals present at the time of the occurrence.',
              minimum: 0,
            },
            organismQuantity: {
              type: 'string',
              description:
                "A number or enumeration value for the quantity of organisms (e.g., '27', '12.5', 'many').",
              maxGraphemes: 64,
            },
            organismQuantityType: {
              type: 'string',
              description:
                "The type of quantification system used for organismQuantity (e.g., 'individuals', '% biomass', 'stems/ha').",
              maxGraphemes: 128,
            },
            sex: {
              type: 'string',
              description: 'The sex of the biological individual(s).',
              maxGraphemes: 64,
              enum: ['male', 'female', 'hermaphrodite'],
            },
            lifeStage: {
              type: 'string',
              description:
                "The age class or life stage at the time of occurrence (e.g., 'adult', 'juvenile', 'larva', 'seedling', 'sapling').",
              maxGraphemes: 128,
            },
            reproductiveCondition: {
              type: 'string',
              description:
                "The reproductive condition at the time of occurrence (e.g., 'flowering', 'fruiting', 'budding', 'pregnant').",
              maxGraphemes: 128,
            },
            behavior: {
              type: 'string',
              description:
                "The behavior shown by the subject at the time of occurrence (e.g., 'foraging', 'nesting', 'roosting').",
              maxGraphemes: 256,
            },
            occurrenceStatus: {
              type: 'string',
              description:
                'Statement about the presence or absence of a taxon at a location.',
              maxGraphemes: 64,
              enum: ['present', 'absent'],
            },
            occurrenceRemarks: {
              type: 'string',
              description: 'Comments or notes about the occurrence.',
              maxGraphemes: 5000,
            },
            associatedMedia: {
              type: 'string',
              description:
                'Identifiers (URIs) of media associated with the occurrence. Pipe-delimited for multiple.',
              maxGraphemes: 2048,
            },
            associatedReferences: {
              type: 'string',
              description:
                'Identifiers (URIs) of literature associated with the occurrence. Pipe-delimited for multiple.',
              maxGraphemes: 2048,
            },
            associatedSequences: {
              type: 'string',
              description:
                'Identifiers (URIs) of genetic sequence information associated with the occurrence. Pipe-delimited for multiple.',
              maxGraphemes: 2048,
            },
            associatedOccurrences: {
              type: 'string',
              description:
                'Identifiers of other occurrences associated with this one (e.g., parasite-host). Pipe-delimited.',
              maxGraphemes: 2048,
            },
            eventID: {
              type: 'string',
              description:
                'Identifier for the sampling event. Can be used to group occurrences from the same event.',
              maxGraphemes: 256,
            },
            eventRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI reference to an app.gainforest.dwc.event record (for star-schema linkage).',
            },
            eventDate: {
              type: 'string',
              description:
                "The date or date-time (or interval) during which the occurrence was recorded. ISO 8601 format (e.g., '2024-03-15', '2024-03-15T10:30:00Z', '2024-03/2024-06').",
              maxGraphemes: 64,
            },
            eventTime: {
              type: 'string',
              description:
                "The time of the event. ISO 8601 format (e.g., '14:30:00', '14:30:00+02:00').",
              maxGraphemes: 64,
            },
            habitat: {
              type: 'string',
              description:
                "A description of the habitat in which the event occurred (e.g., 'tropical rainforest', 'mangrove swamp', 'montane cloud forest').",
              maxGraphemes: 512,
            },
            samplingProtocol: {
              type: 'string',
              description:
                "The method or protocol used during the event (e.g., 'camera trap', 'point count', 'mist net', '20m x 20m plot survey', 'acoustic monitoring').",
              maxGraphemes: 1024,
            },
            samplingEffort: {
              type: 'string',
              description:
                "The amount of effort expended during the event (e.g., '2 trap-nights', '30 minutes', '10 km transect').",
              maxGraphemes: 256,
            },
            fieldNotes: {
              type: 'string',
              description:
                'Notes or reference to notes taken in the field about the event.',
              maxGraphemes: 10000,
            },
            locationID: {
              type: 'string',
              description:
                'Identifier for the location (e.g., a reference to a named site).',
              maxGraphemes: 256,
            },
            decimalLatitude: {
              type: 'string',
              description:
                'Geographic latitude in decimal degrees (WGS84). Positive values are north of the Equator. Range: -90 to 90.',
              maxGraphemes: 32,
            },
            decimalLongitude: {
              type: 'string',
              description:
                'Geographic longitude in decimal degrees (WGS84). Positive values are east of the Greenwich Meridian. Range: -180 to 180.',
              maxGraphemes: 32,
            },
            geodeticDatum: {
              type: 'string',
              description:
                "The spatial reference system for the coordinates. Recommended: 'EPSG:4326' (WGS84).",
              maxGraphemes: 64,
            },
            coordinateUncertaintyInMeters: {
              type: 'integer',
              description:
                'Horizontal distance (meters) from the given coordinates describing the smallest circle containing the whole location.',
              minimum: 1,
            },
            country: {
              type: 'string',
              description:
                'The name of the country or major administrative unit.',
              maxGraphemes: 128,
            },
            countryCode: {
              type: 'string',
              description:
                'The standard code for the country (ISO 3166-1 alpha-2).',
              minLength: 2,
              maxLength: 2,
            },
            stateProvince: {
              type: 'string',
              description:
                'The name of the next smaller administrative region than country.',
              maxGraphemes: 256,
            },
            county: {
              type: 'string',
              description:
                'The full, unabbreviated name of the next smaller administrative region than stateProvince.',
              maxGraphemes: 256,
            },
            municipality: {
              type: 'string',
              description:
                'The full, unabbreviated name of the next smaller administrative region than county.',
              maxGraphemes: 256,
            },
            locality: {
              type: 'string',
              description:
                "The specific description of the place (e.g., '500m upstream of bridge on Rio Pará').",
              maxGraphemes: 1024,
            },
            verbatimLocality: {
              type: 'string',
              description:
                'The original textual description of the place as provided by the recorder.',
              maxGraphemes: 1024,
            },
            minimumElevationInMeters: {
              type: 'integer',
              description:
                'The lower limit of the range of elevation (in meters above sea level).',
            },
            maximumElevationInMeters: {
              type: 'integer',
              description:
                'The upper limit of the range of elevation (in meters above sea level).',
            },
            minimumDepthInMeters: {
              type: 'integer',
              description:
                'The lesser depth of a range of depth below the local surface (in meters).',
              minimum: 0,
            },
            maximumDepthInMeters: {
              type: 'integer',
              description:
                'The greater depth of a range of depth below the local surface (in meters).',
              minimum: 0,
            },
            locationRemarks: {
              type: 'string',
              description: 'Comments about the location.',
              maxGraphemes: 2048,
            },
            gbifTaxonKey: {
              type: 'string',
              description:
                'GBIF backbone taxonomy key for the identified taxon. Retained for backward compatibility with existing GainForest workflows.',
              maxGraphemes: 64,
            },
            scientificName: {
              type: 'string',
              description:
                "The full scientific name, with authorship and date if known (e.g., 'Centropyge flavicauda Fraser-Brunner 1933').",
              maxGraphemes: 512,
            },
            scientificNameAuthorship: {
              type: 'string',
              description:
                "The authorship information for the scientific name (e.g., 'Fraser-Brunner 1933').",
              maxGraphemes: 256,
            },
            kingdom: {
              type: 'string',
              description:
                "The full scientific name of the kingdom (e.g., 'Animalia', 'Plantae', 'Fungi').",
              maxGraphemes: 128,
            },
            phylum: {
              type: 'string',
              description:
                'The full scientific name of the phylum or division.',
              maxGraphemes: 128,
            },
            class: {
              type: 'string',
              description: 'The full scientific name of the class.',
              maxGraphemes: 128,
            },
            order: {
              type: 'string',
              description: 'The full scientific name of the order.',
              maxGraphemes: 128,
            },
            family: {
              type: 'string',
              description: 'The full scientific name of the family.',
              maxGraphemes: 128,
            },
            genus: {
              type: 'string',
              description: 'The full scientific name of the genus.',
              maxGraphemes: 128,
            },
            specificEpithet: {
              type: 'string',
              description:
                'The name of the species epithet of the scientificName.',
              maxGraphemes: 128,
            },
            infraspecificEpithet: {
              type: 'string',
              description:
                'The name of the lowest or terminal infraspecific epithet.',
              maxGraphemes: 128,
            },
            taxonRank: {
              type: 'string',
              description:
                'The taxonomic rank of the most specific name in scientificName.',
              maxGraphemes: 64,
              enum: [
                'kingdom',
                'phylum',
                'class',
                'order',
                'family',
                'subfamily',
                'genus',
                'subgenus',
                'species',
                'subspecies',
                'variety',
                'form',
              ],
            },
            vernacularName: {
              type: 'string',
              description: 'A common or vernacular name for the taxon.',
              maxGraphemes: 256,
            },
            taxonomicStatus: {
              type: 'string',
              description:
                "The status of the use of the scientificName (e.g., 'accepted', 'synonym', 'doubtful').",
              maxGraphemes: 64,
            },
            nomenclaturalCode: {
              type: 'string',
              description:
                'The nomenclatural code under which the scientificName is constructed.',
              maxGraphemes: 64,
              enum: ['ICZN', 'ICN', 'ICNP', 'ICTV', 'BioCode'],
            },
            higherClassification: {
              type: 'string',
              description:
                "A complete list of taxa names terminating at the rank immediately superior to the taxon. Pipe-delimited (e.g., 'Animalia|Chordata|Mammalia|Rodentia|Ctenomyidae|Ctenomys').",
              maxGraphemes: 1024,
            },
            identifiedBy: {
              type: 'string',
              description:
                'Person(s) who assigned the taxon to the occurrence. Pipe-delimited for multiple.',
              maxGraphemes: 512,
            },
            identifiedByID: {
              type: 'string',
              description:
                'Persistent identifier(s) (e.g., ORCID) of the person(s) who identified. Pipe-delimited.',
              maxGraphemes: 512,
            },
            dateIdentified: {
              type: 'string',
              description:
                'The date on which the identification was made. ISO 8601 format.',
              maxGraphemes: 64,
            },
            identificationQualifier: {
              type: 'string',
              description:
                "A brief phrase or standard term qualifying the identification (e.g., 'cf. agrestis', 'aff. agrestis').",
              maxGraphemes: 256,
            },
            identificationRemarks: {
              type: 'string',
              description: 'Comments or notes about the identification.',
              maxGraphemes: 2048,
            },
            previousIdentifications: {
              type: 'string',
              description:
                'Previous assignments of names to the occurrence. Pipe-delimited.',
              maxGraphemes: 2048,
            },
            dynamicProperties: {
              type: 'string',
              description:
                'Additional structured data as a valid JSON string (per Simple DwC Section 7.1). Example: \'{"iucnStatus":"vulnerable","canopyCover":"85%"}\'. Should be flattened to a single line with no non-printing characters.',
              maxGraphemes: 10000,
            },
            imageEvidence: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#image',
              description:
                'Image evidence (photo, camera trap, drone still, scanned specimen, etc.).',
            },
            audioEvidence: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#audio',
              description:
                'Audio evidence (bioacoustics, soundscape, species call, field recording, etc.).',
            },
            videoEvidence: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#video',
              description:
                'Video evidence (camera trap, drone footage, underwater video, behavioral observation, etc.).',
            },
            spectrogramEvidence: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#spectrogram',
              description:
                'Spectrogram image showing frequency analysis of audio recording.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp of record creation in the ATProto PDS.',
            },
            conservationStatus: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#conservationStatus',
              description:
                'Conservation status information including IUCN category, CITES listing, and native/invasive status.',
            },
            plantTraits: {
              type: 'ref',
              ref: 'lex:app.gainforest.dwc.defs#plantTraits',
              description:
                'Functional plant traits from databases like TRY and Restor. Only applicable to flora occurrences.',
            },
            projectRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI reference to the organization info record for the project this occurrence belongs to.',
            },
            siteRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI reference to the site record where this occurrence was observed.',
            },
            monitoringProgramme: {
              type: 'string',
              description:
                'Name of the monitoring programme under which this occurrence was recorded.',
              maxGraphemes: 256,
            },
            datasetRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI reference to a dataset record this occurrence belongs to.',
            },
            thumbnailUrl: {
              type: 'string',
              format: 'uri',
              description:
                'URL to a thumbnail image for display in lists and cards.',
            },
            speciesImageUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to a representative species image.',
            },
          },
        },
      },
    },
  },
  AppGainforestEvaluatorDefs: {
    lexicon: 1,
    id: 'app.gainforest.evaluator.defs',
    description:
      'Shared type definitions for decentralized evaluator services. Evaluators attach structured, typed evaluation data to records (a more sophisticated evolution of the labeler pattern).',
    defs: {
      subjectRef: {
        type: 'object',
        description: 'Reference to a target record that is being evaluated.',
        required: ['uri'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
            description: 'AT-URI of the target record.',
          },
          cid: {
            type: 'string',
            format: 'cid',
            description: 'CID pinning the exact version of the target record.',
          },
        },
      },
      methodInfo: {
        type: 'object',
        description:
          'Provenance metadata describing the method used to produce an evaluation.',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            maxGraphemes: 256,
            description:
              "Human-readable name of the method or model (e.g., 'GainForest BioClassifier').",
          },
          version: {
            type: 'string',
            maxGraphemes: 64,
            description:
              "Version string of the method or model (e.g., '2.1.0').",
          },
          modelCheckpoint: {
            type: 'string',
            maxGraphemes: 128,
            description:
              'Identifier for the specific model checkpoint used (e.g., date or hash).',
          },
          references: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri',
            },
            maxLength: 10,
            description:
              'URIs to papers, documentation, or repositories describing this method.',
          },
        },
      },
      candidateTaxon: {
        type: 'object',
        description:
          'A candidate taxon identification with confidence score and rank.',
        required: ['scientificName', 'confidence', 'rank'],
        properties: {
          scientificName: {
            type: 'string',
            maxGraphemes: 512,
            description: 'Full scientific name of the candidate taxon.',
          },
          gbifTaxonKey: {
            type: 'string',
            maxGraphemes: 64,
            description: 'GBIF backbone taxonomy key for the candidate.',
          },
          confidence: {
            type: 'integer',
            minimum: 0,
            maximum: 1000,
            description: 'Confidence score (0-1000, where 1000 = 100.0%).',
          },
          rank: {
            type: 'integer',
            minimum: 1,
            description: 'Rank position among candidates (1 = best match).',
          },
          kingdom: {
            type: 'string',
            maxGraphemes: 128,
            description: 'Kingdom of the candidate taxon.',
          },
          family: {
            type: 'string',
            maxGraphemes: 128,
            description: 'Family of the candidate taxon.',
          },
          genus: {
            type: 'string',
            maxGraphemes: 128,
            description: 'Genus of the candidate taxon.',
          },
        },
      },
      qualityFlag: {
        type: 'object',
        description:
          'A single data quality flag indicating an issue with a specific field.',
        required: ['field', 'issue'],
        properties: {
          field: {
            type: 'string',
            maxGraphemes: 64,
            description: 'The field name that has the quality issue.',
          },
          issue: {
            type: 'string',
            maxGraphemes: 256,
            description: 'Description of the quality issue.',
          },
          severity: {
            type: 'string',
            maxGraphemes: 64,
            knownValues: ['error', 'warning', 'info'],
            description: 'Severity level of the quality issue.',
          },
        },
      },
      derivedMeasurement: {
        type: 'object',
        description:
          'A single measurement derived by an evaluator from source data.',
        required: ['measurementType', 'measurementValue'],
        properties: {
          measurementType: {
            type: 'string',
            maxGraphemes: 256,
            description:
              "The nature of the measurement (e.g., 'canopy cover', 'NDVI', 'tree height').",
          },
          measurementValue: {
            type: 'string',
            maxGraphemes: 1024,
            description: 'The value of the measurement.',
          },
          measurementUnit: {
            type: 'string',
            maxGraphemes: 64,
            description:
              "The units for the measurement value (e.g., '%', 'm', 'kg').",
          },
          measurementMethod: {
            type: 'string',
            maxGraphemes: 1024,
            description:
              'Description of the method used to obtain the measurement.',
          },
        },
      },
      speciesIdResult: {
        type: 'object',
        description:
          'AI or human species recognition result with ranked candidate identifications.',
        required: ['candidates'],
        properties: {
          candidates: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.defs#candidateTaxon',
            },
            maxLength: 20,
            description: 'Ranked list of candidate species identifications.',
          },
          inputFeature: {
            type: 'string',
            maxGraphemes: 64,
            description:
              "Which feature of the subject record was used as input (e.g., 'mediaEvidence').",
          },
          remarks: {
            type: 'string',
            maxGraphemes: 2048,
            description: 'Additional notes about the species identification.',
          },
        },
      },
      dataQualityResult: {
        type: 'object',
        description:
          'Data quality assessment result with per-field quality flags.',
        required: ['flags'],
        properties: {
          flags: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.defs#qualityFlag',
            },
            maxLength: 50,
            description: 'List of quality issues found in the record.',
          },
          completenessScore: {
            type: 'integer',
            minimum: 0,
            maximum: 1000,
            description:
              'Overall completeness score (0-1000, where 1000 = 100.0%).',
          },
          remarks: {
            type: 'string',
            maxGraphemes: 2048,
            description: 'Additional notes about the quality assessment.',
          },
        },
      },
      verificationResult: {
        type: 'object',
        description:
          'Expert verification result for a previous identification or evaluation.',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            maxGraphemes: 64,
            knownValues: ['confirmed', 'rejected', 'uncertain'],
            description:
              'Verification status: confirmed, rejected, or uncertain.',
          },
          verifiedBy: {
            type: 'string',
            maxGraphemes: 256,
            description: 'Name of the person who performed the verification.',
          },
          verifiedByID: {
            type: 'string',
            maxGraphemes: 256,
            description: 'Persistent identifier (e.g., ORCID) of the verifier.',
          },
          remarks: {
            type: 'string',
            maxGraphemes: 2048,
            description: 'Notes about the verification decision.',
          },
          suggestedCorrections: {
            type: 'string',
            maxGraphemes: 5000,
            description:
              'Suggested corrections if the original identification was rejected or uncertain.',
          },
        },
      },
      classificationResult: {
        type: 'object',
        description:
          'Generic categorical classification result (e.g., conservation priority, habitat type).',
        required: ['category', 'value'],
        properties: {
          category: {
            type: 'string',
            maxGraphemes: 128,
            description:
              "The classification category (e.g., 'conservation-priority', 'habitat-type').",
          },
          value: {
            type: 'string',
            maxGraphemes: 256,
            description:
              "The assigned classification value (e.g., 'critical', 'tropical-rainforest').",
          },
          remarks: {
            type: 'string',
            maxGraphemes: 2048,
            description: 'Additional notes about the classification.',
          },
        },
      },
      measurementResult: {
        type: 'object',
        description:
          'Derived measurements produced by an evaluator from source data (e.g., remote sensing metrics).',
        required: ['measurements'],
        properties: {
          measurements: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.defs#derivedMeasurement',
            },
            maxLength: 20,
            description: 'List of derived measurements.',
          },
          remarks: {
            type: 'string',
            maxGraphemes: 2048,
            description: 'Additional notes about the measurements.',
          },
        },
      },
      bioacousticsDetection: {
        type: 'object',
        description: 'A single detection within an audio recording.',
        required: ['startTimeSeconds', 'endTimeSeconds'],
        properties: {
          startTimeSeconds: {
            type: 'string',
            maxGraphemes: 16,
            description: 'Start time in seconds from recording start.',
          },
          endTimeSeconds: {
            type: 'string',
            maxGraphemes: 16,
            description: 'End time in seconds from recording start.',
          },
          minFrequencyHz: {
            type: 'integer',
            minimum: 0,
            description: 'Lower frequency bound of detection in Hz.',
          },
          maxFrequencyHz: {
            type: 'integer',
            minimum: 0,
            description: 'Upper frequency bound of detection in Hz.',
          },
          scientificName: {
            type: 'string',
            maxGraphemes: 512,
            description: 'Identified species scientific name.',
          },
          commonName: {
            type: 'string',
            maxGraphemes: 256,
            description: 'Common name of the identified species.',
          },
          confidence: {
            type: 'integer',
            minimum: 0,
            maximum: 1000,
            description: 'Confidence score (0-1000, where 1000 = 100.0%).',
          },
          soundType: {
            type: 'string',
            maxGraphemes: 64,
            knownValues: [
              'call',
              'song',
              'alarm',
              'drumming',
              'echolocation',
              'stridulation',
              'anthropogenic',
              'geophony',
              'unknown',
            ],
            description: 'Type of sound detected.',
          },
        },
      },
      bioacousticsResult: {
        type: 'object',
        description: 'Result of audio-based species detection.',
        required: ['detections'],
        properties: {
          detections: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.defs#bioacousticsDetection',
            },
            maxLength: 100,
            description: 'Detected species/sounds within the audio recording.',
          },
          totalDurationAnalyzedSeconds: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Total audio duration analyzed in seconds.',
          },
          soundscapeIndex: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Acoustic diversity index value.',
          },
          remarks: {
            type: 'string',
            maxGraphemes: 2048,
            description: 'Additional notes about the bioacoustics analysis.',
          },
        },
      },
      deforestationResult: {
        type: 'object',
        description: 'Deforestation/land-use change detection result.',
        required: ['changeType'],
        properties: {
          changeType: {
            type: 'string',
            maxGraphemes: 64,
            knownValues: [
              'deforestation',
              'degradation',
              'reforestation',
              'afforestation',
              'no-change',
              'fire',
              'flooding',
              'urbanization',
            ],
            description: 'Type of land-use change detected.',
          },
          areaAffectedHectares: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Area affected by the change in hectares.',
          },
          changePercentage: {
            type: 'string',
            maxGraphemes: 16,
            description: 'Percentage of monitored area affected.',
          },
          detectionDate: {
            type: 'string',
            maxGraphemes: 64,
            description: 'ISO 8601 date of detection.',
          },
          baselineDate: {
            type: 'string',
            maxGraphemes: 64,
            description: 'ISO 8601 date of baseline comparison.',
          },
          satelliteSource: {
            type: 'string',
            maxGraphemes: 128,
            description:
              "Satellite data source (e.g., 'Sentinel-2', 'Landsat-8', 'Planet').",
          },
          remarks: {
            type: 'string',
            maxGraphemes: 2048,
            description: 'Additional notes about the deforestation detection.',
          },
        },
      },
      carbonEstimationResult: {
        type: 'object',
        description: 'Carbon stock or sequestration estimation.',
        required: ['estimationType', 'value', 'unit'],
        properties: {
          estimationType: {
            type: 'string',
            maxGraphemes: 64,
            knownValues: [
              'above-ground-biomass',
              'below-ground-biomass',
              'soil-carbon',
              'total-carbon-stock',
              'annual-sequestration',
              'avoided-emissions',
            ],
            description: 'Type of carbon estimation.',
          },
          value: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Estimated carbon value.',
          },
          unit: {
            type: 'string',
            maxGraphemes: 32,
            description:
              "Unit of the estimated value (e.g., 'tCO2e', 'tC/ha', 'tCO2e/year').",
          },
          uncertainty: {
            type: 'string',
            maxGraphemes: 32,
            description: "Uncertainty range (e.g., '±15%').",
          },
          methodology: {
            type: 'string',
            maxGraphemes: 512,
            description: 'Estimation methodology used.',
          },
          remarks: {
            type: 'string',
            maxGraphemes: 2048,
            description: 'Additional notes about the carbon estimation.',
          },
        },
      },
    },
  },
  AppGainforestEvaluatorEvaluation: {
    lexicon: 1,
    id: 'app.gainforest.evaluator.evaluation',
    description:
      'An evaluation record published by an evaluator in their own repo. Contains structured, typed results about a target record (or batch of records). Discovered by AppViews via the atproto-accept-evaluators HTTP header pattern.',
    defs: {
      main: {
        type: 'record',
        description:
          "A single evaluation produced by an evaluator service. Exactly one of 'subject' (single target) or 'subjects' (batch) must be provided.",
        key: 'tid',
        record: {
          type: 'object',
          required: ['evaluationType', 'createdAt'],
          properties: {
            subject: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.defs#subjectRef',
              description:
                'Single target record being evaluated. Use this OR subjects, not both.',
            },
            subjects: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:app.gainforest.evaluator.defs#subjectRef',
              },
              maxLength: 100,
              description:
                'Batch evaluation: multiple target records sharing the same result. Use this OR subject, not both.',
            },
            evaluationType: {
              type: 'string',
              maxGraphemes: 64,
              description:
                "Identifier for the type of evaluation (must match one declared in the evaluator's service record).",
            },
            result: {
              type: 'union',
              description:
                'The typed evaluation result. The $type field determines which result schema is used.',
              refs: [
                'lex:app.gainforest.evaluator.defs#speciesIdResult',
                'lex:app.gainforest.evaluator.defs#dataQualityResult',
                'lex:app.gainforest.evaluator.defs#verificationResult',
                'lex:app.gainforest.evaluator.defs#classificationResult',
                'lex:app.gainforest.evaluator.defs#measurementResult',
                'lex:app.gainforest.evaluator.defs#bioacousticsResult',
                'lex:app.gainforest.evaluator.defs#deforestationResult',
                'lex:app.gainforest.evaluator.defs#carbonEstimationResult',
              ],
            },
            confidence: {
              type: 'integer',
              minimum: 0,
              maximum: 1000,
              description:
                'Overall confidence in this evaluation (0-1000, where 1000 = 100.0%).',
            },
            method: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.defs#methodInfo',
              description:
                'Method/model provenance for this specific evaluation (overrides service-level method if set).',
            },
            neg: {
              type: 'boolean',
              description:
                'If true, this is a negation/withdrawal of a previous evaluation (like label negation).',
            },
            supersedes: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI of a previous evaluation record that this one supersedes (e.g., model re-run with improved version).',
            },
            dynamicProperties: {
              type: 'string',
              maxGraphemes: 10000,
              description:
                'Additional structured data as a JSON string. Escape hatch for experimental result types before they are formalized into the union.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp of when this evaluation was produced.',
            },
          },
        },
      },
    },
  },
  AppGainforestEvaluatorService: {
    lexicon: 1,
    id: 'app.gainforest.evaluator.service',
    description:
      "Declaration record published at rkey 'self' to register an account as an evaluator service. Analogous to app.bsky.labeler.service for labelers.",
    defs: {
      main: {
        type: 'record',
        description:
          'An evaluator service declaration. Publish at /app.gainforest.evaluator.service/self to declare this account as an evaluator.',
        key: 'literal:self',
        record: {
          type: 'object',
          required: ['policies', 'createdAt'],
          properties: {
            policies: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.service#evaluatorPolicies',
              description:
                "The evaluator's policies including supported evaluation types and access model.",
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Timestamp of when this evaluator service was declared.',
            },
          },
        },
      },
      evaluatorPolicies: {
        type: 'object',
        description:
          'Policies declaring what this evaluator does and how it operates.',
        required: ['evaluationTypes'],
        properties: {
          accessModel: {
            type: 'string',
            maxGraphemes: 64,
            knownValues: ['open', 'subscription'],
            description:
              "Whether this evaluator requires user subscription ('subscription') or processes all matching records ('open').",
          },
          evaluationTypes: {
            type: 'array',
            items: {
              type: 'string',
              maxGraphemes: 64,
            },
            maxLength: 20,
            description:
              "List of evaluation type identifiers this evaluator produces (e.g., 'species-id', 'data-quality').",
          },
          evaluationTypeDefinitions: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.service#evaluationTypeDefinition',
            },
            maxLength: 20,
            description:
              'Detailed definitions for each evaluation type, including human-readable descriptions.',
          },
          subjectCollections: {
            type: 'array',
            items: {
              type: 'string',
              maxGraphemes: 128,
            },
            maxLength: 20,
            description:
              "NSIDs of record collections this evaluator can evaluate (e.g., 'app.gainforest.dwc.occurrence').",
          },
        },
      },
      evaluationTypeDefinition: {
        type: 'object',
        description:
          'Definition of a single evaluation type produced by this evaluator.',
        required: ['identifier', 'resultType'],
        properties: {
          identifier: {
            type: 'string',
            maxGraphemes: 64,
            description:
              'The evaluation type identifier (must match an entry in evaluationTypes).',
          },
          resultType: {
            type: 'string',
            maxGraphemes: 128,
            description:
              "The lexicon reference for the result type (e.g., 'app.gainforest.evaluator.defs#speciesIdResult').",
          },
          method: {
            type: 'ref',
            ref: 'lex:app.gainforest.evaluator.defs#methodInfo',
            description:
              'Default method info for this evaluation type (can be overridden per-evaluation).',
          },
          locales: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:app.gainforest.evaluator.service#evaluationTypeLocale',
            },
            maxLength: 20,
            description:
              'Human-readable names and descriptions in various languages.',
          },
        },
      },
      evaluationTypeLocale: {
        type: 'object',
        description: 'Localized name and description for an evaluation type.',
        required: ['lang', 'name', 'description'],
        properties: {
          lang: {
            type: 'string',
            maxGraphemes: 16,
            description: "Language code (BCP-47, e.g., 'en', 'pt-BR').",
          },
          name: {
            type: 'string',
            maxGraphemes: 128,
            description: 'Short human-readable name for this evaluation type.',
          },
          description: {
            type: 'string',
            maxGraphemes: 2048,
            description:
              'Longer description of what this evaluation type does.',
          },
        },
      },
    },
  },
  AppGainforestEvaluatorSubscription: {
    lexicon: 1,
    id: 'app.gainforest.evaluator.subscription',
    description:
      'A subscription record published by a user in their own repo to request evaluations from a specific evaluator service. The evaluator detects subscriptions via Jetstream and processes matching records. Deleting this record unsubscribes.',
    defs: {
      main: {
        type: 'record',
        description:
          'User subscription to an evaluator service. Published by the user (not the evaluator) to declare they want evaluations.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['evaluator', 'createdAt'],
          properties: {
            evaluator: {
              type: 'string',
              format: 'did',
              description: 'DID of the evaluator service to subscribe to.',
            },
            collections: {
              type: 'array',
              items: {
                type: 'string',
                maxGraphemes: 128,
              },
              maxLength: 20,
              description:
                "Which of the user's record collections should be evaluated (NSIDs). Must be a subset of the evaluator's subjectCollections. If omitted, all supported collections are evaluated.",
            },
            evaluationTypes: {
              type: 'array',
              items: {
                type: 'string',
                maxGraphemes: 64,
              },
              maxLength: 20,
              description:
                'Which evaluation types the user wants. If omitted, all types the evaluator supports are applied.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp of when this subscription was created.',
            },
          },
        },
      },
    },
  },
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
          required: ['site', 'createdAt'],
          properties: {
            site: {
              type: 'string',
              format: 'at-uri',
              description:
                'The reference to the default site record in the PDS',
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationDonation: {
    lexicon: 1,
    id: 'app.gainforest.organization.donation',
    defs: {
      main: {
        type: 'record',
        description:
          'A record of a donation or financial transaction for financial transparency',
        key: 'tid',
        record: {
          type: 'object',
          required: [
            'donorIdentifier',
            'amount',
            'currency',
            'donatedAt',
            'createdAt',
          ],
          properties: {
            donorIdentifier: {
              type: 'string',
              description:
                'Unique identifier for the donor (DID, email hash, or anonymous token)',
              maxGraphemes: 256,
            },
            amount: {
              type: 'integer',
              description:
                'Donation amount in the smallest unit of the currency (e.g., cents for USD)',
              minimum: 0,
            },
            currency: {
              type: 'string',
              description: "Currency code (e.g., 'USD', 'EUR', 'CELO', 'SOL')",
              maxGraphemes: 16,
            },
            donatedAt: {
              type: 'string',
              description: 'When the donation was made',
              format: 'datetime',
            },
            createdAt: {
              type: 'string',
              description: 'Record creation timestamp',
              format: 'datetime',
            },
            donorName: {
              type: 'string',
              description: 'Donor name (may be anonymous)',
              maxGraphemes: 256,
            },
            donorDid: {
              type: 'string',
              description: "Donor's ATProto DID if they have an account",
              format: 'did',
            },
            recipientMemberRef: {
              type: 'string',
              description: 'AT-URI to the member record who received funds',
              format: 'at-uri',
            },
            transactionType: {
              type: 'string',
              description: 'Type of transaction',
              maxGraphemes: 32,
              knownValues: ['fiat', 'crypto', 'grant', 'in-kind', 'other'],
            },
            paymentMethod: {
              type: 'string',
              description: 'Payment method used for the donation',
              maxGraphemes: 64,
              knownValues: [
                'stripe',
                'bank-transfer',
                'celo',
                'solana',
                'ethereum',
                'polygon',
                'paypal',
                'other',
              ],
            },
            transactionHash: {
              type: 'string',
              description: 'Blockchain transaction hash if crypto',
              maxGraphemes: 256,
            },
            blockchainNetwork: {
              type: 'string',
              description: 'Blockchain network the transaction was made on',
              maxGraphemes: 32,
              knownValues: ['celo', 'solana', 'ethereum', 'polygon', 'other'],
            },
            purpose: {
              type: 'string',
              description:
                "What the donation is for (e.g., 'tree planting', 'equipment', 'salaries')",
              maxGraphemes: 512,
            },
            isAnonymous: {
              type: 'boolean',
              description: 'Whether the donor wishes to remain anonymous',
            },
            receiptUrl: {
              type: 'string',
              description: 'URL to donation receipt',
              format: 'uri',
              maxGraphemes: 512,
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
              maxGraphemes: 2048,
            },
            amountUsd: {
              type: 'string',
              description: 'Equivalent amount in USD at time of donation',
              maxGraphemes: 32,
            },
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
                  ref: 'lex:app.gainforest.common.defs#indexedOrganization',
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
            'country',
            'visibility',
            'createdAt',
          ],
          properties: {
            displayName: {
              type: 'string',
              description: 'The name of the organization or project',
              minLength: 8,
              maxLength: 255,
            },
            shortDescription: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#richtext',
              description: 'The description of the organization or project',
            },
            longDescription: {
              type: 'ref',
              ref: 'lex:pub.leaflet.pages.linearDocument',
              description:
                'The long description of the organization or project in richtext',
            },
            coverImage: {
              type: 'ref',
              ref: 'lex:org.hypercerts.defs#smallImage',
              description: 'Cover image for the organization',
            },
            logo: {
              type: 'ref',
              ref: 'lex:org.hypercerts.defs#smallImage',
              description: 'Logo for the organization',
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
              description:
                'The visibility of the organization or project in the Green Globe',
              enum: ['Public', 'Unlisted'],
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
            email: {
              type: 'string',
              description: 'Contact email for the organization',
              maxGraphemes: 256,
            },
            socialLinks: {
              type: 'array',
              description: 'Social media links for the organization',
              maxLength: 10,
              items: {
                type: 'ref',
                ref: 'lex:app.gainforest.organization.info#socialLink',
              },
            },
            discordId: {
              type: 'string',
              description: 'Discord server ID for the organization',
              maxGraphemes: 64,
            },
            stripeUrl: {
              type: 'string',
              description: 'Donation link for the organization',
              format: 'uri',
              maxGraphemes: 512,
            },
            teamSize: {
              type: 'integer',
              description: 'Number of team members in the organization',
              minimum: 1,
            },
            foundedYear: {
              type: 'integer',
              description: 'Year the organization was founded',
              minimum: 1900,
              maximum: 2100,
            },
            ecosystemTypes: {
              type: 'array',
              description: 'Types of ecosystems the organization works in',
              maxLength: 10,
              items: {
                type: 'string',
                maxGraphemes: 128,
                knownValues: [
                  'tropical-rainforest',
                  'temperate-forest',
                  'boreal-forest',
                  'mangrove',
                  'coral-reef',
                  'savanna',
                  'grassland',
                  'wetland',
                  'desert',
                  'alpine',
                  'marine',
                  'freshwater',
                  'urban',
                  'agroforestry',
                  'other',
                ],
              },
            },
            focusSpeciesGroups: {
              type: 'array',
              description: 'Species groups the organization focuses on',
              maxLength: 20,
              items: {
                type: 'string',
                maxGraphemes: 64,
                knownValues: [
                  'mammals',
                  'birds',
                  'reptiles',
                  'amphibians',
                  'fish',
                  'insects',
                  'arachnids',
                  'mollusks',
                  'crustaceans',
                  'trees',
                  'shrubs',
                  'herbs',
                  'grasses',
                  'ferns',
                  'mosses',
                  'fungi',
                  'algae',
                  'coral',
                  'other',
                ],
              },
            },
            dataLicense: {
              type: 'string',
              description:
                'Default license for data published by the organization',
              maxGraphemes: 256,
            },
            dataDownloadUrl: {
              type: 'string',
              description: "URL to download the organization's data",
              format: 'uri',
              maxGraphemes: 512,
            },
            dataDownloadInfo: {
              type: 'string',
              description: 'Description of available data downloads',
              maxGraphemes: 1024,
            },
            fundingSourcesDescription: {
              type: 'string',
              description: "Description of the organization's funding sources",
              maxGraphemes: 2048,
            },
          },
        },
      },
      socialLink: {
        type: 'object',
        description: 'A social media link for an organization',
        required: ['platform', 'url'],
        properties: {
          platform: {
            type: 'string',
            description: 'The social media platform',
            maxGraphemes: 64,
            knownValues: [
              'twitter',
              'instagram',
              'facebook',
              'linkedin',
              'youtube',
              'tiktok',
              'github',
              'discord',
              'telegram',
              'other',
            ],
          },
          url: {
            type: 'string',
            description: 'The URL of the social media profile or page',
            format: 'uri',
            maxGraphemes: 512,
          },
        },
      },
    },
  },
  AppGainforestOrganizationLayer: {
    lexicon: 1,
    id: 'app.gainforest.organization.layer',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of a layer for an organization',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'type', 'uri', 'createdAt'],
          properties: {
            name: {
              type: 'string',
              maxGraphemes: 256,
              description: 'The name of the site',
            },
            type: {
              type: 'string',
              description: 'The type of the layer',
              enum: [
                'geojson_points',
                'geojson_points_trees',
                'geojson_line',
                'choropleth',
                'choropleth_shannon',
                'raster_tif',
                'tms_tile',
                'heatmap',
                'contour',
                'satellite_overlay',
              ],
            },
            uri: {
              type: 'string',
              format: 'uri',
              description: 'The URI of the layer',
            },
            description: {
              type: 'string',
              maxGraphemes: 2048,
              description: 'The description of the layer',
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
            category: {
              type: 'string',
              maxGraphemes: 128,
              description:
                "Layer category for grouping in UI (e.g., 'Biodiversity', 'Land Cover', 'Climate', 'Infrastructure')",
            },
            displayOrder: {
              type: 'integer',
              minimum: 0,
              description: 'Ordering priority for display',
            },
            isDefault: {
              type: 'boolean',
              description: 'Whether this layer should be shown by default',
            },
            opacity: {
              type: 'string',
              maxGraphemes: 8,
              description: "Default opacity (0-1 as string, e.g., '0.7')",
            },
            thumbnail: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#imageThumbnail',
              description: 'Preview thumbnail for the layer',
            },
            legend: {
              type: 'array',
              maxLength: 20,
              description: 'Legend entries for the layer',
              items: {
                type: 'ref',
                ref: 'lex:app.gainforest.organization.layer#legendEntry',
              },
            },
            colorScale: {
              type: 'string',
              maxGraphemes: 64,
              description: 'Named color scale for continuous data',
              knownValues: [
                'viridis',
                'plasma',
                'inferno',
                'magma',
                'cividis',
                'turbo',
                'spectral',
                'rdylgn',
                'rdylbu',
                'custom',
              ],
            },
            unit: {
              type: 'string',
              maxGraphemes: 64,
              description:
                "Unit of measurement for the layer data (e.g., 'species/ha', 'kg C/m²', 'mm/year')",
            },
            minValue: {
              type: 'string',
              maxGraphemes: 32,
              description: 'Minimum value in the data range',
            },
            maxValue: {
              type: 'string',
              maxGraphemes: 32,
              description: 'Maximum value in the data range',
            },
            tilePattern: {
              type: 'string',
              maxGraphemes: 512,
              description:
                "URL pattern for TMS tiles (e.g., 'https://tiles.example.com/{z}/{x}/{y}.png')",
            },
            tileMinZoom: {
              type: 'integer',
              minimum: 0,
              maximum: 22,
              description: 'Minimum zoom level',
            },
            tileMaxZoom: {
              type: 'integer',
              minimum: 0,
              maximum: 22,
              description: 'Maximum zoom level',
            },
            bounds: {
              type: 'string',
              maxGraphemes: 128,
              description: "Bounding box as 'west,south,east,north'",
            },
            dataSource: {
              type: 'string',
              maxGraphemes: 512,
              description: 'Attribution/source of the layer data',
            },
            dataDate: {
              type: 'string',
              maxGraphemes: 64,
              description: 'Date of the data (ISO 8601)',
            },
            propertyKey: {
              type: 'string',
              maxGraphemes: 128,
              description:
                "GeoJSON property key to use for choropleth coloring (e.g., 'species_richness')",
            },
            siteRef: {
              type: 'string',
              format: 'at-uri',
              description: 'AT-URI reference to the site this layer belongs to',
            },
          },
        },
      },
      legendEntry: {
        type: 'object',
        description: 'A single entry in a layer legend',
        required: ['label', 'color'],
        properties: {
          label: {
            type: 'string',
            maxGraphemes: 128,
            description: 'Display label for this legend entry',
          },
          color: {
            type: 'string',
            maxGraphemes: 16,
            description: "Color for this legend entry (e.g., '#FF5733')",
          },
          value: {
            type: 'string',
            maxGraphemes: 64,
            description: 'Optional value associated with this legend entry',
          },
        },
      },
    },
  },
  AppGainforestOrganizationMember: {
    lexicon: 1,
    id: 'app.gainforest.organization.member',
    defs: {
      main: {
        type: 'record',
        description: 'A community or team member of an organization',
        key: 'tid',
        record: {
          type: 'object',
          required: ['displayName', 'role', 'did', 'createdAt'],
          properties: {
            displayName: {
              type: 'string',
              description: 'Full display name of the member',
              maxGraphemes: 256,
            },
            role: {
              type: 'string',
              description:
                'Role or title of the member within the organization',
              maxGraphemes: 128,
            },
            createdAt: {
              type: 'string',
              description: 'The date and time the record was created',
              format: 'datetime',
            },
            firstName: {
              type: 'string',
              description: 'First name of the member',
              maxGraphemes: 128,
            },
            lastName: {
              type: 'string',
              description: 'Last name of the member',
              maxGraphemes: 128,
            },
            bio: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#richtext',
              description: 'Biography of the member',
            },
            profileImage: {
              type: 'ref',
              ref: 'lex:org.hypercerts.defs#smallImage',
              description: 'Profile photo of the member',
            },
            email: {
              type: 'string',
              description: 'Contact email address of the member',
              maxGraphemes: 256,
            },
            orcid: {
              type: 'string',
              description: 'ORCID identifier of the member',
              maxGraphemes: 64,
            },
            did: {
              type: 'string',
              description: 'ATProto DID if the member has their own account',
              format: 'did',
            },
            expertise: {
              type: 'array',
              description:
                "Areas of expertise (e.g. 'botany', 'remote sensing', 'community engagement')",
              maxLength: 10,
              items: {
                type: 'string',
                maxGraphemes: 128,
              },
            },
            languages: {
              type: 'array',
              description: 'Languages spoken by the member as BCP-47 codes',
              maxLength: 10,
              items: {
                type: 'string',
                maxGraphemes: 32,
              },
            },
            displayOrder: {
              type: 'integer',
              description:
                'Ordering priority for display (lower values appear first)',
              minimum: 0,
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether this member profile is publicly visible',
            },
            joinedAt: {
              type: 'string',
              description: 'When the member joined the organization',
              format: 'datetime',
            },
            walletAddresses: {
              type: 'array',
              description: 'Blockchain wallet addresses for receiving funds',
              maxLength: 5,
              items: {
                type: 'ref',
                ref: 'lex:app.gainforest.organization.member#walletAddress',
              },
            },
          },
        },
      },
      walletAddress: {
        type: 'object',
        description: 'A blockchain wallet address for receiving funds',
        required: ['chain', 'address'],
        properties: {
          chain: {
            type: 'string',
            description: 'The blockchain network for this wallet address',
            maxGraphemes: 32,
            knownValues: ['celo', 'solana', 'ethereum', 'polygon', 'other'],
          },
          address: {
            type: 'string',
            description: 'The wallet address on the specified chain',
            maxGraphemes: 256,
          },
        },
      },
    },
  },
  AppGainforestOrganizationObservationsDendogram: {
    lexicon: 1,
    id: 'app.gainforest.organization.observations.dendogram',
    defs: {
      main: {
        type: 'record',
        description:
          'A declaration of a dendogram observation for an organization',
        key: 'literal:self',
        record: {
          type: 'object',
          required: ['dendogram', 'createdAt'],
          properties: {
            dendogram: {
              type: 'ref',
              ref: 'lex:org.hypercerts.defs#smallBlob',
              description: 'An SVG of the dendogram uploaded as blob',
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
            name: {
              type: 'string',
              maxGraphemes: 256,
              description:
                "Name or title of the dendogram (e.g., 'Flora Phylogenetic Tree - Site A 2025')",
            },
            description: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#richtext',
              description: 'Description of what this dendogram shows',
            },
            siteRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI reference to the site this dendogram represents',
            },
            analysisDate: {
              type: 'string',
              format: 'datetime',
              description: 'When the phylogenetic analysis was performed',
            },
            analysisMethod: {
              type: 'string',
              maxGraphemes: 512,
              description:
                "Method used to generate the dendogram (e.g., 'Maximum Likelihood with RAxML', 'Neighbor-Joining')",
            },
            dataSource: {
              type: 'string',
              maxGraphemes: 256,
              description:
                'Source of the sequence or trait data used in the analysis',
            },
            taxonCount: {
              type: 'integer',
              minimum: 0,
              description: 'Number of taxa represented in the dendogram',
            },
            rootTaxon: {
              type: 'string',
              maxGraphemes: 256,
              description: "The root taxon of the tree (e.g., 'Plantae')",
            },
            treeType: {
              type: 'string',
              maxGraphemes: 64,
              knownValues: [
                'phylogenetic',
                'phenetic',
                'cladistic',
                'functional-trait',
                'other',
              ],
              description: 'Type of tree represented in the dendogram',
            },
            thumbnail: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#imageThumbnail',
              description: 'Thumbnail preview image of the dendogram',
            },
            taxonGroups: {
              type: 'array',
              maxLength: 10,
              description:
                'Which taxonomic groups are represented in the dendogram',
              items: {
                type: 'string',
                maxGraphemes: 64,
                knownValues: [
                  'flora',
                  'fauna',
                  'fungi',
                  'bacteria',
                  'archaea',
                  'protista',
                  'chromista',
                ],
              },
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationObservationsFauna: {
    lexicon: 1,
    id: 'app.gainforest.organization.observations.fauna',
    defs: {
      main: {
        type: 'record',
        description:
          'DEPRECATED: Use app.gainforest.dwc.occurrence instead. A declaration of a fauna observation for an organization.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['gbifTaxonKeys', 'createdAt'],
          properties: {
            gbifTaxonKeys: {
              type: 'array',
              description:
                'An array of GBIF taxon keys for each fauna observation',
              items: {
                type: 'string',
                description: 'The GBIF taxon key of the fauna observation',
              },
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationObservationsFlora: {
    lexicon: 1,
    id: 'app.gainforest.organization.observations.flora',
    defs: {
      main: {
        type: 'record',
        description:
          'DEPRECATED: Use app.gainforest.dwc.occurrence instead. A declaration of a flora observation for an organization.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['gbifTaxonKeys', 'createdAt'],
          properties: {
            gbifTaxonKeys: {
              type: 'array',
              description:
                'An array of GBIF taxon keys for each flora observation',
              items: {
                type: 'string',
                description: 'The GBIF taxon key of the flora observation',
              },
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationObservationsMeasuredTreesCluster: {
    lexicon: 1,
    id: 'app.gainforest.organization.observations.measuredTreesCluster',
    defs: {
      main: {
        type: 'record',
        description:
          'A declaration of a measured trees cluster for an organization',
        key: 'tid',
        record: {
          type: 'object',
          required: ['shapefile', 'createdAt'],
          properties: {
            shapefile: {
              type: 'ref',
              ref: 'lex:org.hypercerts.defs#smallBlob',
              description:
                'A blob pointing to a shapefile of the measured trees cluster',
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
            name: {
              type: 'string',
              maxGraphemes: 256,
              description:
                "Name of the tree cluster/plot (e.g., 'Plot A - Riparian Zone')",
            },
            description: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#richtext',
              description: 'Description of the cluster',
            },
            siteRef: {
              type: 'string',
              format: 'at-uri',
              description:
                'AT-URI reference to the site this cluster belongs to',
            },
            decimalLatitude: {
              type: 'string',
              maxGraphemes: 32,
              description: 'Centroid latitude of the cluster',
            },
            decimalLongitude: {
              type: 'string',
              maxGraphemes: 32,
              description: 'Centroid longitude of the cluster',
            },
            areaSqMeters: {
              type: 'string',
              maxGraphemes: 32,
              description: 'Area of the cluster in square meters',
            },
            totalTreeCount: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of measured trees in the cluster',
            },
            speciesCount: {
              type: 'integer',
              minimum: 0,
              description: 'Number of distinct species in the cluster',
            },
            averageHeightMeters: {
              type: 'string',
              maxGraphemes: 16,
              description: 'Average tree height in meters',
            },
            averageDbhCm: {
              type: 'string',
              maxGraphemes: 16,
              description: 'Average diameter at breast height in cm',
            },
            dominantSpecies: {
              type: 'string',
              maxGraphemes: 256,
              description: 'Most common species scientific name',
            },
            measurementDateRange: {
              type: 'string',
              maxGraphemes: 64,
              description: 'Date range of measurements (ISO 8601 interval)',
            },
            measuredBy: {
              type: 'string',
              maxGraphemes: 512,
              description: 'Person(s) who measured the trees (pipe-delimited)',
            },
            measurementProtocol: {
              type: 'string',
              maxGraphemes: 1024,
              description: 'Description of the measurement protocol used',
            },
            dataSource: {
              type: 'string',
              maxGraphemes: 256,
              description:
                "Source of the data (e.g., 'KoBoToolbox', 'field survey')",
            },
            license: {
              type: 'string',
              maxGraphemes: 256,
              description: 'Data license',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationPredictionsFauna: {
    lexicon: 1,
    id: 'app.gainforest.organization.predictions.fauna',
    defs: {
      main: {
        type: 'record',
        description:
          "DEPRECATED: Use app.gainforest.dwc.occurrence with basisOfRecord='MachineObservation' instead. A declaration of a fauna prediction for an organization.",
        key: 'tid',
        record: {
          type: 'object',
          required: ['gbifTaxonKeys', 'createdAt'],
          properties: {
            gbifTaxonKeys: {
              type: 'array',
              description:
                'An array of GBIF taxon keys for each fauna prediction',
              items: {
                type: 'string',
                description: 'The GBIF taxon key of the fauna prediction',
              },
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationPredictionsFlora: {
    lexicon: 1,
    id: 'app.gainforest.organization.predictions.flora',
    defs: {
      main: {
        type: 'record',
        description:
          "DEPRECATED: Use app.gainforest.dwc.occurrence with basisOfRecord='MachineObservation' instead. A declaration of a flora prediction for an organization.",
        key: 'tid',
        record: {
          type: 'object',
          required: ['gbifTaxonKeys', 'createdAt'],
          properties: {
            gbifTaxonKeys: {
              type: 'array',
              description:
                'An array of GBIF taxon keys for each flora prediction',
              items: {
                type: 'string',
                description: 'The GBIF taxon key of the flora prediction',
              },
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  AppGainforestOrganizationRecordingsAudio: {
    lexicon: 1,
    id: 'app.gainforest.organization.recordings.audio',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of an audio recording',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'blob', 'metadata', 'createdAt'],
          properties: {
            name: {
              type: 'string',
              maxGraphemes: 256,
              description: 'A short name for the audio recording',
            },
            description: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#richtext',
              description: 'A description of the audio recording',
            },
            blob: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#audio',
              description: 'The blob of the audio recording',
            },
            metadata: {
              type: 'ref',
              ref: 'lex:app.gainforest.organization.recordings.audio#metadata',
              description: 'The metadata of the audio recording',
            },
            createdAt: {
              type: 'string',
              description: 'The date and time of the creation of the record',
              format: 'datetime',
            },
            spectrogram: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#spectrogram',
              description: 'Spectrogram image of the recording',
            },
            thumbnail: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#imageThumbnail',
              description: 'Thumbnail image for display',
            },
            license: {
              type: 'string',
              maxGraphemes: 256,
              description: 'License for the recording (e.g., CC-BY-4.0)',
            },
            recordedBy: {
              type: 'string',
              maxGraphemes: 512,
              description: 'Person(s) who made the recording',
            },
            tags: {
              type: 'array',
              maxLength: 20,
              items: {
                type: 'string',
                maxGraphemes: 64,
              },
              description:
                "Freeform tags for the recording (e.g., 'dawn-chorus', 'rain', 'chainsaw')",
            },
          },
        },
      },
      metadata: {
        type: 'object',
        required: ['codec', 'channels', 'duration', 'recordedAt', 'sampleRate'],
        properties: {
          codec: {
            type: 'string',
            maxGraphemes: 32,
            description: 'The codec of the audio recording',
          },
          channels: {
            type: 'integer',
            minimum: 1,
            description: 'The number of channels of the audio recording',
          },
          duration: {
            type: 'string',
            maxGraphemes: 32,
            description: 'The duration of the audio recording in seconds',
          },
          recordedAt: {
            type: 'string',
            description: 'The date and time of the recording',
            format: 'datetime',
          },
          sampleRate: {
            type: 'integer',
            minimum: 1,
            description: 'The sample rate of the audio recording',
          },
          coordinates: {
            type: 'string',
            maxGraphemes: 64,
            description:
              "Deprecated: prefer decimalLatitude and decimalLongitude fields. The coordinates at which the audio was recorded in the format 'latitude,longitude' OR 'latitude,longitude,altitude'",
          },
          deviceModel: {
            type: 'string',
            maxGraphemes: 128,
            description:
              "Recording device model (e.g., 'AudioMoth 1.2.0', 'Song Meter SM4')",
          },
          deviceSerialNumber: {
            type: 'string',
            maxGraphemes: 64,
            description: 'Device serial number for tracking',
          },
          gain: {
            type: 'string',
            maxGraphemes: 32,
            description: "Gain setting (e.g., 'medium', '36dB')",
          },
          bitDepth: {
            type: 'integer',
            minimum: 8,
            maximum: 64,
            description: 'Bits per sample (e.g., 16, 24, 32)',
          },
          fileFormat: {
            type: 'string',
            maxGraphemes: 32,
            description: "File format (e.g., 'WAV', 'FLAC', 'MP3')",
          },
          fileSizeBytes: {
            type: 'integer',
            minimum: 0,
            description: 'File size in bytes',
          },
          decimalLatitude: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Latitude in decimal degrees (WGS84)',
          },
          decimalLongitude: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Longitude in decimal degrees (WGS84)',
          },
          altitude: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Altitude in meters',
          },
          habitat: {
            type: 'string',
            maxGraphemes: 512,
            description: 'Habitat description',
          },
          siteRef: {
            type: 'string',
            format: 'at-uri',
            description: 'AT-URI reference to the organization site record',
          },
          minFrequencyHz: {
            type: 'integer',
            minimum: 0,
            description: 'Minimum frequency in recording (Hz)',
          },
          maxFrequencyHz: {
            type: 'integer',
            minimum: 0,
            description: 'Maximum frequency in recording (Hz)',
          },
          signalToNoiseRatio: {
            type: 'string',
            maxGraphemes: 32,
            description: 'Signal-to-noise ratio in dB',
          },
          weatherConditions: {
            type: 'string',
            maxGraphemes: 256,
            description: 'Weather conditions during recording',
          },
          temperature: {
            type: 'string',
            maxGraphemes: 16,
            description: 'Temperature in Celsius during recording',
          },
          humidity: {
            type: 'string',
            maxGraphemes: 16,
            description: 'Relative humidity percentage during recording',
          },
          windSpeed: {
            type: 'string',
            maxGraphemes: 16,
            description: 'Wind speed during recording',
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
        description:
          'A declaration of a site for an organization, with optional environmental and location context',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'lat', 'lon', 'area', 'shapefile', 'createdAt'],
          properties: {
            name: {
              type: 'string',
              maxGraphemes: 256,
              description: 'The name of the site',
            },
            lat: {
              type: 'string',
              maxGraphemes: 32,
              description: 'The latitude of the centerpoint of the site',
            },
            lon: {
              type: 'string',
              maxGraphemes: 32,
              description: 'The longitude of the centerpoint of the site',
            },
            area: {
              type: 'string',
              maxGraphemes: 64,
              description: 'The area of the site in hectares',
            },
            shapefile: {
              type: 'ref',
              ref: 'lex:org.hypercerts.defs#smallBlob',
              description:
                'A blob pointing to a GeoJSON file containing the site boundaries',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'The date and time of the creation of the record',
            },
            country: {
              type: 'string',
              maxGraphemes: 128,
              description: 'The country where the site is located',
            },
            countryCode: {
              type: 'string',
              minLength: 2,
              maxLength: 2,
              description: 'ISO 3166-1 alpha-2 country code',
            },
            stateProvince: {
              type: 'string',
              maxGraphemes: 256,
              description:
                'The first-level administrative division (state, province, region) where the site is located',
            },
            locality: {
              type: 'string',
              maxGraphemes: 1024,
              description: 'Specific locality description for the site',
            },
            minimumElevationInMeters: {
              type: 'integer',
              description: 'The lower elevation bound of the site in meters',
            },
            maximumElevationInMeters: {
              type: 'integer',
              description: 'The upper elevation bound of the site in meters',
            },
            biome: {
              type: 'string',
              maxGraphemes: 128,
              knownValues: [
                'tropical-moist-forest',
                'tropical-dry-forest',
                'temperate-broadleaf-forest',
                'temperate-conifer-forest',
                'boreal-forest',
                'tropical-grassland-savanna',
                'temperate-grassland',
                'flooded-grassland',
                'montane-grassland',
                'tundra',
                'mediterranean-forest',
                'desert-xeric-shrubland',
                'mangrove',
                'coral-reef',
                'freshwater',
                'marine',
                'other',
              ],
              description: 'The biome classification of the site',
            },
            ecosystemType: {
              type: 'string',
              maxGraphemes: 128,
              description:
                'Freeform description of the ecosystem type at the site',
            },
            protectionStatus: {
              type: 'string',
              maxGraphemes: 128,
              knownValues: [
                'national-park',
                'nature-reserve',
                'wildlife-sanctuary',
                'biosphere-reserve',
                'world-heritage',
                'ramsar-site',
                'community-conserved',
                'indigenous-territory',
                'private-reserve',
                'buffer-zone',
                'unprotected',
                'other',
              ],
              description: 'The protection status of the site',
            },
            iucnProtectedAreaCategory: {
              type: 'string',
              maxGraphemes: 16,
              knownValues: ['Ia', 'Ib', 'II', 'III', 'IV', 'V', 'VI'],
              description: 'The IUCN protected area management category',
            },
            wdpaId: {
              type: 'string',
              maxGraphemes: 32,
              description:
                'The World Database on Protected Areas (WDPA) identifier for the site',
            },
            averageAnnualRainfallMm: {
              type: 'integer',
              minimum: 0,
              description:
                'The average annual rainfall at the site in millimeters',
            },
            averageTemperatureCelsius: {
              type: 'string',
              maxGraphemes: 16,
              description:
                'The average annual temperature at the site in degrees Celsius',
            },
            climatezone: {
              type: 'string',
              maxGraphemes: 64,
              description: 'The Koppen climate classification for the site',
            },
            monitoringStartDate: {
              type: 'string',
              format: 'datetime',
              description:
                'The date and time when monitoring of the site began',
            },
            description: {
              type: 'ref',
              ref: 'lex:app.gainforest.common.defs#richtext',
              description: 'A rich text description of the site',
            },
            boundary: {
              type: 'string',
              format: 'uri',
              maxGraphemes: 512,
              description:
                'URL to a boundary GeoJSON file (alternative to the shapefile blob)',
            },
            siteRemarks: {
              type: 'string',
              maxGraphemes: 5000,
              description: 'Additional notes or remarks about the site',
            },
          },
        },
      },
    },
  },
  ComAtprotoRepoStrongRef: {
    lexicon: 1,
    id: 'com.atproto.repo.strongRef',
    description: 'A URI with a content-hash fingerprint.',
    defs: {
      main: {
        type: 'object',
        required: ['uri', 'cid'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          cid: {
            type: 'string',
            format: 'cid',
          },
        },
      },
    },
  },
  OrgHypercertsDefs: {
    lexicon: 1,
    id: 'org.hypercerts.defs',
    defs: {
      uri: {
        type: 'object',
        required: ['uri'],
        description: 'Object containing a URI to external data',
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
            maxGraphemes: 1024,
            description: 'URI to external data',
          },
        },
      },
      smallBlob: {
        type: 'object',
        required: ['blob'],
        description: 'Object containing a blob to external data',
        properties: {
          blob: {
            type: 'blob',
            accept: ['*/*'],
            maxSize: 10485760,
            description: 'Blob to external data (up to 10MB)',
          },
        },
      },
      largeBlob: {
        type: 'object',
        required: ['blob'],
        description: 'Object containing a blob to external data',
        properties: {
          blob: {
            type: 'blob',
            accept: ['*/*'],
            maxSize: 104857600,
            description: 'Blob to external data (up to 100MB)',
          },
        },
      },
      smallImage: {
        type: 'object',
        required: ['image'],
        description: 'Object containing a small image',
        properties: {
          image: {
            type: 'blob',
            accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            maxSize: 5242880,
            description: 'Image (up to 5MB)',
          },
        },
      },
      largeImage: {
        type: 'object',
        required: ['image'],
        description: 'Object containing a large image',
        properties: {
          image: {
            type: 'blob',
            accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            maxSize: 10485760,
            description: 'Image (up to 10MB)',
          },
        },
      },
    },
  },
  PubLeafletBlocksBlockquote: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.blockquote',
    defs: {
      main: {
        type: 'object',
        required: ['plaintext'],
        properties: {
          plaintext: {
            type: 'string',
          },
          facets: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:pub.leaflet.richtext.facet',
            },
          },
        },
      },
    },
  },
  PubLeafletBlocksBskyPost: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.bskyPost',
    defs: {
      main: {
        type: 'object',
        required: ['postRef'],
        properties: {
          postRef: {
            type: 'ref',
            ref: 'lex:com.atproto.repo.strongRef',
          },
        },
      },
    },
  },
  PubLeafletBlocksButton: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.button',
    defs: {
      main: {
        type: 'object',
        required: ['text', 'url'],
        properties: {
          text: {
            type: 'string',
          },
          url: {
            type: 'string',
            format: 'uri',
          },
        },
      },
    },
  },
  PubLeafletBlocksCode: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.code',
    defs: {
      main: {
        type: 'object',
        required: ['plaintext'],
        properties: {
          plaintext: {
            type: 'string',
          },
          language: {
            type: 'string',
          },
          syntaxHighlightingTheme: {
            type: 'string',
          },
        },
      },
    },
  },
  PubLeafletBlocksHeader: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.header',
    defs: {
      main: {
        type: 'object',
        required: ['plaintext'],
        properties: {
          level: {
            type: 'integer',
            minimum: 1,
            maximum: 6,
          },
          plaintext: {
            type: 'string',
          },
          facets: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:pub.leaflet.richtext.facet',
            },
          },
        },
      },
    },
  },
  PubLeafletBlocksHorizontalRule: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.horizontalRule',
    defs: {
      main: {
        type: 'object',
        required: [],
        properties: {},
      },
    },
  },
  PubLeafletBlocksIframe: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.iframe',
    defs: {
      main: {
        type: 'object',
        required: ['url'],
        properties: {
          url: {
            type: 'string',
            format: 'uri',
          },
          height: {
            type: 'integer',
            minimum: 16,
            maximum: 1600,
          },
        },
      },
    },
  },
  PubLeafletBlocksImage: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.image',
    defs: {
      main: {
        type: 'object',
        required: ['image', 'aspectRatio'],
        properties: {
          image: {
            type: 'blob',
            accept: ['image/*'],
            maxSize: 1000000,
          },
          alt: {
            type: 'string',
            description:
              'Alt text description of the image, for accessibility.',
          },
          aspectRatio: {
            type: 'ref',
            ref: 'lex:pub.leaflet.blocks.image#aspectRatio',
          },
        },
      },
      aspectRatio: {
        type: 'object',
        required: ['width', 'height'],
        properties: {
          width: {
            type: 'integer',
          },
          height: {
            type: 'integer',
          },
        },
      },
    },
  },
  PubLeafletBlocksMath: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.math',
    defs: {
      main: {
        type: 'object',
        required: ['tex'],
        properties: {
          tex: {
            type: 'string',
          },
        },
      },
    },
  },
  PubLeafletBlocksPage: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.page',
    defs: {
      main: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
          },
        },
      },
    },
  },
  PubLeafletBlocksPoll: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.poll',
    defs: {
      main: {
        type: 'object',
        required: ['pollRef'],
        properties: {
          pollRef: {
            type: 'ref',
            ref: 'lex:com.atproto.repo.strongRef',
          },
        },
      },
    },
  },
  PubLeafletBlocksText: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.text',
    defs: {
      main: {
        type: 'object',
        required: ['plaintext'],
        properties: {
          plaintext: {
            type: 'string',
          },
          textSize: {
            type: 'string',
            enum: ['default', 'small', 'large'],
          },
          facets: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:pub.leaflet.richtext.facet',
            },
          },
        },
      },
    },
  },
  PubLeafletBlocksUnorderedList: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.unorderedList',
    defs: {
      main: {
        type: 'object',
        required: ['children'],
        properties: {
          children: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:pub.leaflet.blocks.unorderedList#listItem',
            },
          },
        },
      },
      listItem: {
        type: 'object',
        required: ['content'],
        properties: {
          content: {
            type: 'union',
            refs: [
              'lex:pub.leaflet.blocks.text',
              'lex:pub.leaflet.blocks.header',
              'lex:pub.leaflet.blocks.image',
            ],
          },
          children: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:pub.leaflet.blocks.unorderedList#listItem',
            },
          },
        },
      },
    },
  },
  PubLeafletBlocksWebsite: {
    lexicon: 1,
    id: 'pub.leaflet.blocks.website',
    defs: {
      main: {
        type: 'object',
        required: ['src'],
        properties: {
          previewImage: {
            type: 'blob',
            accept: ['image/*'],
            maxSize: 1000000,
          },
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          src: {
            type: 'string',
            format: 'uri',
          },
        },
      },
    },
  },
  PubLeafletPagesLinearDocument: {
    lexicon: 1,
    id: 'pub.leaflet.pages.linearDocument',
    defs: {
      main: {
        type: 'object',
        required: ['blocks'],
        properties: {
          id: {
            type: 'string',
          },
          blocks: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:pub.leaflet.pages.linearDocument#block',
            },
          },
        },
      },
      block: {
        type: 'object',
        required: ['block'],
        properties: {
          block: {
            type: 'union',
            refs: [
              'lex:pub.leaflet.blocks.iframe',
              'lex:pub.leaflet.blocks.text',
              'lex:pub.leaflet.blocks.blockquote',
              'lex:pub.leaflet.blocks.header',
              'lex:pub.leaflet.blocks.image',
              'lex:pub.leaflet.blocks.unorderedList',
              'lex:pub.leaflet.blocks.website',
              'lex:pub.leaflet.blocks.math',
              'lex:pub.leaflet.blocks.code',
              'lex:pub.leaflet.blocks.horizontalRule',
              'lex:pub.leaflet.blocks.bskyPost',
              'lex:pub.leaflet.blocks.page',
              'lex:pub.leaflet.blocks.poll',
              'lex:pub.leaflet.blocks.button',
            ],
          },
          alignment: {
            type: 'string',
            knownValues: [
              'lex:pub.leaflet.pages.linearDocument#textAlignLeft',
              'lex:pub.leaflet.pages.linearDocument#textAlignCenter',
              'lex:pub.leaflet.pages.linearDocument#textAlignRight',
              'lex:pub.leaflet.pages.linearDocument#textAlignJustify',
            ],
          },
        },
      },
      textAlignLeft: {
        type: 'token',
      },
      textAlignCenter: {
        type: 'token',
      },
      textAlignRight: {
        type: 'token',
      },
      textAlignJustify: {
        type: 'token',
      },
      quote: {
        type: 'object',
        required: ['start', 'end'],
        properties: {
          start: {
            type: 'ref',
            ref: 'lex:pub.leaflet.pages.linearDocument#position',
          },
          end: {
            type: 'ref',
            ref: 'lex:pub.leaflet.pages.linearDocument#position',
          },
        },
      },
      position: {
        type: 'object',
        required: ['block', 'offset'],
        properties: {
          block: {
            type: 'array',
            items: {
              type: 'integer',
            },
          },
          offset: {
            type: 'integer',
          },
        },
      },
    },
  },
  PubLeafletRichtextFacet: {
    lexicon: 1,
    id: 'pub.leaflet.richtext.facet',
    defs: {
      main: {
        type: 'object',
        description: 'Annotation of a sub-string within rich text.',
        required: ['index', 'features'],
        properties: {
          index: {
            type: 'ref',
            ref: 'lex:pub.leaflet.richtext.facet#byteSlice',
          },
          features: {
            type: 'array',
            items: {
              type: 'union',
              refs: [
                'lex:pub.leaflet.richtext.facet#link',
                'lex:pub.leaflet.richtext.facet#didMention',
                'lex:pub.leaflet.richtext.facet#atMention',
                'lex:pub.leaflet.richtext.facet#code',
                'lex:pub.leaflet.richtext.facet#highlight',
                'lex:pub.leaflet.richtext.facet#underline',
                'lex:pub.leaflet.richtext.facet#strikethrough',
                'lex:pub.leaflet.richtext.facet#id',
                'lex:pub.leaflet.richtext.facet#bold',
                'lex:pub.leaflet.richtext.facet#italic',
              ],
            },
          },
        },
      },
      byteSlice: {
        type: 'object',
        description:
          'Specifies the sub-string range a facet feature applies to. Start index is inclusive, end index is exclusive. Indices are zero-indexed, counting bytes of the UTF-8 encoded text. NOTE: some languages, like Javascript, use UTF-16 or Unicode codepoints for string slice indexing; in these languages, convert to byte arrays before working with facets.',
        required: ['byteStart', 'byteEnd'],
        properties: {
          byteStart: {
            type: 'integer',
            minimum: 0,
          },
          byteEnd: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      link: {
        type: 'object',
        description:
          'Facet feature for a URL. The text URL may have been simplified or truncated, but the facet reference should be a complete URL.',
        required: ['uri'],
        properties: {
          uri: {
            type: 'string',
          },
        },
      },
      didMention: {
        type: 'object',
        description: 'Facet feature for mentioning a did.',
        required: ['did'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
        },
      },
      atMention: {
        type: 'object',
        description: 'Facet feature for mentioning an AT URI.',
        required: ['atURI'],
        properties: {
          atURI: {
            type: 'string',
            format: 'uri',
          },
        },
      },
      code: {
        type: 'object',
        description: 'Facet feature for inline code.',
        required: [],
        properties: {},
      },
      highlight: {
        type: 'object',
        description: 'Facet feature for highlighted text.',
        required: [],
        properties: {},
      },
      underline: {
        type: 'object',
        description: 'Facet feature for underline markup',
        required: [],
        properties: {},
      },
      strikethrough: {
        type: 'object',
        description: 'Facet feature for strikethrough markup',
        required: [],
        properties: {},
      },
      id: {
        type: 'object',
        description:
          'Facet feature for an identifier. Used for linking to a segment',
        required: [],
        properties: {
          id: {
            type: 'string',
          },
        },
      },
      bold: {
        type: 'object',
        description: 'Facet feature for bold text',
        required: [],
        properties: {},
      },
      italic: {
        type: 'object',
        description: 'Facet feature for italic text',
        required: [],
        properties: {},
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
  AppBskyRichtextFacet: 'app.bsky.richtext.facet',
  AppGainforestAcMultimedia: 'app.gainforest.ac.multimedia',
  AppGainforestCommonDefs: 'app.gainforest.common.defs',
  AppGainforestDwcDefs: 'app.gainforest.dwc.defs',
  AppGainforestDwcEvent: 'app.gainforest.dwc.event',
  AppGainforestDwcMeasurement: 'app.gainforest.dwc.measurement',
  AppGainforestDwcOccurrence: 'app.gainforest.dwc.occurrence',
  AppGainforestEvaluatorDefs: 'app.gainforest.evaluator.defs',
  AppGainforestEvaluatorEvaluation: 'app.gainforest.evaluator.evaluation',
  AppGainforestEvaluatorService: 'app.gainforest.evaluator.service',
  AppGainforestEvaluatorSubscription: 'app.gainforest.evaluator.subscription',
  AppGainforestOrganizationDefaultSite:
    'app.gainforest.organization.defaultSite',
  AppGainforestOrganizationDonation: 'app.gainforest.organization.donation',
  AppGainforestOrganizationGetIndexedOrganizations:
    'app.gainforest.organization.getIndexedOrganizations',
  AppGainforestOrganizationInfo: 'app.gainforest.organization.info',
  AppGainforestOrganizationLayer: 'app.gainforest.organization.layer',
  AppGainforestOrganizationMember: 'app.gainforest.organization.member',
  AppGainforestOrganizationObservationsDendogram:
    'app.gainforest.organization.observations.dendogram',
  AppGainforestOrganizationObservationsFauna:
    'app.gainforest.organization.observations.fauna',
  AppGainforestOrganizationObservationsFlora:
    'app.gainforest.organization.observations.flora',
  AppGainforestOrganizationObservationsMeasuredTreesCluster:
    'app.gainforest.organization.observations.measuredTreesCluster',
  AppGainforestOrganizationPredictionsFauna:
    'app.gainforest.organization.predictions.fauna',
  AppGainforestOrganizationPredictionsFlora:
    'app.gainforest.organization.predictions.flora',
  AppGainforestOrganizationRecordingsAudio:
    'app.gainforest.organization.recordings.audio',
  AppGainforestOrganizationSite: 'app.gainforest.organization.site',
  ComAtprotoRepoStrongRef: 'com.atproto.repo.strongRef',
  OrgHypercertsDefs: 'org.hypercerts.defs',
  PubLeafletBlocksBlockquote: 'pub.leaflet.blocks.blockquote',
  PubLeafletBlocksBskyPost: 'pub.leaflet.blocks.bskyPost',
  PubLeafletBlocksButton: 'pub.leaflet.blocks.button',
  PubLeafletBlocksCode: 'pub.leaflet.blocks.code',
  PubLeafletBlocksHeader: 'pub.leaflet.blocks.header',
  PubLeafletBlocksHorizontalRule: 'pub.leaflet.blocks.horizontalRule',
  PubLeafletBlocksIframe: 'pub.leaflet.blocks.iframe',
  PubLeafletBlocksImage: 'pub.leaflet.blocks.image',
  PubLeafletBlocksMath: 'pub.leaflet.blocks.math',
  PubLeafletBlocksPage: 'pub.leaflet.blocks.page',
  PubLeafletBlocksPoll: 'pub.leaflet.blocks.poll',
  PubLeafletBlocksText: 'pub.leaflet.blocks.text',
  PubLeafletBlocksUnorderedList: 'pub.leaflet.blocks.unorderedList',
  PubLeafletBlocksWebsite: 'pub.leaflet.blocks.website',
  PubLeafletPagesLinearDocument: 'pub.leaflet.pages.linearDocument',
  PubLeafletRichtextFacet: 'pub.leaflet.richtext.facet',
} as const
