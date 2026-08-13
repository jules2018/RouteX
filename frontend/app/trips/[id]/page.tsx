"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function TripDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [trip, setTrip] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);

  useEffect(() => {
  if (!id) return;

  fetch(
    `https://routex-smgu.onrender.com/trips/${id}/driver-manifest`
  )
    .then((res) => res.json())
    .then((data) => {
      setTrip(data);
    });

  fetch(
    `https://routex-smgu.onrender.com/trips/${id}/passengers`
  )
    .then((res) => res.json())
    .then((data) => {
      setPassengers(data);
    });

}, [id]);

  if (!trip || !trip.trip) {
  return <div className="p-8">Loading...</div>;
}
if (!trip || !trip.trip) {
  return <div className="p-8">Loading...</div>;
}

const departTrip = async () => {
  await fetch(
    `https://routex-smgu.onrender.com/trips/${id}/depart`,
    {
      method: "POST",
    }
  );

  location.reload();
};

const completeTrip = async () => {
  await fetch(
    `https://routex-smgu.onrender.com/trips/${id}/complete`,
    {
      method: "POST",
    }
  );

  location.reload();
};

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Trip {trip.trip.id}
      </h1>

      <div className="mb-6">
        <p>
          <strong>Route:</strong> {trip.trip.route_name}
        </p>

        <p>
          <strong>Driver:</strong> {trip.trip.driver_name}
        </p>

        <p>
          <strong>Vehicle:</strong> {trip.trip.registration}
        </p>

        <p>
          <strong>Capacity:</strong> {trip.trip.capacity}
        </p>
        <p>
        <strong>Status:</strong> {trip.trip.status}
        </p>
        <div className="flex gap-4 mt-4 mb-6">
  <button
    onClick={departTrip}
    className="bg-blue-600 text-white px-4 py-2 rounded"
  >
    Depart Trip
  </button>

  <button
    onClick={completeTrip}
    className="bg-green-600 text-white px-4 py-2 rounded"
  >
    Complete Trip
  </button>
</div>
      </div>

      <h2 className="text-2xl font-bold mb-2">
        Pickup Stops
      </h2>

      <ul className="mb-6">
        {trip.pickup_stops.map((stop: any) => (
          <li key={stop.pickup_town}>
            {stop.pickup_town} ({stop.passenger_count})
          </li>
        ))}
      </ul>

      <h2 className="text-2xl font-bold mb-2">
        Dropoff Stops
      </h2>

      <ul>
        {trip.dropoff_stops.map((stop: any) => (
          <li key={stop.dropoff_town}>
            {stop.dropoff_town} ({stop.passenger_count})
          </li>
        ))}
      </ul>
      <h2 className="text-2xl font-bold mt-8 mb-2">
  Passengers
</h2>

<table className="border-collapse border border-gray-300 w-full">
  <thead>
    <tr>
      <th className="border p-2">Name</th>
      <th className="border p-2">Phone</th>
      <th className="border p-2">Pickup</th>
      <th className="border p-2">Dropoff</th>
    </tr>
  </thead>

  <tbody>
    {passengers.map((passenger) => (
      <tr key={passenger.id}>
        <td className="border p-2">
          {passenger.full_name}
        </td>
        <td className="border p-2">
          {passenger.phone}
        </td>
        <td className="border p-2">
          {passenger.pickup_town}
        </td>
        <td className="border p-2">
          {passenger.dropoff_town}
        </td>
      </tr>
    ))}
  </tbody>
</table>
    </main>
  );
}
