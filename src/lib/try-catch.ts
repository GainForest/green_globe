type TryCatchResult<T> = [T, null] | [null, Error];

async function tryCatch<T>(fn: () => Promise<T>): Promise<TryCatchResult<T>> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    console.error(error);
    return [null, error as Error];
  }
}

export default tryCatch;
