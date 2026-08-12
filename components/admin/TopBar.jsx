"use client";

import {
  Menu,
  Bell,
  Search,
} from "lucide-react";
import UserDropdown from "./UserDropdown";
import ThemeSwitch from "./ThemeSwitch";
import { useSidebar } from "@/components/ui/sidebar";

//import { logout } from "@/store/authSlice"; // Update path

const TopBar = () => {
const {toggleSidebar}=useSidebar();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
      <div className="flex h-[68px] items-center justify-between px-4 lg:px-7">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">Cosmopolitan Xccessories</p>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
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
            aria-label="Search admin panel"
            className="w-full rounded-lg border pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notification */}
          {/* YAHAN FIX KIYA HAI: aria-label="Notifications" */}
          <button aria-label="Notifications" className="relative rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Bell size={20} />

            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Profile Dropdown */}
          <ThemeSwitch/>
          <UserDropdown/>

          {/* Mobile menu: intentionally kept on the right to match the existing mobile header. */}
          <button
            type="button"
            aria-label="Open admin menu"
            title="Open menu"
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 md:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;