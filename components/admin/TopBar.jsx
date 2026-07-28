"use client";


import Image from "next/image";

import LogoutButton from "@/components/application/LogoutButton";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import UserDropdown from "./UserDropdown";
import { RiMenu4Fill } from "react-icons/ri";
import ThemeSwitch from "./ThemeSwitch";
import { useSidebar } from "@/components/ui/sidebar";

//import { logout } from "@/store/authSlice"; // Update path

const TopBar = () => {
const {toggleSidebar}=useSidebar();

  return (
    <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
            <Menu size={20} />
          </button>

          <div>
            <h1 className="text-xl font-semibold">
              Dashboard
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center relative w-80">
          <Search
            size={18}
            className="absolute left-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notification */}
          <button className="relative rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Bell size={20} />

            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Profile Dropdown */}
          <ThemeSwitch/>
         <UserDropdown/>
         <Button onClick={toggleSidebar} type="button" size="icon" className="ms-2 md:hidden">
            <RiMenu4Fill className="h-6 w-6" />
         </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;