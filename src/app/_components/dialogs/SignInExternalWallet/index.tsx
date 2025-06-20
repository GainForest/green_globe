import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/StackedDialog";
import { StackedDialogContext } from "@/components/ui/StackedDialog/context";
import { usePrivy } from "@privy-io/react-auth";
import React from "react";

const SignInExternalWallet = ({}: StackedDialogContext) => {
  const { login } = usePrivy();
  const handleLoginUsingExternalWallet = () => {
    login({
      loginMethods: ["wallet"],
    });
  };
  return (
    <DialogContent
      title={<span>Sign in</span>}
      description="Sign in with your external wallet to continue"
      showCloseButton={false}
    >
      <div className="flex flex-col w-full gap-1">
        <Button onClick={() => handleLoginUsingExternalWallet()}>
          Connect Wallet
        </Button>
      </div>
    </DialogContent>
  );
};

export default SignInExternalWallet;
