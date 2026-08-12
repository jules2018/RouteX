"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";

export default function NewTripPage() {
  const [routeName, setRouteName] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/available-drivers")
      .then((res) => res.json())
      .then((data) => setDrivers(data));

    fetch("http://localhost:5000/available-vehicles")
      .then((res) => res.json())
      .then((data) => setVehicles(data));
  }, []);

  const createTrip = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const response = await fetch(
      "http://localhost:5000/trips",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route_name: routeName,
          departure_date: departureDate,
          vehicle_id: vehicleId,
          driver_id: driverId,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      alert("Trip created successfully");

      setRouteName("");
      setDepartureDate("");
      setDriverId("");
      setVehicleId("");
    } else {
      alert(data.message || data.error);
    }
  };

  return (
    <AuthGuard>
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-6">
          Create Trip
        </h1>

        <form
          onSubmit={createTrip}
          className="flex flex-col gap-4 max-w-md"
        >
          <input
            type="text"
            placeholder="Route Name"
            value={routeName}
            onChange={(e) =>
              setRouteName(e.target.value)
            }
            className="border p-2"
          />

          <input
            type="date"
            value={departureDate}
            onChange={(e) =>
              setDepartureDate(e.target.value)
            }
            className="border p-2"
          />

          <select
            value={driverId}
            onChange={(e) =>
              setDriverId(e.target.value)
            }
            className="border p-2"
          >
            <option value="">
              Select Driver
            </option>

            {drivers.map((driver) => (
              <option
                key={driver.id}
                value={driver.id}
              >
                {driver.full_name}
              </option>
            ))}
          </select>

          <select
            value={vehicleId}
            onChange={(e) =>
              setVehicleId(e.target.value)
            }
            className="border p-2"
          >
            <option value="">
              Select Vehicle
            </option>

            {vehicles.map((vehicle) => (
              <option
                key={vehicle.id}
                value={vehicle.id}
              >
                {vehicle.registration}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded"
          >
            Create Trip
          </button>
        </form>
      </main>
    </AuthGuard>
  );
}