export type Hypercert = {
  hypercertId: string;
  creatorAddress: string;
  units: string; // bigint
  uri: string;
  creationBlockTimestamp: string;
  metadata: {
    name: string;
    description: string;
    contributors: string[];
    work: {
      scope: string[];
      from: string; // bigint
      to: string; // bigint
    } | null;
  } | null;
};
