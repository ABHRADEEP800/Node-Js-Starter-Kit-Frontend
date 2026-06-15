// src/components/AuthLayout.tsx

import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
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
  // Case 1: Trying to access a protected route while not logged in.
  if (authentication && !authStatus) {
    return <Navigate to="/signin" replace={true} />;
  }

  // Case 2: Trying to access a protected route with wrong role
  if (authentication && authStatus && loggedInUser?.role !== role) {
    return (
      <Navigate
        to={loggedInUser?.role === "admin" ? "/admin-dashboard" : "/dashboard"}
        replace={true}
      />
    );
  }

  // Case 3: Trying to access a public-only route while logged in.
  if (!authentication && authStatus) {
    return (
      <Navigate
        to={loggedInUser?.role === "admin" ? "/admin-dashboard" : "/dashboard"}
        replace={true}
      />
    );
  }

  // If all checks pass, render the requested component.
  return <>{children}</>;
}

export default AuthLayout;
