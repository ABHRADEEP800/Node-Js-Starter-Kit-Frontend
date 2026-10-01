// src/components/AuthLayout.tsx

import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { AuthState } from "../store/auth/authSlice";

interface AuthLayoutProps {
  /**
   * - true   → requires login (redirects to /signin when logged out)
   * - false  → public-only (redirects logged-in users to their dashboard)
   * - "any"  → accessible whether logged in or not (e.g. the Privacy Notice)
   */
  authentication?: boolean | "any";
  children: React.ReactNode;
  /** Enforce a specific role. Omit to allow any authenticated user. */
  role?: "user" | "admin";
}

// REWRITTEN: This is the standard, flicker-free way to protect routes.
function AuthLayout({
  authentication = true,
  role,
  children,
}: AuthLayoutProps) {
  const { status: authStatus, loggedInUser } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  // Case 0: "any" — reachable regardless of auth state (no redirects).
  if (authentication === "any") {
    return <>{children}</>;
  }

  // Case 1: Trying to access a protected route while not logged in.
  if (authentication && !authStatus) {
    return <Navigate to="/signin" replace={true} />;
  }

  // Case 2: Trying to access a protected route with wrong role. `role` is only
  // enforced when explicitly provided — omitting it allows any authenticated
  // user (e.g. the shared Privacy Center). Guard on a PRESENT user: if the
  // status flag is true but the user object is momentarily null, redirecting to
  // the same route would loop.
  if (authentication && authStatus && role && loggedInUser && loggedInUser.role !== role) {
    return (
      <Navigate
        to={loggedInUser.role === "admin" ? "/admin-dashboard" : "/dashboard"}
        replace={true}
      />
    );
  }

  // Case 3: Trying to access a public-only route while logged in.
  if (!authentication && authStatus && loggedInUser) {
    return (
      <Navigate
        to={loggedInUser.role === "admin" ? "/admin-dashboard" : "/dashboard"}
        replace={true}
      />
    );
  }

  // If all checks pass, render the requested component.
  return <>{children}</>;
}

export default AuthLayout;
