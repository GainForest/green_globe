import React, { useEffect } from "react";
import useEcocertLinking from "./hook";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRightIcon,
  CheckCircle,
  CircleAlert,
  Loader2,
  LucideProps,
  XCircle,
} from "lucide-react";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import { useAppKitAccount } from "@reown/appkit/react";
import Link from "next/link";
import WalletButton from "@/app/_components/WalletButton";
import { GG_HAT_ID } from "@/config/hats";
import useWearsHat from "@/app/_hooks/use-wears-hat";
import { fetchHypercertsCreatedByUser } from "@/graphql/hypercerts/queries/hypercerts-created-by-user";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import EcocertsList from "./EcocertsList";

const Disclaimer = ({
  Icon,
  title,
  body,
}: {
  Icon?: React.FC<LucideProps>;
  title: React.ReactNode;
  body: React.ReactNode;
}) => {
  return (
    <div className="p-4 text-center text-balance">
      {Icon && (
        <div className="flex items-center justify-center mb-1">
          <Icon className="opacity-50" size={32} />
        </div>
      )}
      <span className="text-foreground font-bold text-lg">{title}</span>
      <br />
      <span className="text-sm text-muted-foreground">{body}</span>
    </div>
  );
};

const EcocertsSkeleton = () => {
  return (
    <motion.div className="flex flex-col gap-2">
      {new Array(4).fill(0).map((_, index) => {
        return (
          <motion.div
            key={index}
            initial={{
              opacity: 0,
              filter: "blur(10px)",
              scale: 1.2,
              y: 20,
            }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              scale: 1,
              y: 0,
            }}
            transition={{ delay: index, duration: 0.75 }}
            className="bg-background/20 flex items-start p-4 gap-2 rounded-xl border border-border/20"
          >
            <div className="bg-muted w-14 h-20 rounded-md animate-pulse"></div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="bg-muted w-[33%] h-8 rounded-md animate-pulse"></div>
              <div className="bg-muted w-[100%] h-5 rounded-md animate-pulse delay-300"></div>
              <div className="bg-muted w-[50%] h-5 rounded-md animate-pulse delay-700"></div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

const EcocertLinking = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const { linkingData, linkingStatus, setLinkingData, startLinking, reset } =
    useEcocertLinking();
  const { address } = useAppKitAccount();
  const { data: isProjectOwner } = useWearsHat({
    address: address as `0x${string}` | undefined,
    hatId: GG_HAT_ID,
  });
  // const easConfig = chainId ? getEASConfig(Number(chainId)) : undefined;

  const {
    data: userEcocerts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userEcocerts", address],
    queryFn: async () => {
      if (!address) throw new Error();
      const hypercertsByUser = await fetchHypercertsCreatedByUser(
        address as `0x${string}`
      );
      if (hypercertsByUser === null) {
        throw new Error();
      }
      return hypercertsByUser;
    },
    enabled: !!address,
  });

  // const [copiedAttestationUid, setCopiedAttestationUid] = useState(false);

  // const copyAttestationUid = () => {
  //   if (linkingStatus.status === "success") {
  //     if (copiedAttestationUid) return;
  //     navigator.clipboard.writeText(linkingStatus.data.attestationUid);
  //     setCopiedAttestationUid(true);
  //     setTimeout(() => {
  //       setCopiedAttestationUid(false);
  //     }, 2000);
  //   }
  // };

  useEffect(() => {
    reset();
    if (projectId) {
      setLinkingData({
        project_id: projectId,
        ecocert_id: linkingData?.ecocert_id ?? "",
      });
    }
  }, [projectId]);

  const handleEcocertSelect = (ecocertId: string) => {
    if (!projectId) return;
    const newLinkingData = {
      project_id: projectId,
      ecocert_id: ecocertId,
    };
    setLinkingData(newLinkingData);
    startLinking(newLinkingData);
  };

  if (!projectId) {
    return (
      <Disclaimer
        title="No project selected"
        body="Please go back, and select a project first."
      />
    );
  }

  if (!isProjectOwner) {
    return (
      <Disclaimer
        title="You are not authorized"
        body={
          address ? (
            "If you think this is an error, please try clearing your browser cache and refreshing the page."
          ) : (
            <WalletButton />
          )
        }
      />
    );
  }

  return (
    <div className="p-4">
      {linkingStatus.status === "idle" && (
        <div className="space-y-4">
          <AnimatePresence>
            {isLoading ? (
              <EcocertsSkeleton />
            ) : error ? (
              <Disclaimer
                Icon={CircleAlert}
                title="Could not fetch your ecocerts"
                body="Your ecocerts could not be fetched. Please try again."
              />
            ) : userEcocerts === undefined ||
              (userEcocerts ?? []).length === 0 ? (
              <Disclaimer
                title="No ecocerts found"
                body={
                  <>
                    Please visit{" "}
                    <Link
                      href={"https://ecocertain.xyz/submit"}
                      target="_blank"
                    >
                      Ecocertain
                    </Link>{" "}
                    and create some ecocerts first.
                  </>
                }
              />
            ) : (
              <EcocertsList
                userEcocerts={userEcocerts}
                handleEcocertSelect={handleEcocertSelect}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {linkingStatus.status === "loading" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-center text-balance px-4">
            {linkingStatus.message}
          </p>
          <Button variant="outline" disabled>
            Cancel
          </Button>
        </div>
      )}

      {linkingStatus.status === "success" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-foreground/10 p-3">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <p className="text-center text-balance px-4">
            {linkingStatus.message}
          </p>
          {/* <div className="flex flex-col w-full px-2">
            <span className="font-bold text-sm text-muted-foreground">
              Attestation UID
            </span>
            <div className="flex items-center border border-border rounded-md p-1 bg-background/20">
              <input
                type="text"
                value={linkingStatus.data.attestationUid}
                className="w-full rounded-md border-none bg-transparent text-sm font-mono px-2 truncate"
                readOnly
                disabled
              />
              <Button
                variant="outline"
                onClick={copyAttestationUid}
                disabled={copiedAttestationUid}
              >
                {copiedAttestationUid ? <Check /> : <Copy />}
              </Button>
            </div>
          </div> */}
          <div className="flex items-center gap-2">
            {/* {easConfig && (
              <Link
                href={`${easConfig.explorerUrl}/attestation/view/${linkingStatus.data.attestationUid}`}
                target="_blank"
              >
                <Button variant="outline">View on EASScan</Button>
              </Link>
            )} */}
            <Button onClick={() => reset()}>Link Another Ecocert</Button>
          </div>
        </div>
      )}

      {linkingStatus.status === "error" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-foreground/10 p-3">
            <XCircle size={24} className="text-red-600 dark:text-red-300" />
          </div>
          <p className="text-center text-balance px-4">
            {linkingStatus.message}
          </p>
          {linkingStatus.type === "wallet-not-connected" && <WalletButton />}
          {linkingStatus.type === "chain-not-supported" && (
            <Button>
              <ArrowLeftRightIcon size={16} />
              Switch Chain
            </Button>
          )}
          <Button variant="outline" onClick={() => reset()}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default EcocertLinking;
