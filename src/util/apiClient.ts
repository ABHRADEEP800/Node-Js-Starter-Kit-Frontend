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

export const apiClient = async (
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const { headers, ...restOptions } = options;

  // 1. Default Configuration
  const config: RequestInit = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // 👈 Keeps cookies attached
  };

  try {
    // 2. Perform the Request
    const response = await fetch(getUrl(endpoint), config);

    // 3. 🚨 THE INTERCEPTOR LOGIC 🚨
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