"use client";
import AuthGuard from "../components/AuthGuard";
import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/vehicles`)
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
      });
  }, []);

  return (
    <AuthGuard>
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Vehicles
      </h1>

      <table className="border-collapse border border-gray-300 w-full">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Registration</th>
            <th className="border p-2">Capacity</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>

        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td className="border p-2">{vehicle.id}</td>
              <td className="border p-2">
                {vehicle.registration}
              </td>
              <td className="border p-2">
                {vehicle.capacity}
              </td>
              <td className="border p-2">
                {vehicle.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
    </AuthGuard>
  );
}