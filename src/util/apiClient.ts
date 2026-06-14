// src/util/apiClient.ts
import { store } from "../store/store"; // Import your actual Redux store instance
import { logout } from "../store/auth/authSlice";

const BASE_URL = `${import.meta.env.VITE_API_HOST_URL}${import.meta.env.VITE_API_DEFAULT_PATH}`;

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Helper to handle URL assembly
const getUrl = (endpoint: string) => {
  // Prevent double slashes if endpoint starts with /
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${BASE_URL}${cleanEndpoint}`;
};

let cachedCsrfToken: string | null = null;
let isFetchingCsrf = false;
let csrfPromise: Promise<string> | null = null;

const fetchCsrfToken = async (): Promise<string> => {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (isFetchingCsrf && csrfPromise) return csrfPromise;

  isFetchingCsrf = true;
  csrfPromise = fetch(getUrl("/csrf-token"), { credentials: "include" })
    .then((res) => res.json())
    .then((data) => {
      cachedCsrfToken = data.csrfToken;
      isFetchingCsrf = false;
      return cachedCsrfToken as string;
    })
    .catch(() => {
      isFetchingCsrf = false;
      return "strict";
    });

  return csrfPromise;
};

export const apiClient = async (
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const { headers, ...restOptions } = options;
  const method = options.method || "GET";

  let csrfToken = "strict";
  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    csrfToken = await fetchCsrfToken();
  }

  // 1. Default Configuration
  const config: RequestInit = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      ...headers,
    },
    credentials: "include", // 👈 Keeps cookies attached
  };

  try {
    // 2. Perform the Request
    const response = await fetch(getUrl(endpoint), config);

    // 3. 🚨 THE INTERCEPTOR LOGIC 🚨
    // A. Update CSRF token if rotated in the backend response
    try {
      const clone = response.clone();
      const contentType = clone.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const body = await clone.json();
        const newToken = body?.csrfToken || body?.data?.csrfToken;
        if (newToken) {
          cachedCsrfToken = newToken;
        }
      }
    } catch (e) {
      // Ignore clone/json parsing errors
    }

    // If Backend says "401 Unauthorized" (Token expired/invalid)
    if (response.status === 401) {
      // Check if we are already logged out to prevent infinite loops
      const state = store.getState();
      if (state.auth.status) {
        // A. Dispatch Logout Action immediately
        store.dispatch(logout());

        // B. Optional: Redirect manually if your Router doesn't catch the state change fast enough
        // window.location.href = "/signin";

        // C. Throw specific error so the calling component knows to stop
        throw new Error("Session expired. Please login again.");
      }
    }

    return response;
  } catch (error) {
    // Handle network errors (server down, no wifi)
    console.error("API Call Failed:", error);
    throw error;
  }
};
