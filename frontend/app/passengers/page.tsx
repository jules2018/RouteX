"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://routex-smgu.onrender.com/passengers")
      .then((res) => res.json())
      .then((data) => {
        setPassengers(data);
      });
  }, []);

  return (
    <AuthGuard>
      <main className="p-8 bg-gray-100 min-h-screen">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800">
            Passengers
          </h1>

          <p className="text-gray-500 mt-1">
            Manage passengers, payments and addresses
          </p>
        </div>
        <div className="mb-4">
  <input
    type="text"
    placeholder="Search passengers..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full max-w-md p-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
        <div className="bg-white rounded-xl shadow-lg p-4 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Pickup Town</th>
                <th className="p-3 text-left">Pickup Address</th>
                <th className="p-3 text-left">Dropoff Town</th>
                <th className="p-3 text-left">Dropoff Address</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Fare</th>
                <th className="p-3 text-left">Payment</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {passengers
  .filter((passenger) =>
    [
      passenger.full_name,
      passenger.phone,
      passenger.pickup_town,
      passenger.pickup_address,
      passenger.dropoff_town,
      passenger.dropoff_address,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  )
  .map((passenger) => (
                <tr
                  key={passenger.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition"
                >
                  <td className="p-3 text-gray-500">
  #{passenger.id}
</td>

                  <td className="p-3 font-medium">
                    {passenger.full_name}
                  </td>

                  <td className="p-3">
                    {passenger.phone}
                  </td>

                  <td className="p-3">
                    {passenger.pickup_town}
                  </td>

                  <td className="p-3">
                    {passenger.pickup_address}
                  </td>

                  <td className="p-3">
                    {passenger.dropoff_town}
                  </td>

                  <td className="p-3">
                    {passenger.dropoff_address}
                  </td>

                  <td className="p-3">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                      {passenger.status}
                    </span>
                  </td>

                  <td className="p-3 font-semibold">
                    R{passenger.fare}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        passenger.payment_status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {passenger.payment_status}
                    </span>
                  </td>

                  <td className="p-3">
                    {passenger.payment_status === "Pending" && (
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
                        onClick={() => {
                          fetch(
                            `https://routex-smgu.onrender.com/passengers/${passenger.id}/pay`,
                            {
                              method: "POST",
                            }
                          )
                            .then((res) => res.json())
                            .then((data) => {
                              alert(data.message);
                              window.location.reload();
                            });
                        }}
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AuthGuard>
  );
}