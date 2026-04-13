const buildConnection = <T>(nodes: T[]) => ({
  edges: nodes.map((node) => ({ node })),
  totalCount: nodes.length,
  pageInfo: {
    hasNextPage: false,
    endCursor: null,
  },
});

const createPolygon = (
  name: string,
  coordinates: [number, number][],
) => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name },
      geometry: {
        type: "Polygon",
        coordinates: [[...coordinates, coordinates[0]]],
      },
    },
  ],
});

const createPointCollection = (
  features: Array<{ name: string; coordinates: [number, number] }>,
) => ({
  type: "FeatureCollection",
  features: features.map((feature) => ({
    type: "Feature",
    properties: {
      name: feature.name,
    },
    geometry: {
      type: "Point",
      coordinates: feature.coordinates,
    },
  })),
});

export const FIXTURE_PROJECT_ID =
  "did:plc:acaciaconservdemo234567a";
export const FIXTURE_PROJECT_SLUG = "acacia-conservation";
export const FIXTURE_PROJECT_HANDLE = `${FIXTURE_PROJECT_SLUG}.climateai.org`;
export const FIXTURE_PROJECT_NAME = "Acacia Conservation Reserve";
export const FIXTURE_PROJECT_COUNTRY = "KE";
export const FIXTURE_PROJECT_DESCRIPTION =
  "Acacia Conservation restores dryland forest mosaics with local stewards, community nurseries, and long-term biodiversity monitoring.";
export const FIXTURE_MAIN_SITE_ID = "site-main";
export const FIXTURE_MAIN_SITE_NAME = "Main Restoration Site";
export const FIXTURE_SECONDARY_SITE_ID = "site-community";
export const FIXTURE_SECONDARY_SITE_NAME = "Community Nursery Site";

const MAIN_SITE_BLOB_CID =
  "bafkreih2vu4dzxboakq6dq6yk6gftx65lahpzsxqa5giqpwcq6zgrxeulu";
const SECONDARY_SITE_BLOB_CID =
  "bafkreiekmzsr76g7l2rasszkzvsszthh3n7bg2wpro7bltwhsfilkn3uje";

export const ORGANIZATIONS_RESPONSE = [
  {
    did: FIXTURE_PROJECT_ID,
    info: {
      name: FIXTURE_PROJECT_NAME,
      country: FIXTURE_PROJECT_COUNTRY,
    },
    mapPoint: {
      lat: -1.2864,
      lon: 36.8172,
    },
  },
  {
    did: "did:plc:atlanticmangrove234567ab",
    info: {
      name: "Atlantic Mangrove Alliance",
      country: "BR",
    },
    mapPoint: {
      lat: -2.53,
      lon: -44.3,
    },
  },
  {
    did: "did:plc:borneorainforest234567ab",
    info: {
      name: "Borneo Rainforest Corridor",
      country: "ID",
    },
    mapPoint: {
      lat: 0.7893,
      lon: 113.9213,
    },
  },
];

