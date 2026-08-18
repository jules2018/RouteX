"use client";

import { useEffect, useState } from "react";

export default function PassengerPortalPage() {
  const [passenger, setPassenger] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    const storedPassenger =
      localStorage.getItem("passenger");

    if (storedPassenger) {

  const passengerData =
    JSON.parse(storedPassenger);

  setPassenger(passengerData);

  fetch(
  `https://routex-smgu.onrender.com/passenger-bookings/${passengerData.id}`
)
    .then((res) => res.json())
    .then((data) => {
      setTrips(data);
      console.log(data);
    });
}
  }, []);

  return (
    <main className="p-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-4xl">

  <h1 className="text-2xl font-semibold text-slate-800">
    Welcome back, {passenger?.full_name}
  </h1>

  <div className="mt-4 grid md:grid-cols-2 gap-4s">

    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
        Email
      </p>

      <p className="text-slate-800">
        {passenger?.email}
      </p>
    </div>

    <div>
  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
    Phone
  </p>

  <p className="text-slate-800">
    {passenger?.phone}
  </p>
</div>
  </div>
  
  <div className="mt-4 flex justify-end">
  <button
    onClick={() => {
      localStorage.removeItem("passenger");
      window.location.href = "/passenger-login";
    }}
    className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-100 transition"
  >
    Logout
  </button>
</div>
</div>
<div className="mt-10 mb-6">
  <h2 className="text-xl font-semibold text-slate-800">
    Your Trips
  </h2>

  <p className="text-sm text-slate-500">
    {trips.length} booking{trips.length !== 1 ? "s" : ""} tracked
  </p>
</div>
<div className="grid gap-4 max-w-4xl">
  {trips.length === 0 ? (
    <p className="text-gray-600">You have no trips scheduled.</p>
  ) : (
    trips.map((trip) => (
      <div
        key={trip.id}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
      >
        <div className="flex items-center justify-between mb-6">
  <div>
  <p className="text-xs uppercase tracking-wide text-slate-400">
    Booking Reference
  </p>

  <h3 className="text-lg font-semibold text-slate-800">
    BK-{trip.id.toString().padStart(4, "0")}
  </h3>
</div>
  <span
  className={`px-3 py-1 rounded-full text-sm font-medium
    ${
      trip.trip_status === "Waiting"
        ? "bg-blue-100 text-blue-700"
        : trip.trip_status === "Accepted"
        ? "bg-green-100 text-green-700"
        : trip.trip_status === "In Progress"
        ? "bg-orange-100 text-orange-700"
        : "bg-green-100 text-green-700"
    }
  `}
>
  {trip.trip_status}
</span>
</div>
    <div className="grid md:grid-cols-2 gap-6 mt-4">

  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
      Pickup
    </p>

    <p className="text-slate-800">
      {trip.pickup_address}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
      Dropoff
    </p>

    <p className="text-slate-800">
      {trip.dropoff_address}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
      Travel Date
    </p>

    <p className="text-slate-800">
      {new Date(
        trip.travel_date
      ).toLocaleDateString()}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
      Driver
    </p>

    <p className="text-slate-800">
      {trip.driver_name}
    </p>
    <p>

Driver: {trip.driver_name || "Not assigned"}

</p>
    <p>
  Vehicle: {trip.vehicle_type}
</p>

<p>
  Color: {trip.vehicle_color}
</p>

<p>
  Plate: {trip.license_plate}
</p>
  </div>

</div>
    </div>
    ))
  )}
</div>
    </main>
  );
}