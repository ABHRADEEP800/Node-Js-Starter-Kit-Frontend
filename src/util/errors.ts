// Extracts a human-readable message from an unknown thrown value (ApiError,
// Error, or an arbitrary object). Falls back to `fallback` when none exists.
export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err !== null) {
    const maybe = err as { message?: string };
    if (typeof maybe.message === "string" && maybe.message)
      return maybe.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

// Cast a thrown value to an error-like object carrying optional infra fields
// (e.g. `statusCode`, `name`) used by callers for branching.
export const asApiError = (err: unknown): ApiErrorLike =>
  (err instanceof Error ? err : {}) as ApiErrorLike;

export interface ApiErrorLike {
  name?: string;
  message?: string;
  statusCode?: number;
}

// Resolves a promise but rejects with `message` if it takes longer than
// `ms`. Used to stop external calls (e.g. reCAPTCHA) from hanging the UI
// forever when a third-party service is slow or unreachable.
export const withTimeout = <T>(
  promise: Promise<T>,
  message: string,
  ms: number
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};