export const ORGANIZATION_INFO_RESPONSE = {
  uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.organization.info/self`,
  cid: "bafkreigyunzcxi2rymalznu7v64aplgfhetqov4escyu4jlvgyb6qprn2q",
  value: {
    $type: "app.gainforest.organization.info",
    displayName: FIXTURE_PROJECT_NAME,
    shortDescription: {
      text: "Community-led dryland restoration in Kenya.",
    },
    longDescription: {
      blocks: [
        {
          block: {
            $type: "pub.leaflet.blocks.text",
            plaintext: FIXTURE_PROJECT_DESCRIPTION,
          },
        },
      ],
    },
    objectives: ["Conservation", "Community"],
    country: FIXTURE_PROJECT_COUNTRY,
    visibility: "Public",
    createdAt: "2024-02-01T00:00:00.000Z",
  },
};

export const LOCATIONS_BY_DID_RESPONSE = {
  data: {
    appCertifiedLocation: {
      edges: [
        {
          node: {
            uri: FIXTURE_MAIN_SITE_ID,
            rkey: "main-site",
            did: FIXTURE_PROJECT_ID,
            name: FIXTURE_MAIN_SITE_NAME,
            description: "The primary restoration polygon.",
            locationType: "site",
            lpVersion: "1.0.0",
            srs: "EPSG:4326",
            createdAt: "2024-02-01T00:00:00.000Z",
            location: {
              blob: {
                ref: { $link: MAIN_SITE_BLOB_CID },
                mimeType: "application/geo+json",
                size: 512,
              },
            },
          },
        },
        {
          node: {
            uri: FIXTURE_SECONDARY_SITE_ID,
            rkey: "community-site",
            did: FIXTURE_PROJECT_ID,
            name: FIXTURE_SECONDARY_SITE_NAME,
            description: "The nursery and training polygon.",
            locationType: "site",
            lpVersion: "1.0.0",
            srs: "EPSG:4326",
            createdAt: "2024-02-03T00:00:00.000Z",
            location: {
              blob: {
                ref: { $link: SECONDARY_SITE_BLOB_CID },
                mimeType: "application/geo+json",
                size: 512,
              },
            },
          },
        },
      ],
      totalCount: 2,
    },
  },
};

export const DEFAULT_SITE_BY_DID_RESPONSE = {
  data: {
    appGainforestOrganizationDefaultSite: {
      edges: [
        {
          node: {
            did: FIXTURE_PROJECT_ID,
            site: FIXTURE_MAIN_SITE_ID,
          },
        },
      ],
    },
  },
};

export const SITE_BLOBS: Record<string, unknown> = {
  [MAIN_SITE_BLOB_CID]: createPolygon(FIXTURE_MAIN_SITE_NAME, [
    [36.807, -1.292],
    [36.826, -1.292],
    [36.826, -1.278],
    [36.807, -1.278],
  ]),
  [SECONDARY_SITE_BLOB_CID]: createPolygon(FIXTURE_SECONDARY_SITE_NAME, [
    [36.79, -1.31],
    [36.804, -1.31],
    [36.804, -1.298],
    [36.79, -1.298],
  ]),
};

export const GLOBAL_LAYERS_RESPONSE = {
  layers: [
    {
      name: "Community Wells",
      type: "geojson_points",
      endpoint: "fixtures/layers/global/community-wells.geojson",
      description: "Water access points near the project.",
      category: "Infrastructure",
    },
    {
      name: "River Watch",
      type: "geojson_points",
      endpoint: "fixtures/layers/global/river-watch.geojson",
      description: "River monitoring checkpoints.",
      category: "Hydrology",
    },
  ],
};

export const PROJECT_LAYER_RECORDS_RESPONSE = {
  records: [
    {
      uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.organization.layer/canopy-plots`,
      cid: "bafkreicpoc5hueq7mc3cpjwn6impwjy4btx2iw2kyrm4y7malbxxo4o5vm",
      value: {
        name: "Canopy Plots",
        type: "geojson_points",
        uri: "fixtures/layers/project/canopy-plots.geojson",
        category: "Monitoring",
        description: "Permanent canopy measurement plots.",
      },
    },
    {
      uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.organization.layer/water-access`,
      cid: "bafkreidcjuqazbmwawqom5p4c4bje72ev6hdmnavkkmzfrtmt7ll7il6vq",
      value: {
        name: "Water Access Points",
        type: "geojson_points",
        uri: "fixtures/layers/project/water-access.geojson",
        category: "Operations",
        description: "Water access points for field teams.",
      },
    },
  ],
};

export const FIXTURE_LAYER_BOUNDS = [36.79, -1.31, 36.826, -1.278] as const;

export const GEOJSON_FIXTURES: Record<string, unknown> = {
  "fixtures/layers/global/community-wells.geojson": createPointCollection([
    { name: "Well A", coordinates: [36.812, -1.289] },
    { name: "Well B", coordinates: [36.819, -1.285] },
  ]),
  "fixtures/layers/global/river-watch.geojson": createPointCollection([
    { name: "Checkpoint North", coordinates: [36.805, -1.284] },
  ]),
  "fixtures/layers/project/canopy-plots.geojson": createPointCollection([
    { name: "Plot 01", coordinates: [36.814, -1.286] },
    { name: "Plot 02", coordinates: [36.818, -1.283] },
  ]),
  "fixtures/layers/project/water-access.geojson": createPointCollection([
    { name: "Tap A", coordinates: [36.8, -1.304] },
  ]),
};

export const ORGANIZATION_MEMBER_RECORDS_RESPONSE = {
  data: {
    records: buildConnection([
      {
        uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.organization.member/jane-wanjiru`,
        did: FIXTURE_PROJECT_ID,
        value: {
          displayName: "Jane Wanjiru",
          role: "Community Ranger",
          bio: "Coordinates restoration plots and local field surveys.",
          walletAddresses: [{ chain: "stellar", address: "GCFIXTUREADDRESS1" }],
          joinedAt: "2023-04-12T00:00:00.000Z",
        },
      },
      {
        uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.organization.member/samuel-otieno`,
        did: FIXTURE_PROJECT_ID,
        value: {
          displayName: "Samuel Otieno",
          role: "Nursery Lead",
          bio: "Runs the community nursery and seedling handoff program.",
          walletAddresses: [{ chain: "stellar", address: "GCFIXTUREADDRESS2" }],
          joinedAt: "2023-06-08T00:00:00.000Z",
        },
      },
    ]),
  },
};

export const MULTIMEDIA_BY_DID_RESPONSE = {
  data: {
    appGainforestAcMultimedia: buildConnection([]),
  },
};

export const PREDICTION_OCCURRENCES_RESPONSE = {
  Plantae: {
    data: {
      appGainforestDwcOccurrence: buildConnection([
        {
          uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/tree-1`,
          cid: "bafkreioccurrencetree1",
          rkey: "tree-1",
          did: FIXTURE_PROJECT_ID,
          scientificName: "Acacia tortilis",
          vernacularName: "Umbrella Thorn",
          kingdom: "Plantae",
          basisOfRecord: "MachineObservation",
          occurrenceID: "plant-tree-1",
          dynamicProperties: '{"group":"COMMON","dataType":"trees"}',
          imageEvidence: null,
          associatedMedia: null,
          conservationStatus: { iucnCategory: "LC", iucnTaxonId: 12345 },
          plantTraits: { maxHeight: 18, woodDensity: 0.72 },
        },
        {
          uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/tree-2`,
          cid: "bafkreioccurrencetree2",
          rkey: "tree-2",
          did: FIXTURE_PROJECT_ID,
          scientificName: "Faidherbia albida",
          vernacularName: "Apple-Ring Acacia",
          kingdom: "Plantae",
          basisOfRecord: "MachineObservation",
          occurrenceID: "plant-tree-2",
          dynamicProperties: '{"group":"COMMON","dataType":"trees"}',
          imageEvidence: null,
          associatedMedia: null,
          conservationStatus: { iucnCategory: "LC", iucnTaxonId: 54321 },
          plantTraits: { maxHeight: 22, woodDensity: 0.63 },
        },
        {
          uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/herb-1`,
          cid: "bafkreioccurrenceherb1",
          rkey: "herb-1",
          did: FIXTURE_PROJECT_ID,
          scientificName: "Ocimum gratissimum",
          vernacularName: "African Basil",
          kingdom: "Plantae",
          basisOfRecord: "MachineObservation",
          occurrenceID: "plant-herb-1",
          dynamicProperties: '{"group":"COMMON","dataType":"herbs"}',
          imageEvidence: null,
          associatedMedia: null,
          conservationStatus: { iucnCategory: "NE" },
          plantTraits: { maxHeight: 1.5, rootDepth: 0.4, edibleParts: ["leaves"] },
        },
      ]),
    },
  },
  Animalia: {
    data: {
      appGainforestDwcOccurrence: buildConnection([
        {
          uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/bird-1`,
          cid: "bafkreioccurrencebird1",
          rkey: "bird-1",
          did: FIXTURE_PROJECT_ID,
          scientificName: "Tockus erythrorhynchus",
          vernacularName: "Red-billed Hornbill",
          kingdom: "Animalia",
          basisOfRecord: "MachineObservation",
          occurrenceID: "animal-1",
          dynamicProperties: '{"animalType":"Bird"}',
          imageEvidence: null,
          associatedMedia: null,
        },
        {
          uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/mammal-1`,
          cid: "bafkreioccurrencemammal1",
          rkey: "mammal-1",
          did: FIXTURE_PROJECT_ID,
          scientificName: "Madoqua kirkii",
          vernacularName: "Kirk's Dik-dik",
          kingdom: "Animalia",
          basisOfRecord: "MachineObservation",
          occurrenceID: "animal-2",
          dynamicProperties: '{"animalType":"Mammal"}',
          imageEvidence: null,
          associatedMedia: null,
        },
      ]),
    },
  },
};

