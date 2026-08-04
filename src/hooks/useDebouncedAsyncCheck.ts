import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";

export type AsyncCheckStatus = "idle" | "checking" | "success" | "error";

export interface AsyncCheckResult<R> {
  status: AsyncCheckStatus;
  /** Resolved payload of the most recent non-stale request (null until success). */
  data: R | null;
  /** Error message from the failed request (null on success). */
  error: string | null;
  /** True while waiting on the debounce window OR an in-flight request. */
  pending: boolean;
}

export interface UseDebouncedAsyncCheckOptions<T, R> {
  /** Raw input that is debounced before the check runs. */
  value: T;
  /** Quiet window in ms before the check fires (default 400). */
  delay?: number;
  /** Return false to skip the check entirely (e.g. empty / invalid input). */
  shouldRun?: (value: T) => boolean;
  /** Runs the actual async check; MUST forward `signal` so it can be aborted. */
  fetcher: (value: T, signal: AbortSignal) => Promise<R>;
  /** Fallback message when the fetcher rejects without a message. */
  errorMessage?: string;
}

/**
 * The *settled* outcome of the check, tagged with the debounced value it was
 * computed for. `status` here is only ever "idle" | "success" | "error" — the
 * transient "checking" state is derived during render, never stored.
 */
interface Outcome<T, R> {
  forValue: T;
  status: "idle" | "success" | "error";
  data: R | null;
  error: string | null;
}

/**
 * Debounce an async check (e.g. username/email availability) safely:
 *
 * 1. **Debounce** — the fetcher only runs once the input has been quiet for
 *    `delay` ms, so typing a 10-character value doesn't fire 10 requests.
 * 2. **Cancellation** — every request runs through an `AbortController` that is
 *    aborted on the next input change or on unmount.
 * 3. **Race protection** — a monotonically increasing request id guarantees a
 *    slow/stale response can never overwrite a newer one.
 * 4. **Instant feedback** — `pending` flips to true the moment the raw input
 *    changes (derived in render), so the UI can show "Checking…" even during
 *    the debounce window.
 *
 * The fetcher is invoked with `(debouncedValue, signal)`. Services must accept
 * the `AbortSignal` (see `userService.checkUsernameAvailability`) so cancelled
 * requests never call `setState` after the fact.
 */
export function useDebouncedAsyncCheck<T, R>({
  value,
  delay = 400,
  shouldRun,
  fetcher,
  errorMessage = "Check failed",
}: UseDebouncedAsyncCheckOptions<T, R>): {
  result: AsyncCheckResult<R>;
  debouncedValue: T;
} {
  const debouncedValue = useDebouncedValue(value, delay);
  const [outcome, setOutcome] = useState<Outcome<T, R>>({
    forValue: value,
    status: "idle",
    data: null,
    error: null,
  });

  // Keep the latest callbacks without forcing the request effect to re-run.
  const optsRef = useRef({ fetcher, shouldRun, errorMessage });
  useEffect(() => {
    optsRef.current = { fetcher, shouldRun, errorMessage };
  });

  // Bumped to invalidate any in-flight request (stale-response guard).
  const requestIdRef = useRef(0);

  // Fire the actual request once the debounced value settles.
  useEffect(() => {
    const {
      fetcher: run,
      shouldRun: canRun,
      errorMessage: fallbackError,
    } = optsRef.current;

    if (canRun && !canRun(debouncedValue)) {
      // Ineligible value — invalidate anything still in flight and stay idle.
      requestIdRef.current += 1;
      return;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    run(debouncedValue, controller.signal)
      .then((data) => {
        // Discard stale / aborted responses.
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setOutcome({
          forValue: debouncedValue,
          status: "success",
          data,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        // AbortError is expected on cancellation — swallow it silently.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setOutcome({
          forValue: debouncedValue,
          status: "error",
          data: null,
          error: error instanceof Error ? error.message : fallbackError,
        });
      });

    // Abort the request when a newer value arrives or the hook unmounts.
    return () => controller.abort();
  }, [debouncedValue]);

  // Derive the live status for rendering. `pending` is true from the instant the
  // raw input changes (during the debounce window) until the request settles.
  const canRunNow = shouldRun ? shouldRun(value) : true;
  const isDebouncing = value !== debouncedValue;
  const requestInFlight = debouncedValue !== outcome.forValue;
  const checking = canRunNow && (isDebouncing || requestInFlight);

  const status: AsyncCheckStatus = !canRunNow
    ? "idle"
    : checking
      ? "checking"
      : outcome.status;

  return {
    result: {
      status,
      data: outcome.status === "success" ? outcome.data : null,
      error: outcome.status === "error" ? outcome.error : null,
      pending: status === "checking",
    },
    debouncedValue,
  };
}
