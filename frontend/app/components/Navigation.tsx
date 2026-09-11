"use client";


import LogoutButton from "./LogoutButton";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
 const [isLoggedIn, setIsLoggedIn] = useState(false);
 const [isPassenger, setIsPassenger] =
  useState(false);

const [isDriver, setIsDriver] =
  useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  console.log({
  isPassenger,
  isDriver,
  isAdmin,
});

useEffect(() => {
  if (localStorage.getItem("user")) {
  setIsAdmin(true);
  setIsLoggedIn(true);
}

  if (
  localStorage.getItem("user") ||
  localStorage.getItem("driver") ||
  localStorage.getItem("passenger")
) {
  setIsLoggedIn(true);
}
  if (localStorage.getItem("passenger")) {
    setIsPassenger(true);
  }

  if (localStorage.getItem("driver")) {
    setIsDriver(true);
  }
}, []);
 
 if (
  pathname === "/" ||
  pathname === "/login" ||
  pathname === "/driver-login" ||
  pathname === "/passenger-login" ||
  pathname === "/passenger-register"
) {
  return null;
}
  return (
  <nav className="border-b border-[#eeeeee] bg-white">
    <div
      className="
        mx-auto
        flex
        w-full
        max-w-md
        items-center
        justify-between
        px-5
        py-3
      "
    >

      {/* LEFT SIDE */}
      <div className="flex items-center gap-5">

        {/* ADMIN LINKS */}
        {isAdmin && (
          <>
            <a
              href="/"
              className="text-[12px] font-bold text-[#666666] hover:text-[#111111]"
            >
              Dashboard
            </a>

            <a
              href="/trips"
              className="text-[12px] font-bold text-[#666666] hover:text-[#111111]"
            >
              Trips
            </a>

            <a
              href="/trips/new"
              className="text-[12px] font-bold text-[#666666] hover:text-[#111111]"
            >
              New Trip
            </a>

            <a
              href="/passengers"
              className="text-[12px] font-bold text-[#666666] hover:text-[#111111]"
            >
              Passengers
            </a>

            <a
              href="/vehicles"
              className="text-[12px] font-bold text-[#666666] hover:text-[#111111]"
            >
              Vehicles
            </a>

            <a
              href="/drivers"
              className="text-[12px] font-bold text-[#666666] hover:text-[#111111]"
            >
              Drivers
            </a>

            <a
              href="/bookings"
              className="text-[12px] font-bold text-[#666666] hover:text-[#111111]"
            >
              New Booking
            </a>
          </>
        )}


       

        {/* PASSENGER */}
        {isPassenger && !isAdmin && (
          <a
            href="/passenger-portal"
            className="
              text-[12px]
              font-bold
              text-[#111111]
              transition
              hover:text-[#ff6a00]
            "
          >
            Home
          </a>
        )}

      </div>


      {/* LOGOUT */}
      {isLoggedIn && (
        <div className="ml-auto">
          <LogoutButton />
        </div>
      )}

    </div>
  </nav>
);
}