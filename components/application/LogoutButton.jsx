"use client";

import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { logout } from "@/store/reducer/authReducer";
import { persistor } from "@/store/store";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    dispatch(logout());
    await persistor.purge();
    router.push("/auth/login");
  };

  return (
    <Button type="button" onClick={handleLogout}>
      Logout
    </Button>
  );
}
