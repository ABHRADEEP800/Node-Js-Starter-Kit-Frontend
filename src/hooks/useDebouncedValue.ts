import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delay` milliseconds — the value only updates once
 * the caller has stopped changing it for a full `delay` window ("trailing
 * debounce"). The timer is cleaned up on every value change and on unmount, so
 * no orphaned timeout can ever fire after the component is gone.
 *
 * @example
 * const [text, setText] = useState("");
 * const debouncedText = useDebouncedValue(text, 400);
 * // debouncedText lags behind `text` by up to 400ms of quiet time
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
