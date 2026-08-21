"use client";

import { useEffect, useState } from "react";

export default function PassengerPortalPage() {
  const [passenger, setPassenger] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);

 const loadTrips = (passengerId: number) => {
  fetch(
    `https://routex-smgu.onrender.com/passenger-bookings/${passengerId}`
  )
    .then((res) => res.json())
    .then((data) => {
      setTrips(data);
      console.log(data);
    });
};
  useEffect(() => {
    const storedPassenger =
      localStorage.getItem("passenger");

    if (storedPassenger) {

  const passengerData =
    JSON.parse(storedPassenger);

  setPassenger(passengerData);

 loadTrips(passengerData.id);

const interval = setInterval(() => {
  loadTrips(passengerData.id);
}, 5000);

return () => clearInterval(interval);
}
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm max-w-4xl">
  <h1 className="text-2xl font-semibold text-slate-800">
    Welcome back, {passenger?.full_name}
  </h1>
  <div className="mt-4 grid md:grid-cols-2 gap-4s">

  <div className="mt-2">
  <p className="text-sm text-slate-700">
     {passenger?.email}
  </p>
</div>

  <div>
  </div>
</div>

</div>
<div className="mt-6 mb-4">
 <h2 className="text-xl font-bold text-slate-800">
    Your Trips
  </h2>

  <p className="text-sm text-slate-700">
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