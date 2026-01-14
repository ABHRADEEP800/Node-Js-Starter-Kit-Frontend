// src/components/AuthLayout.tsx

import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { Loading } from "./"; // Assuming you have a Loading component
import type { AuthState } from "../store/auth/authSlice";

interface AuthLayoutProps {
  authentication?: boolean; // Renamed for clarity
  children: React.ReactNode;
  role?: "user" | "admin"; // Added role prop
}

// REWRITTEN: This is the standard, flicker-free way to protect routes.
function AuthLayout({
  authentication = true,
  role = "user",
  children,
}: AuthLayoutProps) {
  const { status: authStatus, loggedInUser } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  // This state will be managed by the App component's initial check
  const [appIsReady, setAppIsReady] = React.useState(false);

  React.useEffect(() => {
    // This effect ensures we only render after the initial user check in App.tsx is done.
    // We give it a moment to avoid race conditions on initial load.
    const timer = setTimeout(() => setAppIsReady(true), 50); // Small delay to allow auth check
    return () => clearTimeout(timer);
  }, []);

  // Wait for the initial authentication check in App.tsx to complete
  if (!appIsReady) {
    return <Loading />;
  }
  if (loggedInUser?.role !== role) {
    if (loggedInUser?.role === "admin") {
      return <Navigate to="/admin-dashboard" replace={true} />;
    } else if (loggedInUser?.role === "user") {
      return <Navigate to="/dashboard" replace={true} />;
    }
  }

  // Case 1: Trying to access a protected route (`authentication={true}`) while not logged in.
  if (authentication && authStatus !== authentication) {
    return <Navigate to="/signin" replace={true} />;
  }

  // Case 2: Trying to access a public-only route (`authentication={false}`) while logged in.
  if (
    !authentication &&
    authStatus !== authentication &&
    role === loggedInUser?.role &&
    role === "user"
  ) {
    return <Navigate to="/dashboard" replace={true} />;
  }
  if (
    !authentication &&
    authStatus !== authentication &&
    role === loggedInUser?.role &&
    role === "admin"
  ) {
    return <Navigate to="/admin-dashboard" replace={true} />;
  }

  // If all checks pass, render the requested component.
  return <>{children}</>;
}

export default AuthLayout;
