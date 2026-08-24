"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {

  const router = useRouter();

  const [applications, setApplications] = useState<any[]>([]);
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
      })
      .catch((error) => {
        console.error("Error loading stats:", error);
      });

    fetch("https://routex-smgu.onrender.com/admin/applications")
      .then((res) => res.json())
      .then((data) => {
        setApplications(data);
      })
      .catch((error) => {
        console.error("Error loading applications:", error);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          🚖 RouteX Admin Dashboard
        </h1>

        {/* Statistics */}
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

        {/* Pending Driver Applications */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Pending Driver Applications
          </h2>

          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm text-slate-700 font-medium">
              No pending applications.
            </div>
          ) : (
            <div className="space-y-4">

              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                >
                  <h3 className="font-bold text-lg text-slate-800">
                    {app.full_name}
                  </h3>
                    <p className="text-sm text-slate-500">

                    Applied: {new Date(app.created_at).toLocaleDateString()}

                    </p>
                  <p className="text-slate-600">
                    📞 {app.phone}
                  </p>

                  <p className="text-slate-600">
                    🚗 {app.vehicle_type}
                  </p>

                  <p className="text-slate-600">
                    🎨 {app.vehicle_color}
                  </p>

                  <p className="text-slate-600">
                    🔖 {app.license_plate}
                  </p>

                  {app.referral_code && (
  <p className="text-green-600 font-medium">
    Referral: {app.referral_code}
  </p>
)}

<div className="mt-4 flex gap-2">

  <button
    onClick={async () => {
      await fetch(
        `https://routex-smgu.onrender.com/admin/applications/${app.id}/approve`,
        { method: "POST" }
      );

      window.location.reload();
    }}
    className="bg-green-600 text-white px-4 py-2 rounded-lg"
  >
    Approve
  </button>

  <button
    onClick={async () => {
      await fetch(
        `https://routex-smgu.onrender.com/admin/applications/${app.id}/reject`,
        { method: "POST" }
      );

      window.location.reload();
    }}
    className="bg-red-600 text-white px-4 py-2 rounded-lg"
  >
    Reject
  </button>

</div>

                </div>
              ))}

            </div>
            
          )}
        </div>
        <button
  onClick={() => {
    localStorage.removeItem("admin");
    router.push("/");
  }}
  className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold"
>
  Logout
</button>
      </div>
    </main>
  );
}