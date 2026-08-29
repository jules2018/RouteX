"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  useEffect(() => {
   const driver =
  localStorage.getItem("driver");

    if (!driver) {
  router.push("/driver-login");
} else {
  setAuthorized(true);
}
  }, [router]);

  if (!authorized) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}