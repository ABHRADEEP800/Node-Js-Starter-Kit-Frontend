import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useEffect, useState } from "react";
import UserService from "./services/userService";
import { useDispatch } from "react-redux";
import { login, logout } from "./store/auth/authSlice";
import { Header, Loading } from "./components";

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(true);

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
        // ADDED: If the API call fails (e.g., invalid token), log the user out.
        // dispatch(logout()); // TODO fix reload issue
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
    <>
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
      />
      <Header />
      <main>
        {" "}
        {/* It's good practice to wrap your content in a <main> tag */}
        <Outlet />
      </main>
    </>
  );
}

export default App;
