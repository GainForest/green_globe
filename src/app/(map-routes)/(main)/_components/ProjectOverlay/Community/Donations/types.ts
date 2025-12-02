export type Payment = {
  amount: number;
  blockchain: "Solana" | "Celo" | "FIAT";
  currency: string;
  firstName?: string;
  lastName?: string;
  hash: string;
  profileUrl?: string;
  timestamp: string;
  to: string;
  motive?: string;
  attestationUid?: string;
};

export type CeloAttestation = {
  id: string;
  decodedDataJson: string;
  recipient: string;
};

export type SolanaTransaction = {
  receiver: {
    address: string;
  };
  date: {
    date: string;
  };
  transaction: {
    signature: string;
  };
  currency: {
    name: string;
  };
  amount: number;
};

export type MemberInfo = {
  firstName: string;
  lastName: string;
  profileUrl: string | null;
  communityMemberId: string;
};

export type ProjectData = {
  name: string;
  communityMembers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    profileUrl: string | null;
    Wallet: {
      CeloAccounts: string[];
      SOLAccounts: string[];
    };
  }>;
};

export type FiatPayment = {
  firstName?: string;
  lastName?: string;
  profileUrl?: string;
  blockchain: "FIAT";
  to?: string;
  attestationUid?: string;
  amount: number;
  timestamp: string;
  communityMemberId: string;
  originalAmount: string;
  currency: string;
  motive?: string;
  orgName: string;
};
