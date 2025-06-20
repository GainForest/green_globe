import { Button } from "@/components/ui/button";
import { ArrowRight, Check, CircleAlert, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useUserContext } from "@/app/_contexts/User";
import { backendApiURL } from "@/config/endpoints";

const NameEditor = ({ closeEditMode }: { closeEditMode: () => void }) => {
  const {
    backend: user,
    privy: { accessToken },
    refetch,
  } = useUserContext();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
    }
  }, [user]);

  const handleSave = async () => {
    const firstNameTrimmed = firstName.trim();
    const lastNameTrimmed = lastName.trim();

    const updateNamePromise = fetch(`${backendApiURL}/user/me/`, {
      method: "PUT",
      body: JSON.stringify({
        first_name: firstNameTrimmed,
        last_name: lastNameTrimmed,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    try {
      setStatus("loading");
      await updateNamePromise;
      refetch();
      setStatus("success");
      closeEditMode();
    } catch (error) {
      setStatus("error");
      console.error(error);
    }
  };

  return (
    <div className="border border-border rounded-xl flex flex-col p-2 gap-2 w-full max-w-md bg-accent/20">
      <Input
        placeholder="First Name"
        className="bg-background"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <Input
        placeholder="Last Name"
        className="bg-background"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <Button variant={"outline"} onClick={closeEditMode}>
          <ChevronLeft />
        </Button>
        <Button onClick={handleSave} disabled={status === "loading"}>
          {status === "idle" ? (
            <ArrowRight className="size-4" />
          ) : status === "success" ? (
            <Check className="size-4" />
          ) : status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CircleAlert className="size-4 text-red-500" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default NameEditor;
