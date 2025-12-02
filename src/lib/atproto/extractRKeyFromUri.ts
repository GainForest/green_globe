const extractRKeyFromUri = (uri: string) => {
  uri = uri.replace("at://", "");
  const uriParts = uri.split("/");
  const rkey = uriParts[uriParts.length - 1];
  return rkey;
};

export default extractRKeyFromUri;
