"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

 const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("driver");
  localStorage.removeItem("passenger");

  router.push("/login");
};

  return (
    <button
      onClick={logout}
      className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
    >
      Logout
    </button>
  );
}