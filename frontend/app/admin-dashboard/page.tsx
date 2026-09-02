
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    passengers: 0,
    drivers: 0,
    ambassadors: 0,
    bookings: 0,
    onlineDrivers: 0,
    pendingApplications: 0,
  });

  const loadDashboardData = () => {
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
  };
  fetch("https://routex-1-z1hf.onrender.com/admin/passengers")
  .then((res) => res.json())
  .then((data) => {
    setPassengers(data);
  })
  .catch((error) => {
    console.error("Error loading passengers:", error);
  });

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-slate-900">

      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Route<span className="text-teal-600">X</span>
            </h1>

            <p className="text-sm text-slate-500 mt-0.5">
              Admin dashboard
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("admin");
              router.push("/");
            }}
            className="text-sm font-semibold text-slate-700 hover:text-black transition"
          >
            Log out
          </button>

        </div>
      </header>


      {/* Dashboard */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Overview
          </h2>

          <p className="text-slate-500 mt-1">
            Monitor RouteX activity and manage driver applications.
          </p>
        </div>


        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">

          {/* Passengers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-medium text-slate-500">
              Passengers
            </p>

            <p className="text-3xl font-bold mt-2 tracking-tight">
              {stats.passengers}
            </p>
          </div>


          {/* Drivers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-medium text-slate-500">
              Drivers
            </p>

            <p className="text-3xl font-bold mt-2 tracking-tight">
              {stats.drivers}
            </p>
          </div>


          {/* Ambassadors */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-medium text-slate-500">
              Ambassadors
            </p>

            <p className="text-3xl font-bold mt-2 tracking-tight">
              {stats.ambassadors}
            </p>
          </div>


          {/* Bookings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-medium text-slate-500">
              Bookings
            </p>

            <p className="text-3xl font-bold mt-2 tracking-tight">
              {stats.bookings}
            </p>
          </div>


          {/* Online Drivers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-slate-500">
                Drivers online
              </p>

              <span className="h-2 w-2 rounded-full bg-teal-500" />

            </div>

            <p className="text-3xl font-bold mt-2 tracking-tight">
              {stats.onlineDrivers}
            </p>
          </div>


          {/* Pending */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-slate-500">
                Pending applications
              </p>

              {stats.pendingApplications > 0 && (
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
                  Action required
                </span>
              )}

            </div>

            <p className="text-3xl font-bold mt-2 tracking-tight">
              {stats.pendingApplications}
            </p>
          </div>

        </div>


        {/* Driver Applications */}
        <section className="mt-10">

          <div className="flex items-end justify-between mb-5">

            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Driver applications
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Review and approve new drivers.
              </p>
            </div>

            {applications.length > 0 && (
              <span className="text-sm font-semibold text-slate-500">
                {applications.length} pending
              </span>
            )}

          </div>


          {/* Empty State */}
          {applications.length === 0 ? (

            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">

              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              </div>

              <h3 className="font-semibold mt-4">
                No pending applications
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                New driver applications will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {applications.map((app) => (

                <div
                  key={app.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
                >

                  {/* Application Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100">

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                      <div>
                        <h3 className="text-lg font-bold tracking-tight">
                          {app.full_name}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          Applied{" "}
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <span className="self-start text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700">
                        Pending review
                      </span>

                    </div>

                  </div>


                  {/* Application Details */}
                  <div className="p-5 sm:p-6">

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Phone
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {app.phone}
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Vehicle
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {app.vehicle_type}
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Colour
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {app.vehicle_color}
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          License plate
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {app.license_plate}
                        </p>
                      </div>

                    </div>


                    {/* Referral */}
                    {app.referral_code && (
                      <div className="mt-5 pt-5 border-t border-slate-100">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Referral code
                        </p>

                        <p className="mt-1 font-semibold text-teal-600">
                          {app.referral_code}
                        </p>

                      </div>
                    )}


                    {/* Actions */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">

                      <button
                        onClick={async () => {
                          await fetch(
                            `https://routex-smgu.onrender.com/admin/applications/${app.id}/approve`,
                            { method: "POST" }
                          );

                          loadDashboardData();
                        }}
                        className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-3 rounded-xl font-semibold transition"
                      >
                        Approve driver
                      </button>


                      <button
                        onClick={async () => {
                          await fetch(
                            `https://routex-smgu.onrender.com/admin/applications/${app.id}/reject`,
                            { method: "POST" }
                          );

                          loadDashboardData();
                        }}
                        className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 py-3 rounded-xl font-semibold transition"
                      >
                        Reject
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>
{/* Passengers */}
<section className="mt-10">

  <h2 className="text-xl font-bold tracking-tight">
    Passengers
  </h2>

  <p className="text-sm text-slate-500 mt-1 mb-4">
    Contact registered RouteX passengers.
  </p>

  <div className="space-y-3">

    {passengers.map((passenger) => (

      <div
        key={passenger.id}
        className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between"
      >

        <div>
          <p className="font-semibold">
            {passenger.full_name}
          </p>

          <p className="text-sm text-slate-500">
            {passenger.phone}
          </p>
        </div>

       
<a
  href={`https://wa.me/27${passenger.phone.replace(/^0/, "")}?text=${encodeURIComponent(
    `Hi ${passenger.full_name},

As one of our first members, you've received R20 OFF your first ride.

Use promo code:

WELCOME20

Simply enter the code when booking your trip.

Book now:
https://routex-frontend.onrender.com

RouteX • Getting Upington Moving`
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
>
  WhatsApp
</a>


      </div>

    ))}

  </div>

</section>
      </div>

    </main>
  );
}
