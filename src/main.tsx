// src/main.tsx

import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";
import { Signin, Home, ForgotPassword, ResetPassword } from "./pages/";
import NotFound from "./pages/NotFound.tsx";
import { AuthLayout, DashboardComponent } from "./components/";
import DashboardContainer from "./components/dashboard/DashbaordContainer.tsx";
import Login2FAPage from "./components/login/2fa.tsx";
import TwoFASettingsPage from "./components/user/2fasetting.tsx";
import { registerSW } from "virtual:pwa-register";
import { getInitialTheme } from "./util/localStorage.ts";
import Signup from "./pages/Signup.tsx";
import AdminDashboardComponent from "./components/dashboard/AdminDashboardComponent.tsx";
import AdminRightsCases from "./components/admin/AdminRightsCases.tsx";
import AdminNomineeClaims from "./components/admin/AdminNomineeClaims.tsx";
import AdminBreaches from "./components/admin/AdminBreaches.tsx";
import AdminCompliance from "./components/admin/AdminCompliance.tsx";
import Profile from "./components/user/profile.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import PrivacyNotice from "./pages/PrivacyNotice.tsx";
import PrivacyCenter from "./pages/PrivacyCenter.tsx";
import NomineeClaim from "./pages/NomineeClaim.tsx";

registerSW({ immediate: true });

// Apply the saved / system-preferred theme before first render.
// (An inline script in index.html already did this pre-paint; this keeps the
// Redux store and the DOM in sync in case the preference changed mid-session.)
const savedTheme = getInitialTheme();
document.documentElement.classList.add(savedTheme);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <>
        {/* Public routes: accessible only when not logged in */}
        <Route
          index
          element={
            <AuthLayout authentication={false}>
              <Home />
            </AuthLayout>
          }
        />

        <Route
          path="/signup"
          element={
            <AuthLayout authentication={false}>
              <Signup />
            </AuthLayout>
          }
        />

        <Route
          path="/verify-email"
          element={
            <AuthLayout authentication={false}>
              <VerifyEmail />
            </AuthLayout>
          }
        />

        <Route
          path="/signin"
          element={
            <AuthLayout authentication={false}>
              <Signin />
            </AuthLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthLayout authentication={false}>
              <ForgotPassword />
            </AuthLayout>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthLayout authentication={false}>
              <ResetPassword />
            </AuthLayout>
          }
        />
        <Route
          path="/twofa"
          element={
            <AuthLayout authentication={false}>
              <Login2FAPage />
            </AuthLayout>
          }
        />

        {/* DPDP: the privacy notice must be readable by EVERYONE (s. 5), so it
            is gated as "any" — logged-in and logged-out alike. */}
        <Route
          path="/privacy-notice"
          element={
            <AuthLayout authentication="any">
              <PrivacyNotice />
            </AuthLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <AuthLayout authentication={true}>
              <PrivacyCenter />
            </AuthLayout>
          }
        />

        {/* s. 14 — PUBLIC nominee claim (death/incapacity). Reachable by
            anyone, logged in or not, since a nominee may have no account. */}
        <Route
          path="/nominee-claim"
          element={
            <AuthLayout authentication="any">
              <NomineeClaim />
            </AuthLayout>
          }
        />

        {/* Protected routes: accessible only when logged in */}
        <Route
          path="/dashboard"
          element={
            <AuthLayout authentication={true} role={"user"}>
              {/* Default is true, but explicit is clearer */}
              <DashboardContainer />
            </AuthLayout>
          }
        >
          <Route index element={<DashboardComponent />} />

          <Route path="security" element={<TwoFASettingsPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route
          path="/admin-dashboard"
          element={
            <AuthLayout authentication={true} role={"admin"}>
              {/* Default is true, but explicit is clearer */}
              <DashboardContainer />
            </AuthLayout>
          }
        >
          <Route index element={<AdminDashboardComponent />} />
          <Route path="rights" element={<AdminRightsCases />} />
          <Route path="nominee-claims" element={<AdminNomineeClaims />} />
          <Route path="breaches" element={<AdminBreaches />} />
          <Route path="compliance" element={<AdminCompliance />} />

          <Route path="security" element={<TwoFASettingsPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </>
    </Route>
  )
);
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
