"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidSessionToken } from "../lib/session";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    try {
      const driver = JSON.parse(localStorage.getItem("driver") || "null");
      const token = localStorage.getItem("driverToken");
      if (driver?.id && isValidSessionToken(token)) {
        setAuthorized(true);
        return;
      }
    } catch {}
    localStorage.removeItem("driver");
    localStorage.removeItem("driverToken");
    sessionStorage.removeItem("driverToken"); // clear old sessions
    router.replace("/driver-login");
  }, [router]);

  if (!authorized) return <div>Loading...</div>;
  return <>{children}</>;
}