export const OBSERVATION_OCCURRENCES_RESPONSE = {
  data: {
    appGainforestDwcOccurrence: buildConnection([
      {
        uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/measured-tree-1`,
        cid: "bafkreimeasuredtree1",
        rkey: "measured-tree-1",
        did: FIXTURE_PROJECT_ID,
        scientificName: "Acacia tortilis",
        vernacularName: "Umbrella Thorn",
        decimalLatitude: "-1.2862",
        decimalLongitude: "36.8165",
        eventDate: "2024-02-01",
        dynamicProperties: '{"dataType":"measuredTree"}',
        associatedMedia: "",
        basisOfRecord: "HumanObservation",
      },
      {
        uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/measured-tree-2`,
        cid: "bafkreimeasuredtree2",
        rkey: "measured-tree-2",
        did: FIXTURE_PROJECT_ID,
        scientificName: "Acacia tortilis",
        vernacularName: "Umbrella Thorn",
        decimalLatitude: "-1.2851",
        decimalLongitude: "36.8178",
        eventDate: "2024-02-02",
        dynamicProperties: '{"dataType":"measuredTree"}',
        associatedMedia: "",
        basisOfRecord: "HumanObservation",
      },
      {
        uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/measured-tree-3`,
        cid: "bafkreimeasuredtree3",
        rkey: "measured-tree-3",
        did: FIXTURE_PROJECT_ID,
        scientificName: "Faidherbia albida",
        vernacularName: "Apple-Ring Acacia",
        decimalLatitude: "-1.2844",
        decimalLongitude: "36.8191",
        eventDate: "2024-02-03",
        dynamicProperties: '{"dataType":"measuredTree"}',
        associatedMedia: "",
        basisOfRecord: "HumanObservation",
      },
    ]),
  },
};

export const MEASUREMENT_RECORDS_RESPONSE = {
  records: [
    {
      uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.measurement/measurement-1`,
      cid: "bafkreib7ep7mlpe4dmtak46rg2uvqqscg4omz4c6blyanvejo2rqusaegi",
      value: {
        occurrenceRef: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/measured-tree-1`,
        result: {
          dbh: "18",
          totalHeight: "12",
        },
      },
    },
    {
      uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.measurement/measurement-2`,
      cid: "bafkreibvmbptlqd4j3rikwekfu6vqgcl2iqqaebf6zwuqkyytr2ilfdfhe",
      value: {
        occurrenceRef: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/measured-tree-2`,
        result: {
          dbh: "20",
          totalHeight: "16",
        },
      },
    },
    {
      uri: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.measurement/measurement-3`,
      cid: "bafkreihiguqml7ejadkyuuyhbvdxa5z5mgvviulc7b7hndrorkdvs5foba",
      value: {
        occurrenceRef: `at://${FIXTURE_PROJECT_ID}/app.gainforest.dwc.occurrence/measured-tree-3`,
        result: {
          dbh: "12",
          totalHeight: "8",
        },
      },
    },
  ],
};
