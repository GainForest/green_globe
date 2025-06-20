import StackedDialog from "@/components/ui/StackedDialog";
import { StackedDialogProvider } from "@/components/ui/StackedDialog/context";
import Onboarding from "./Onboarding";
import SignInEmail from "./SignInEmail";
import Account from "./Account";
import SignInExternalWallet from "./SignInExternalWallet";
const dialogDefinitions = [
  {
    id: "onboarding",
    dialog: Onboarding,
  },
  {
    id: "sign-in-email",
    dialog: SignInEmail,
  },
  {
    id: "account",
    dialog: Account,
  },
  {
    id: "sign-in-external-wallet",
    dialog: SignInExternalWallet,
  },
];

export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StackedDialogProvider definitions={dialogDefinitions}>
      <StackedDialog />
      {children}
    </StackedDialogProvider>
  );
};
