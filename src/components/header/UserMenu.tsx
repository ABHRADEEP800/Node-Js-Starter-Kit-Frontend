import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useDispatch } from "react-redux";
import { logout } from "../../store/auth/authSlice";
import { NavLink } from "react-router-dom";
import UserService from "../../services/userService";
import { toast } from "react-toastify";
import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

function getInitials(name: string) {
  return name
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function UserMenu({ userName = "", role = "user" }) {
  const dispatch = useDispatch();
  const isAdmin = role === "admin";

  function handleLogout() {
    UserService.logout()
      .then(() => {
        dispatch(logout());
        toast.success("Logged out successfully");
      })
      .catch(() => {
        toast.error("Logout failed");
      });
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="inline-flex w-full items-center gap-2 rounded-full p-1.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-100 dark:hover:bg-gray-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
            {getInitials(userName) || "U"}
          </span>
          <span className="hidden max-w-28 truncate md:inline">
            {userName}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="hidden h-4 w-4 text-gray-400 md:block"
          />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="absolute right-0 z-[60] mt-2 w-56 origin-top-right rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in dark:bg-gray-900 dark:ring-gray-700"
      >
        {/* User summary header */}
        <div className="mb-1 border-b border-gray-100 px-3 pb-3 pt-2 dark:border-gray-800">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {userName || "User"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isAdmin ? "bg-violet-500" : "bg-green-500"
              }`}
            />
            {isAdmin ? "Administrator" : "Member"}
          </p>
        </div>

        <MenuItem>
          <NavLink
            to={isAdmin ? "/admin-dashboard/profile" : "/dashboard/profile"}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
          >
            <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            Profile
          </NavLink>
        </MenuItem>
        <MenuItem>
          <NavLink
            to={isAdmin ? "/admin-dashboard/security" : "/dashboard/security"}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
          >
            <ShieldCheckIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            Security
          </NavLink>
        </MenuItem>

        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

        <MenuItem>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 dark:focus:bg-red-950/50"
          >
            <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
            Sign out
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}

export default UserMenu;
