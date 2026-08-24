"use client";

import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    passengers: 0,
    drivers: 0,
    ambassadors: 0,
    bookings: 0,
    onlineDrivers: 0,
    pendingApplications: 0,
  });

  useEffect(() => {
    fetch("https://routex-smgu.onrender.com/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          🚖 RouteX Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h2 className="text-slate-600">Passengers</h2>
            <p className="text-3xl font-bold text-blue-600">
              {stats.passengers}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h2 className="text-slate-600">Drivers</h2>
            <p className="text-3xl font-bold text-green-600">
              {stats.drivers}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h2 className="text-slate-600">Ambassadors</h2>
            <p className="text-3xl font-bold text-purple-600">
              {stats.ambassadors}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h2 className="text-slate-600">Bookings</h2>
            <p className="text-3xl font-bold text-orange-600">
              {stats.bookings}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h2 className="text-slate-600">Drivers Online</h2>
            <p className="text-3xl font-bold text-teal-600">
              {stats.onlineDrivers}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h2 className="text-slate-600">Pending Applications</h2>
            <p className="text-3xl font-bold text-red-600">
              {stats.pendingApplications}
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}