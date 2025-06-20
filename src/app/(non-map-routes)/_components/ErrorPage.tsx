"use client";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Frown, RefreshCcw } from "lucide-react";
import React from "react";

const ErrorPage = ({
  error,
  title,
  description,
}: {
  error?: Error;
  title?: string;
  description?: string;
}) => {
  if (error) {
    console.error(error);
  }

  return (
    <Container>
      <div className="flex flex-col gap-4 items-center justify-center w-full h-72 bg-muted/50 rounded-xl p-4">
        <p>
          <Frown className="size-12 text-muted-foreground/50" />
        </p>
        <div className="flex flex-col gap-1 items-center">
          <h1 className="text-2xl font-bold text-center text-balance">
            {title ?? "Something went wrong."}
          </h1>
          <p className="text-muted-foreground text-center text-balance">
            {description ??
              "Please try refreshing the page or checking the URL."}
          </p>
        </div>
        <Button onClick={() => window.location.reload()} size={"sm"}>
          <RefreshCcw />
          Refresh
        </Button>
      </div>
    </Container>
  );
};

export default ErrorPage;
