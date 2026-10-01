import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useEffect, useState } from "react";
import UserService from "./services/userService";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "./store/auth/authSlice";
import { Header, Loading } from "./components";
import Footer from "./components/Footer";
import CookieConsent from "./components/privacy/CookieConsent";
import { hydrateDispatchFromStorage } from "./util/consentGate";

// DPDP Domain 8: load the persisted consent dispatch BEFORE first paint so no
// non-consented tag can fire on the first render.
hydrateDispatchFromStorage();

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(true);

  // Keep toast notifications in sync with the active color theme.
  const themeMode: string = useSelector(
    (state: { theme: { pageTheme: string } }) => state.theme.pageTheme
  );
  const isDark = themeMode === "dark";

  // REWRITTEN: This effect now runs ONLY ONCE on initial app load.
  useEffect(() => {
    UserService.getCurrentUser()
      .then((res) => {
        if (res.data?.user) {
          dispatch(login(res.data.user));
        } else {
          // If no user is returned despite a successful API call, logout.
          dispatch(logout());
        }
      })
      .catch(() => {
        dispatch(logout());
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch]); // Dependency array is now correct. `dispatch` is stable.

  // Show a loading screen for the entire app until the initial auth check is complete.
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? "dark" : "light"}
      />
      <Header />
      {/* flex-1 keeps the footer pinned to the bottom on short pages. */}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* DPDP Domain 8: consent banner + persistent settings entry point. */}
      <CookieConsent />
    </div>
  );
}

export default App;
