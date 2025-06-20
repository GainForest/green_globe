import Container from "@/components/Container";
import React from "react";
import ProjectFormSkeleton from "./_components/ProjectFormSkeleton";

const LoadingProjectEditPage = () => {
  return (
    <Container>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold h-12 w-96 rounded-xl bg-accent animate-pulse"></h1>
        <p className="text-sm text-muted-foreground h-6 w-80 rounded-xl bg-accent animate-pulse"></p>
      </div>
      <ProjectFormSkeleton />
    </Container>
  );
};

export default LoadingProjectEditPage;
