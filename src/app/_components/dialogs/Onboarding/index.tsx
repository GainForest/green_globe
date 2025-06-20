import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent } from "@/components/ui/StackedDialog";
import { StackedDialogContext } from "@/components/ui/StackedDialog/context";
import { Mail, Wallet } from "lucide-react";
import Image from "next/image";

const Onboarding = ({ pushDialog }: StackedDialogContext) => {
  return (
    <DialogContent
      title={<span>Welcome</span>}
      description="Get started by signing in..."
      showCloseButton={false}
    >
      <div className="flex flex-col items-center my-6">
        <div className="h-20 w-20 border border-border rounded-xl shadow-lg bg-background flex items-center justify-center">
          <Image
            src="/assets/logo.webp"
            alt="Ecocertain"
            width={32}
            height={32}
          />
        </div>
        <b className="text-2xl drop-shadow-lg text-muted-foreground mt-2">
          Sign in to GainForest.
        </b>
      </div>
      <div className="flex flex-col w-full items-center gap-1">
        <div className="flex items-center gap-1 w-full">
          <Button
            className="h-auto p-2 py-4 flex-1 flex flex-col items-center"
            onClick={() => pushDialog("sign-in-email")}
          >
            <Mail className="size-5" />
            Sign in using Email
          </Button>
          <Button
            className="h-auto p-2 py-4 flex-1 flex flex-col items-center"
            onClick={() => pushDialog("sign-in-external-wallet")}
          >
            <Wallet className="size-5" />
            Connect Wallet
          </Button>
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="w-full">
            Close
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
};

export default Onboarding;
