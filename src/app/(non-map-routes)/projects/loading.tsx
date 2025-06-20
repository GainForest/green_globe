import Container from "@/components/Container";
import React from "react";

const LoadingProjectsPage = () => {
  return (
    <Container>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold h-12 w-96 rounded-xl bg-accent animate-pulse"></h1>
        <p className="text-sm text-muted-foreground h-6 w-80 rounded-xl bg-accent animate-pulse"></p>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {new Array(4).fill(0).map((_, index) => {
          return (
            <div
              key={index}
              className="bg-accent/25 rounded-xl border border-border flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="p-4 flex-grow">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold h-8 w-40 rounded-xl bg-accent animate-pulse"></h2>
                  <div className="flex items-center">
                    <span className="px-2 py-1 bg-foreground/10 h-6 w-20 rounded-full text-sm animate-pulse"></span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground flex-grow flex flex-col gap-1">
                  <div className="h-6 w-full rounded-xl bg-accent animate-pulse"></div>
                  <div className="h-6 w-full rounded-xl bg-accent animate-pulse"></div>
                  <div className="h-6 w-full rounded-xl bg-accent animate-pulse"></div>
                  <div className="h-6 w-1/2 rounded-xl bg-accent animate-pulse"></div>
                </div>
              </div>

              <div className="bg-accent/20 flex items-center gap-2 p-2 border-t border-border/30 justify-between">
                <div className="h-6 w-10 rounded-xl bg-accent animate-pulse"></div>
                <div className="h-6 w-20 rounded-xl bg-accent animate-pulse"></div>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
};

export default LoadingProjectsPage;
