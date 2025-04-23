import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BadgeDollarSign,
  CircleAlert,
  ExternalLink,
  User2,
} from "lucide-react";
import React, { useEffect } from "react";
import useProjectOverlayStore from "../../store";
import dayjs from "dayjs";
import Loading from "../../loading";
import ErrorMessage from "../../ErrorMessage";
import useDonationsStore from "./store";
import { FiatPayment, Payment } from "./store/types";
const NetworkBadge = ({
  network,
  attestationUid,
}: {
  network: string;
  attestationUid?: string;
}) => {
  const getNetworkColor = (network: string) => {
    switch (network) {
      case "Solana":
        return "bg-[#9945FF] text-white";
      case "Celo":
        return "bg-[#655947] text-white";
      case "ETH":
        return "bg-black text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${getNetworkColor(
          network
        )}`}
      >
        {network}
      </span>
      {attestationUid && (
        <a
          href={`https://celo.easscan.org/attestation/view/${attestationUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
        >
          View Attestation
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
};

const DonationCard = ({ payment }: { payment: FiatPayment | Payment }) => {
  const fullName = [payment.firstName, payment.lastName]
    .filter(Boolean)
    .join(" ");
  const profileSrc =
    payment.profileUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${fullName
      .toLowerCase()
      .replace(" ", "-")}.svg`;

  const formatAmount = (amount: number) => {
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  };

  return (
    <div className="flex flex-col divide-y bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl">
      <div className="p-4 flex items-start gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={profileSrc} />
          <AvatarFallback>
            <User2 className="w-12 h-12 opacity-20" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-start justify-between">
            <span className="font-medium">
              {dayjs(payment.timestamp).format("D MMMM YYYY")}
            </span>
            <span className="text-primary font-bold">
              {payment.currency} {formatAmount(payment.amount)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            To:{" "}
            {payment.blockchain === "FIAT" ? (
              fullName || payment.to
            ) : (
              <a
                href={
                  payment.blockchain?.toLowerCase() === "celo"
                    ? `https://celo.blockscout.com//tx/${payment.hash}`
                    : `https://explorer.solana.com/tx/${payment.hash}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:underline"
              >
                {fullName || payment.to}
              </a>
            )}
          </p>
          {payment.motive && <p className="text-sm">For: {payment.motive}</p>}
          <NetworkBadge
            network={payment.blockchain}
            attestationUid={payment.attestationUid}
          />
        </div>
      </div>
    </div>
  );
};

const Donations = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const { data, dataStatus, fetchData } = useDonationsStore();

  useEffect(() => {
    fetchData();
  }, [projectId, fetchData]);

  if (dataStatus === "loading") return <Loading />;
  if (dataStatus === "error") return <ErrorMessage />;

  return (
    <div>
      {data.length === 0 ? (
        <p className="bg-foreground/10 text-muted-foreground rounded-lg p-4 flex items-center gap-4">
          <CircleAlert size={32} className="shrink-0 opacity-50" />
          <span>No transactions found for this project.</span>
        </p>
      ) : (
        <>
          <p className="bg-foreground/10 text-muted-foreground rounded-lg p-4 flex items-center gap-4">
            <BadgeDollarSign size={32} className="shrink-0 opacity-50" />
            <span>
              <b className="text-foreground">
                {data.length} transaction{data.length === 1 ? "" : "s"}
              </b>{" "}
              recorded for this project.
            </span>
          </p>
          <div className="flex flex-col gap-2 mt-4">
            {data.map((payment, index) => (
              <DonationCard key={index} payment={payment} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Donations;
