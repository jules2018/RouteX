"use client";
import AuthGuard from "../components/AuthGuard";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const completedTrips = trips.filter(
  (trip) => trip.status === "COMPLETED"
).length;

const scheduledTrips = trips.filter(
  (trip) => trip.status === "Scheduled"
).length;

const totalPassengers = trips.reduce(
  (total, trip) =>
    total + Number(trip.passengers_assigned),
  0
);

  useEffect(() => {
   fetch("https://routex-smgu.onrender.com/trips")
      .then((res) => res.json())
      .then((data) => {
        setTrips(data);
      });
  }, []);

  return (
    <AuthGuard>
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Trips
      </h1>
<div className="grid grid-cols-3 gap-4 mb-6">

  <div className="border rounded p-4">
    <h2 className="font-semibold">
      Completed Trips
    </h2>
    <p className="text-3xl">
      {completedTrips}
    </p>
  </div>

  <div className="border rounded p-4">
    <h2 className="font-semibold">
      Scheduled Trips
    </h2>
    <p className="text-3xl">
      {scheduledTrips}
    </p>
  </div>

  <div className="border rounded p-4">
    <h2 className="font-semibold">
      Total Passengers
    </h2>
    <p className="text-3xl">
      {totalPassengers}
    </p>
  </div>

</div>
      <table className="border-collapse border border-gray-300 w-full">
        <thead>
          <tr>
            <th className="border p-2">Trip ID</th>
            <th className="border p-2">Route</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Driver</th>
            <th className="border p-2">Vehicle</th>
            <th className="border p-2">Passengers</th>
            <th className="border p-2">Occupancy</th>
          </tr>
        </thead>

        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td className="border p-2">
  <Link
    href={`/trips/${trip.id}`}
    className="text-blue-500 hover:underline"
  >
    {trip.id}
  </Link>
</td>

              <td className="border p-2">{trip.route_name}</td>
              <td className="border p-2">
  <span
    className={
      trip.status === "COMPLETED"
        ? "bg-green-200 text-green-800 px-2 py-1 rounded"
        : trip.status === "IN_TRANSIT"
        ? "bg-blue-200 text-blue-800 px-2 py-1 rounded"
        : trip.status === "READY_TO_DEPART"
        ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
        : "bg-gray-200 text-gray-800 px-2 py-1 rounded"
    }
  >
    {trip.status}
  </span>
</td>

              <td className="border p-2">{trip.driver_name}</td>
              <td className="border p-2">{trip.registration}</td>
              <td className="border p-2">
                {trip.passengers_assigned}
              </td>
              <td className="border p-2">
  <div className="w-40 bg-gray-200 rounded overflow-hidden">
    <div
      className={`h-4 rounded ${
        Number(trip.passengers_assigned) >=
        Number(trip.capacity)
          ? "bg-green-500"
          : Number(trip.passengers_assigned) /
              Number(trip.capacity) >
            0.7
          ? "bg-yellow-500"
          : "bg-blue-500"
      }`}
      style={{
        width: `${
          (Number(trip.passengers_assigned) /
            Number(trip.capacity)) *
          100
        }%`,
      }}
    />
  </div>

  <div className="text-sm mt-1">
    {trip.passengers_assigned} / {trip.capacity}
  </div>
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
    </AuthGuard>
  );
}