"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColumnMapping, ValidatedRow, ValidationResult } from "@/lib/upload/types";
import FileDropStep from "./FileDropStep";
import ColumnMappingStep from "./ColumnMappingStep";
import PreviewStep from "./PreviewStep";

type WizardState = {
  currentStep: 1 | 2 | 3 | 4;
  file: File | null;
  parsedData: Record<string, string>[] | null;
  headers: string[] | null;
  mappings: ColumnMapping[];
  validationResult: ValidationResult | null;
  validRows: ValidatedRow[];
};

const STEP_LABELS: Record<number, string> = {
  1: "Upload File",
  2: "Map Columns",
  3: "Preview & Validate",
  4: "Submit",
};

export default function UploadWizard() {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    file: null,
    parsedData: null,
    headers: null,
    mappings: [],
    validationResult: null,
    validRows: [],
  });

  const handleFileAndMappings = (
    file: File,
    parsedData: Record<string, string>[],
    headers: string[],
    mappings: ColumnMapping[]
  ) => {
    setState((prev) => ({ ...prev, file, parsedData, headers, mappings }));
  };

  const handleNext = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(4, prev.currentStep + 1) as 1 | 2 | 3 | 4,
    }));
  };

  const handleBack = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1) as 1 | 2 | 3 | 4,
    }));
  };

  const handleMappingsChange = (mappings: ColumnMapping[]) => {
    setState((prev) => ({ ...prev, mappings }));
  };

  const handlePreviewNext = (validRows: ValidatedRow[]) => {
    setState((prev) => ({
      ...prev,
      validRows,
      currentStep: 4,
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upload Tree Data</CardTitle>
          <span className="text-sm text-muted-foreground">
            Step {state.currentStep} of 4
          </span>
        </div>
        {/* Step indicator */}
        <div className="flex gap-2 mt-2">
          {([1, 2, 3, 4] as const).map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  step < state.currentStep
                    ? "bg-primary"
                    : step === state.currentStep
                      ? "bg-primary"
                      : "bg-muted"
                }`}
              />
              <span
                className={`text-xs ${
                  step === state.currentStep
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {state.currentStep === 1 && (
          <FileDropStep
            onFileAndMappings={handleFileAndMappings}
            onNext={handleNext}
          />
        )}
        {state.currentStep === 2 && state.headers && state.parsedData && (
          <ColumnMappingStep
            headers={state.headers}
            parsedData={state.parsedData}
            mappings={state.mappings}
            onMappingsChange={handleMappingsChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {state.currentStep === 3 && state.parsedData && (
          <PreviewStep
            parsedData={state.parsedData}
            mappings={state.mappings}
            onNext={handlePreviewNext}
            onBack={handleBack}
          />
        )}
        {state.currentStep === 4 && (
          <div className="py-8 text-center text-muted-foreground">
            Step 4: Submit (coming soon)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
