import dayjs from "dayjs";
import { Payment, MemberInfo, FiatPayment } from "./types";
import * as d3 from "d3";
import { Project } from "@/app/(map-routes)/(main)/_components/ProjectOverlay/store/types";

const calculateStringDistance = (a: string, b: string): number => {
  if (!a || !b) return Infinity;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const formatFiatDate = (str: string) => {
  const parts = str.split("/");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  return new Date(year, month, day);
};

export const fetchFiatPayments = async (
  project: Project
): Promise<FiatPayment[]> => {
  const res = await d3.csv(
    `${process.env.NEXT_PUBLIC_AWS_STORAGE}/transactions/fiat-transactions.csv`
  );
  const filteredRes = res
    .filter((d) => calculateStringDistance(d.orgName, project.name) < 3)
    .map((d) => {
      const member = project.communityMembers.find(
        (m) => m.id.toString() == d.communityMemberId
      );
      return {
        ...d,
        timestamp: formatFiatDate(d.timestamp),
        firstName: member?.firstName,
        lastName: member?.lastName,
        amount: parseFloat(d.originalAmount),
        currency: d.currency,
        blockchain: "FIAT",
        profileUrl: member?.profileUrl,
        motive: d.motive,
      };
    });

  // TODO: Remove this as unknown as FiatPayment[]
  return filteredRes as unknown as FiatPayment[];
};

export const fetchCryptoPayments = async (
  projectData: Project
): Promise<Payment[]> => {
  const memberWallets = new Map<string, MemberInfo>();
  const celoRecipients: string[] = [];
  const solanaRecipients: string[] = [];

  projectData.communityMembers.forEach((member) => {
    const memberInfo: MemberInfo = {
      firstName: member.firstName,
      lastName: member.lastName,
      profileUrl: member.profileUrl,
      communityMemberId: member.id.toString(),
    };

    if (member.Wallet?.CeloAccounts) {
      member.Wallet.CeloAccounts.forEach((account) => {
        if (account) {
          memberWallets.set(account, memberInfo);
          celoRecipients.push(account);
        }
      });
    }

    if (member.Wallet?.SOLAccounts) {
      member.Wallet.SOLAccounts.forEach((account) => {
        if (account) {
          memberWallets.set(account, memberInfo);
          solanaRecipients.push(account);
        }
      });
    }
  });

  const payments: Payment[] = [];

  if (celoRecipients.length > 0) {
    const celoPayments = await fetchCeloPayments(celoRecipients, memberWallets);
    payments.push(...celoPayments);
  }

  if (solanaRecipients.length > 0) {
    const solanaPayments = await fetchSolanaPayments(
      solanaRecipients,
      memberWallets
    );
    payments.push(...solanaPayments);
  }

  return payments;
};

export const fetchCeloPayments = async (
  recipients: string[],
  memberMap: Map<string, MemberInfo>
): Promise<Payment[]> => {
  const payments: Payment[] = [];
  const recipientAttestationData: Array<{
    recipientId: string;
    message?: string;
    transactionId?: string;
    uid: string;
  }> = [];

  const fetchAttestations = async () => {
    // Implementation needed
    return [];
  };

  const processAttestations = (
    attestationsArr: {
      decodedDataJson?: string;
      recipient: string;
      id: string;
    }[]
  ) => {
    attestationsArr.forEach((ele) => {
      type ParsedDecodedData = {
        name: string;
        value?: {
          value: string;
        };
      };
      const tempArr = JSON.parse(
        ele.decodedDataJson ?? "[]"
      ) as ParsedDecodedData[];

      const messageObj = tempArr.find((e) => e.name === "message");
      const transactionObj = tempArr.find((e) => e.name === "transactionId");

      recipientAttestationData.push({
        recipientId: ele.recipient,
        message: messageObj?.value?.value,
        transactionId: transactionObj?.value?.value,
        uid: ele.id,
      });
    });
  };

  const attestationsArr = await fetchAttestations();
  processAttestations(attestationsArr);

  const wallets = { Celo: recipients };

  for (const address of wallets.Celo) {
    try {
      const res = await fetch(
        `https://celo.blockscout.com/api?module=account&action=tokentx&address=${address}`
      );

      const data: {
        result: {
          tokenSymbol: string;
          to: string;
          timeStamp: string;
          hash: string;
        }[];
      } = await res.json();
      const seen = new Set();

      const transactions =
        data["result"]?.filter((transaction) => {
          const recipientsLowercased = recipients.map((e) =>
            `${e}`.toLowerCase()
          );

          const isValid =
            transaction.tokenSymbol === "cUSD" &&
            recipientsLowercased.includes(transaction.to.toLowerCase());

          const isNew = !seen.has(transaction.hash);

          if (isValid && isNew) {
            seen.add(transaction.hash);
            return true;
          }

          return false;
        }) || [];

      const mappedTransactions = transactions.map((transaction) => {
        const attestation = recipientAttestationData.find(
          (ele) => ele.transactionId === transaction.hash
        );

        const currentRecipientId = recipients.find(
          (id) => `${id}`.toLowerCase() === `${transaction?.to}`.toLowerCase()
        );

        const memberInfo = currentRecipientId
          ? memberMap.get(currentRecipientId)
          : undefined;

        return {
          to: transaction.to,
          timestamp: dayjs
            .unix(parseInt(transaction.timeStamp))
            .format("YYYY-MM-DD"),
          firstName: memberInfo?.firstName,
          lastName: memberInfo?.lastName,
          profileUrl: memberInfo?.profileUrl,
          amount: 0,
          currency: transaction.tokenSymbol,
          hash: transaction.hash,
          message: attestation?.message,
          attestationUid: attestation?.uid,
          blockchain: "Celo" as const,
          communityMemberId: memberInfo?.communityMemberId,
        } as Payment;
      });

      if (mappedTransactions.length > 0) {
        payments.push(...mappedTransactions);
      }
    } catch (error) {
      console.error("Error fetching Celo payments:", error);
    }
  }

  return payments;
};

const fetchSolanaPayments = async (
  recipients: string[],
  memberMap: Map<string, MemberInfo>
): Promise<Payment[]> => {
  const payments: Payment[] = [];
  const wallets = JSON.parse(
    process.env.NEXT_PUBLIC_GAINFOREST_WALLETS ?? "{}"
  );
  for (const address of wallets.Solana) {
    const query = `
          query MyQuery {
            solana {
              transfers(senderAddress: {is: "${address}"}) {
                amount
                currency {
                  name
                }
                receiver {
                  address
                }
                date {
                  date
                }
                transaction {
                  signature
                }
              }
            }
          }
  `;
    let res;
    let result: null | {
      data: {
        solana: {
          transfers: {
            receiver: { address: string };
            date: { date: string };
            amount: number;
            currency: { name: string };
            transaction: { signature: string };
          }[];
        };
      };
    } = null;
    try {
      res = await fetch("https://graphql.bitquery.io", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.NEXT_PUBLIC_BITQUERY_API_KEY ?? "",
        },
        body: JSON.stringify({ query }),
      });
      result = await res.json();
    } catch (e) {
      console.error("Error fetching solana payments:", e);
      return [];
    }
    if (!result || !result.data) {
      return [];
    }
    const transactions = result.data.solana.transfers.filter(
      (transaction) =>
        recipients.includes(transaction.receiver.address) &&
        transaction.currency.name === "USDC"
    );
    const payments = transactions.map((transaction) => ({
      to: transaction.receiver.address,
      timestamp: transaction.date.date,
      firstName: memberMap.get(transaction.receiver.address)?.firstName,
      lastName: memberMap.get(transaction.receiver.address)?.lastName,
      profileUrl: memberMap.get(transaction.receiver.address)?.profileUrl,
      amount: transaction.amount,
      currency: "USDC",
      blockchain: "Solana",
      hash: transaction.transaction.signature,
      communityMemberId: memberMap.get(transaction.receiver.address)
        ?.communityMemberId,
    }));
    if (payments.length > 0) {
      payments.push(...payments);
    }
  }
  return payments;
};
