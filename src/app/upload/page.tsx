import type { Metadata } from "next";
import UploadWizard from "./_components/UploadWizard";

export const metadata: Metadata = {
  title: "Upload Tree Data",
};

export default function UploadPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <UploadWizard />
      </div>
    </div>
  );
}
