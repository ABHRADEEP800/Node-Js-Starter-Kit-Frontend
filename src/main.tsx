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
import { Signin, Home } from "./pages/";
import { AuthLayout, DashboardComponent } from "./components/";
import DashboardContainer from "./components/dashboard/DashbaordContainer.tsx";
import Login2FAPage from "./components/login/2fa.tsx";
import TwoFASettingsPage from "./components/user/2fasetting.tsx";
import { registerSW } from "virtual:pwa-register";
import Signup from "./pages/Signup.tsx";
import AdminDashboardComponent from "./components/dashboard/AdminDashboardComponent.tsx";
import Profile from "./components/user/profile.tsx";

registerSW({ immediate: true });

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
          path="/signin"
          element={
            <AuthLayout authentication={false}>
              <Signin />
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

          <Route path="security" element={<TwoFASettingsPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<h1>Page Not Found</h1>} />
      </>
    </Route>
  )
);
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
