"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { FaUserCircle } from "react-icons/fa";
import { User, Settings, LogOut } from "lucide-react";

// import { logout } from "@/store/authSlice"; // Uncomment if you have this action

const UserDropdown = () => {
  const auth = useSelector((state) => state.authStore.auth);

  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.push("/auth/login");
    }
  }, [auth, router]);

  const handleLogout = () => {
    // dispatch(logout()); // Uncomment if available

    localStorage.removeItem("auth");
    router.push("/auth/login");
  };

  if (!auth) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
          {auth?.profileImage ? (
            <Image
              src={auth.profileImage}
              alt="profile"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <FaUserCircle className="h-10 w-10 text-gray-400" />
          )}

          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium">
              {auth?.name}
            </p>

            <p className="text-xs text-gray-500 capitalize">
              {auth?.role}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72"
      >
        <div className="px-4 py-3 text-sm">
          <p>
            <span className="font-medium">Name:</span>{" "}
            {auth?.name}
          </p>

          <p>
            <span className="font-medium">Email:</span>{" "}
            {auth?.email}
          </p>

          <p>
            <span className="font-medium">Role:</span>{" "}
            <span className="capitalize text-green-600 font-semibold">
              {auth?.role}
            </span>
          </p>

          <p>
            <span className="font-medium">
              Email Verified:
            </span>{" "}
            {auth?.isEmailVerified ? "✅ Yes" : "❌ No"}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => router.push("/admin/profile")}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/admin/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;