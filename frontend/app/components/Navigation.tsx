"use client";

import LogoutButton from "./LogoutButton";
import { useEffect, useState } from "react";

export default function Navigation() {
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
 
 if (!isLoggedIn) {
  return null;
}
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex gap-8 items-center text-sm font-medium">

        {isAdmin && (<a href="/" className="text-slate-500 hover:text-slate-900">
          Dashboard
        </a>)}

        {isAdmin && (<a href="/trips" className="text-slate-500 hover:text-slate-900">
          Trips
        </a>)}

        {isAdmin && (<a href="/trips/new" className="text-slate-500 hover:text-slate-900">
          New Trip
        </a>)}

        {isAdmin && (<a href="/passengers" className="text-slate-500 hover:text-slate-900">
          Passengers
        </a>)}

        {isAdmin && (<a href="/vehicles" className="text-slate-500 hover:text-slate-900">
          Vehicles
        </a>)}

         {isAdmin && (<a href="/drivers" className="text-slate-500 hover:text-slate-900">
          Drivers
        </a>)}

        {isAdmin && (<a href="/bookings" className="text-slate-500 hover:text-slate-900">
          New Booking
        </a>)}

        {isDriver && !isAdmin && (<a href="/driver-portal" className="text-slate-500 hover:text-slate-900">
          Driver Portal
        </a>)}

       {isPassenger && !isAdmin && (<a href="/passenger-portal" className="text-slate-500 hover:text-slate-900">
          Passenger Portal
        </a>)}


        <div className="ml-auto">
          <LogoutButton />
        </div>

      </div>
    </nav>
  );
}