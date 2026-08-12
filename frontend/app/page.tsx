"use client";
import AuthGuard from "./components/AuthGuard";
import { useEffect, useState } from "react";

export default function Home() {
  const [stats, setStats] = useState({
    passengers: 0,
    vehicles: 0,
    drivers: 0,
    trips: 0,
  });
  const [revenue, setRevenue] = useState<any>(null);

  useEffect(() => {
  fetch("https://routex-smgu.onrender.com/dashboard")
    .then((res) => res.json())
    .then((data) => {
      setStats(data);
    });

  fetch("https://routex-smgu.onrender.com/revenue-summary")
    .then((res) => res.json())
    .then((data) => {
      setRevenue(data);
    });

}, []);

  return (
    <AuthGuard>
    <main className="p-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-8">

  <h1 className="text-2xl font-semibold text-slate-800">
    Dashboard
  </h1>

  <p className="text-sm text-slate-500 mt-1">
    Monitor trips, drivers, passengers and fleet performance.
  </p>

</div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
    Passengers
  </p>

  <p className="text-4xl font-semibold text-slate-800">
    {stats.passengers}
  </p>

</div>

  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
    Trips
  </p>
  <p className="text-4xl font-semibold text-slate-800">
    {stats.trips}
  </p>
</div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
    Vehicles
  </p>

  <p className="text-4xl font-semibold text-slate-800">
    {stats.vehicles}
  </p>

</div>


  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
    Drivers
  </p>
  <p className="text-4xl font-semibold text-slate-800">
    {stats.drivers}
  </p>
</div>

<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
    Revenue
  </p>
  <p className="text-4xl font-semibold text-slate-800">
    R{revenue?.revenue}
  </p>
</div>
<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
    Outstanding
  </p>
  <p className="text-4xl font-semibold text-slate-800">
    R{revenue?.outstanding}
  </p>
</div>
      </div>
      <div className="mt-10 mb-6">
  <h2 className="text-xl font-semibold text-slate-800">
    Business Overview
  </h2>

  <p className="text-sm text-slate-500">
    Key operational metrics and revenue tracking.
  </p>
</div>
    </main>
    </AuthGuard>
  );
}