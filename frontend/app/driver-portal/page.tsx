"use client";
import { openNavigation } from "../lib/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { showNotification } from "../lib/notifications";
export default function DriverPortalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [acceptedTrips, setAcceptedTrips] = useState<any[]>([]);
  const [inProgressTrips, setInProgressTrips] = useState<any[]>([]);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);
  const [status, setStatus] = useState("offline");
  const availableTrips = requests;

  const loadTrips = () => {
  fetch("https://routex-smgu.onrender.com/accepted-trips")
    .then((res) => res.json())
    .then((data) => setAcceptedTrips(data));

  fetch("https://routex-smgu.onrender.com/in-progress-trips")
    .then((res) => res.json())
    .then((data) => setInProgressTrips(data));

  fetch("https://routex-smgu.onrender.com/completed-trips")
    .then((res) => res.json())
    .then((data) => setCompletedTrips(data));

  fetch("https://routex-smgu.onrender.com/trip-requests")
    .then((res) => res.json())
    .then((data) => setRequests(data));
};

  useEffect(() => {
  const storedDriver = localStorage.getItem("driver");
  if (storedDriver) {
    const parsedDriver = JSON.parse(storedDriver);
    setDriver(parsedDriver);
    fetch(
  "https://routex-smgu.onrender.com/driver-list"
)
  .then((res) => res.json())
  .then((data) => {
    const currentDriver = data.find(
      (d: any) =>
        Number(d.id) === Number(parsedDriver.id)
    );
  
    if (
      currentDriver?.status === "Available"
    ) {
      setStatus("available");
    } else {
      setStatus("offline");
    }
  });
  }
 loadTrips();

  const interval = setInterval(() => {
    loadTrips();
  }, 5000);

  return () => clearInterval(interval);
}, []);

  return (
    <>
      <main className="p-8 bg-gray-100 min-h-screen">

  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-4xl mb-8">
  <h1 className="text-2xl font-semibold text-slate-800">
    Welcome back, {driver?.full_name}
  </h1>

  <p className="text-sm text-slate-500 mt-1">
    Manage and track your assigned trips.
  </p>

  <div className="mt-4 flex items-center gap-3">
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        status === "available"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status === "available" ? "Online" : "Offline"}
    </span>

    <button
    onClick={async () => {
  const newStatus =
    status === "available"
      ? "Offline"
      : "Available";

  try {
    console.log("Driver:", driver);
console.log("Driver ID:", driver?.id);
console.log("New Status:", newStatus);
    const response = await fetch(
      `https://routex-smgu.onrender.com/drivers/${driver?.id}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );
  console.log("Response Status:", response.status);

    if (!response.ok) {
      throw new Error("Failed to update driver status");
    }

    setStatus(
      newStatus === "Available"
        ? "available"
        : "offline"
    );
  } catch (error) {
    console.error("Error updating driver status:", error);
  }
}}
      className={`px-4 py-2 rounded-lg text-white ${
        status === "available"
          ? "bg-red-600 hover:bg-red-700"
          : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {status === "available"
        ? "Go Offline"
        : "Go Online"}
    </button>
  </div>
</div>

  <div className="mt-10 mb-6">
  <h2 className="text-xl font-semibold text-slate-800">
    Available Trips
  </h2>

  {availableTrips.length === 0 && (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-4xl">
    <p className="text-slate-500">
      No trips are currently awaiting acceptance.
    </p>
  </div>
)}

  <p className="text-sm text-slate-500">
    Trips waiting for driver acceptance.
  </p>
</div>
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-2">
  {request.full_name} (#{request.id})
</h2>

              <p className="text-slate-700">
  <strong>Phone:</strong>{" "}
  {request.phone}
</p>

              <p className="text-slate-700">
  <strong>Pickup:</strong>{" "}
  {request.pickup_address}
</p> 

              <p className="text-slate-700">
  <strong>Dropoff:</strong>{" "}
  {request.dropoff_address}
</p>


              <p className="text-slate-700">
  <strong>Date:</strong>{" "}
  {new Date(request.travel_date).toLocaleDateString(
    "en-ZA",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  )}
</p>
<p className="text-slate-700">
  <strong>Fare:</strong> R{request.fare_amount}
</p>
             
       <button
  onClick={async () => {
  const driverId = driver?.id;

  await fetch(
    `https://routex-smgu.onrender.com/trip-requests/${request.id}/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        driverId: driver?.id,
      }),
    }
  );

  showNotification(
    "✅ Trip Accepted",
    "Navigate to the pickup location."
  );

  location.reload();
}}
  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
>
  Accept Trip
</button>       
            </div>
          ))}
        </div>
        <div className="mt-10 mb-6">
  <h2 className="text-xl font-semibold text-slate-800">
    My Accepted Trips
  </h2>

  <p className="text-sm text-slate-500">
    Trips you've accepted and are waiting to start.
  </p>
</div>

{acceptedTrips
  .filter(
    (trip) =>
      Number(trip.assigned_driver_id) === Number(driver?.id)
  ).length === 0 && (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-4xl">
    <p className="text-slate-500">
      You have no accepted trips yet.
    </p>
  </div>
)}
<div className="grid gap-4">
  {acceptedTrips
  .filter(
    (trip) =>
      Number(trip.assigned_driver_id) === Number(driver?.id)
  )
  .map((trip) => (
    <div
  key={trip.id}
  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition max-w-4xl"
>
      <div className="mb-6">
  <p className="text-xs uppercase tracking-wide text-slate-400">
    Booking Reference
  </p>

  <h3 className="text-lg font-semibold text-slate-800">
    BK-{trip.id.toString().padStart(4, "0")}
  </h3>
</div>

      <p>
        <strong>Phone:</strong> {trip.phone}
      </p>
      
      <p>
  <strong>Driver:</strong> {trip.driver_name}
</p>
      <p>
        <strong>Pickup:</strong> {trip.pickup_address}
      </p>

      <p>
        <strong>Dropoff:</strong> {trip.dropoff_address}
      </p>
<p>
  <strong>Dropoff:</strong> {trip.dropoff_address}
</p>

<button
  onClick={() =>
    openNavigation(
      trip.pickup_lat,
      trip.pickup_lng
    )
  }
  className="mt-4 mr-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
>
  Navigate to Pickup
</button>

      <button
  onClick={async () => {
    const response = await fetch(
      `https://routex-smgu.onrender.com/trip-requests/${trip.id}/start`,
      {
        method: "POST",
      }
    );
    
    location.reload();
  }}
  className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
>
  Start Trip
</button>
    </div>
  ))}
</div>

<div className="mt-10 mb-6">
  <h2 className="text-xl font-semibold text-slate-800">
    Trips In Progress
  </h2>

  <p className="text-sm text-slate-500">
    Trips currently underway.
  </p>
</div>


<div className="grid gap-4">
  {inProgressTrips
  .filter(
    (trip) =>
      trip.assigned_driver_id === driver?.id
  )
  .map((trip) => (
    <div
      key={trip.id}
      className="bg-yellow-50 rounded-xl shadow-lg p-6"
    > 
      <h3 className="text-lg font-semibold text-slate-900">

{trip.full_name}

</h3>

      <p className="text-slate-700">

<strong>Phone:</strong> {trip.phone}

</p>
<p className="text-slate-700">

<strong>Driver:</strong> {trip.driver_name}

</p>

  <div className="bg-slate-50 rounded-xl p-4 mt-4">
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Pickup Location
  </p>

  <p className="text-slate-900 font-medium mt-2">
    {trip.pickup_address}
  </p>

  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
    <p className="text-sm text-blue-800">
      Navigation will guide you to the selected area.
Use the address above for the exact pickup location.
    </p>
  </div>
</div>


<div className="bg-slate-50 rounded-xl p-4 mt-4">
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Destination
  </p>

  <p className="text-slate-900 font-medium mt-2">
    {trip.dropoff_address}
  </p>

  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
    <p className="text-sm text-blue-800">
      Navigation will guide you to the selected area.
Use the address above for the exact dropoff location.
    </p>
  </div>
</div>
<button
  onClick={() =>
    openNavigation(
      trip.destination_lat,
      trip.destination_lng
    )
  }
  className="mt-4 mr-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
>
  Navigate to Destination
</button>
      <button
        onClick={async () => {
          await fetch(
            `https://routex-smgu.onrender.com/trip-requests/${trip.id}/complete`,
            {
              method: "POST",
            }
          );

          location.reload();
        }}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
      >
        Complete Trip
      </button>
    </div>
  ))}
</div>
<div className="mt-10 mb-6">
  <h2 className="text-xl font-semibold text-slate-800">
    Completed Trips
  </h2>

  <p className="text-sm text-slate-500">
    Trips successfully completed and archived.
  </p>
</div>

<div className="grid gap-4">
  {completedTrips
  .filter(
    (trip) =>
      trip.assigned_driver_id === driver?.id
  )
  .map((trip) => (
    <div
      key={trip.id}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition max-w-4xl"
    >
  <div className="flex items-start justify-between mb-6">

  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Booking Reference
    </p>

    <h3 className="text-lg font-semibold text-slate-800">
      BK-{trip.id.toString().padStart(4, "0")}
    </h3>
  </div>

  <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
    Completed
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
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
      Dropoff
    </p>

    <p className="text-slate-800">
      {trip.dropoff_address}
    </p>
  </div>

  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
      Passenger Phone
    </p>

    <p className="text-slate-800">
      {trip.phone}
    </p>
  </div>

  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
      Driver
    </p>

    <p className="text-slate-800">
      {trip.driver_name}
    </p>
  </div>

</div>
    </div>
  ))}
</div>
      </main>
    </>
  );
}
