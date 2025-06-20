import Container from "@/components/Container";

const LoadingMePage = () => {
  return (
    <Container>
      <div className="w-full flex flex-col gap-2 items-center mt-8">
        <div className="rounded-full p-2 border-4 border-border">
          <div className="h-20 w-20 rounded-full bg-accent animate-pulse"></div>
        </div>
        <div className="mt-4 max-w-md w-full bg-accent/20 animate-pulse delay-700 border border-border divide-y rounded-xl">
          <div className="flex flex-col gap-1 p-3">
            <div className="h-6 w-20 bg-accent animate-pulse rounded-xl"></div>
            <div className="h-6 w-36 bg-accent animate-pulse rounded-xl"></div>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <div className="h-6 w-20 bg-accent animate-pulse rounded-xl"></div>
            <div className="h-6 w-36 bg-accent animate-pulse rounded-xl"></div>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <div className="h-6 w-20 bg-accent animate-pulse rounded-xl"></div>
            <div className="h-6 w-36 bg-accent animate-pulse rounded-xl"></div>
          </div>
        </div>
        <div className="mt-4 max-w-md w-full bg-accent/20 animate-pulse delay-1000 border border-border rounded-xl">
          <div className="flex items-center justify-between p-3">
            <div className="h-6 w-20 bg-accent animate-pulse rounded-xl"></div>
            <div className="h-6 w-36 bg-accent animate-pulse rounded-xl"></div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default LoadingMePage;
