import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/20/solid";
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
        <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <UserCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {userName}
          <ChevronDownIcon
            aria-hidden="true"
            className="-mr-1 h-5 w-5 text-gray-400 dark:text-gray-500"
          />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="absolute right-0 z-[60] mt-2 me-4 min-w-40 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="py-1">
          <MenuItem>
            <NavLink
              to={isAdmin ? "/admin-dashboard/profile" : "/dashboard/profile"}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100 rounded transition-colors"
            >
              <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              Profile
            </NavLink>
          </MenuItem>
          <MenuItem>
            <NavLink
              to={isAdmin ? "/admin-dashboard/security" : "/dashboard/security"}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100 rounded transition-colors"
            >
              <ShieldCheckIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              Security
            </NavLink>
          </MenuItem>

          <MenuItem>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100 rounded transition-colors"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              Sign out
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}

export default UserMenu;
