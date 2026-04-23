import { getDidDoc } from "./action";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const did = searchParams.get("did");
  if (!did) {
    return new Response("Missing did parameter", { status: 400 });
  }
  const didDoc = await getDidDoc(did);
  if (!didDoc) {
    return new Response("Did doc not found", { status: 404 });
  }
  return new Response(JSON.stringify(didDoc), { status: 200 });
}
