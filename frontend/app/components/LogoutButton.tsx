"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("driver");
    localStorage.removeItem("passenger");

    router.push("/");
  };

  return (
    <button
      onClick={logout}
      className="
        text-[12px]
        font-bold
        text-[#777777]
        transition
        hover:text-[#ff6a00]
        active:scale-[0.97]
      "
    >
      Log out
    </button>
  );
}