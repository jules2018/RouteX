"use client";
import AuthGuard from "../components/AuthGuard";
import { useEffect, useState } from "react";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/drivers")
      .then((res) => res.json())
      .then((data) => {
        setDrivers(data);
      });
  }, []);

  return (
    <AuthGuard>
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Drivers
      </h1>

      <table className="border-collapse border border-gray-300 w-full">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">License</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>

        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id}>
              <td className="border p-2">{driver.id}</td>
              <td className="border p-2">{driver.full_name}</td>
              <td className="border p-2">{driver.phone}</td>
              <td className="border p-2">
                {driver.license_number}
              </td>
              <td className="border p-2">
                {driver.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
    </AuthGuard>
  );
}