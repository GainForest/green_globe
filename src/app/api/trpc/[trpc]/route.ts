// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { gainforestSdk } from "@/config/gainforest-sdk.server";

export const runtime = "nodejs";

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: gainforestSdk.appRouter,
    createContext: ({ req }) => gainforestSdk.createContext({ req }),
  });

export { handler as GET, handler as POST };
