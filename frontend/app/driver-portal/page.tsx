
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
  const [driver, setDriver] = useState<any>(null);
  const [status, setStatus] = useState("offline");
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

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

      fetch("https://routex-smgu.onrender.com/driver-list")
        .then((res) => res.json())
        .then((data) => {
          const currentDriver = data.find(
            (d: any) =>
              Number(d.id) === Number(parsedDriver.id)
          );

          if (currentDriver?.status === "Available") {
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

 const uploadPhoto = async () => {
  console.log("Upload function started");

  if (!photo) {
    alert("Please select a photo first");
    return;
  }

  if (!driver) {
    alert("Driver not found");
    return;
  }

  alert(`Uploading for driver ${driver.id}`);

  const formData = new FormData();
  formData.append("photo", photo);
  formData.append("driverId", String(driver.id));

  try {
    const response = await fetch(
      "https://routex-smgu.onrender.com/driver/upload-photo",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log(data);

    if (data.success) {
      alert("Photo uploaded successfully!");
    } else {
      alert("Upload failed.");
    }
  } catch (error) {
    console.error(error);
    alert("Error uploading photo");
  }
};

  const toggleStatus = async () => {
    const newStatus =
      status === "available"
        ? "Offline"
        : "Available";

    try {
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
      alert("Unable to update your status.");
    }
  };

  const acceptTrip = async (tripId: number) => {
    setLoadingAction(tripId);

    try {
      const response = await fetch(
        `https://routex-smgu.onrender.com/trip-requests/${tripId}/accept`,
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

      if (!response.ok) {
        throw new Error("Unable to accept trip");
      }

      showNotification(
        "Trip Accepted",
        "Navigate to the pickup location."
      );

      loadTrips();
    } catch (error) {
      console.error(error);
      alert("Unable to accept trip.");
    } finally {
      setLoadingAction(null);
    }
  };

  const startTrip = async (tripId: number) => {
    setLoadingAction(tripId);

    try {
      const response = await fetch(
        `https://routex-smgu.onrender.com/trip-requests/${tripId}/start`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to start trip");
      }

      loadTrips();
    } catch (error) {
      console.error(error);
      alert("Unable to start trip.");
    } finally {
      setLoadingAction(null);
    }
  };

  const completeTrip = async (tripId: number) => {
    setLoadingAction(tripId);

    try {
      const response = await fetch(
        `https://routex-smgu.onrender.com/trip-requests/${tripId}/complete`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to complete trip");
      }

      loadTrips();
    } catch (error) {
      console.error(error);
      alert("Unable to complete trip.");
    } finally {
      setLoadingAction(null);
    }
  };

  const myAcceptedTrips = acceptedTrips.filter(
    (trip) =>
      Number(trip.assigned_driver_id) === Number(driver?.id)
  );

  const myInProgressTrips = inProgressTrips.filter(
    (trip) =>
      Number(trip.assigned_driver_id) === Number(driver?.id)
  );

  const myCompletedTrips = completedTrips.filter(
    (trip) =>
      Number(trip.assigned_driver_id) === Number(driver?.id)
  );

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 text-slate-900">

        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-5 py-4">

            <div className="flex items-center justify-between">

              <div>
                <a
                  href="/"
                  className="text-2xl font-bold tracking-tight"
                >
                  Route<span className="text-teal-600">X</span>
                </a>

                <p className="text-xs text-slate-500 mt-1">
                  Driver
                </p>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                  status === "available"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === "available"
                      ? "bg-green-500"
                      : "bg-slate-400"
                  }`}
                />

                {status === "available"
                  ? "Online"
                  : "Offline"}
              </div>

            </div>

          </div>
        </header>

        {/* MAIN */}
        <div className="max-w-5xl mx-auto px-5 py-6">

      
{/* DRIVER STATUS */}
<section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6">

  <div className="flex items-center justify-between gap-4">

    {/* Driver information */}
    <div className="flex items-center gap-4">

      {/* Profile Photo */}
      <div className="relative shrink-0">

        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200">

          {driver?.profile_image ? (
  <img
    src={`https://routex-smgu.onrender.com/uploads/${driver.profile_image}`}
    alt={driver?.full_name || "Driver"}
    className="w-full h-full rounded-full object-cover"
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
    {driver?.full_name?.charAt(0)?.toUpperCase() || "D"}
  </div>
)}

        </div>

        {/* Online indicator */}
        <span
          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
            status === "available"
              ? "bg-green-500"
              : "bg-slate-400"
          }`}
        />

      </div>


      {/* Driver name */}
      <div>

        <p className="text-sm text-slate-500">
          Welcome back
        </p>

        <h1 className="text-xl sm:text-2xl font-bold mt-0.5">
          {driver?.full_name || "Driver"}
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          {status === "available"
            ? "You are available for trips."
            : "You are currently offline."}
        </p>

      </div>

    </div>


    {/* Online / Offline button */}
    <button
      onClick={toggleStatus}
      className={`shrink-0 px-4 sm:px-6 py-3 rounded-xl font-semibold text-white transition ${
        status === "available"
          ? "bg-slate-900 hover:bg-slate-800"
          : "bg-teal-600 hover:bg-teal-700"
      }`}
    >
      {status === "available"
        ? "Go Offline"
        : "Go Online"}
    </button>

  </div>


  {/* Profile Photo Upload */}
  <div className="mt-5 pt-5 border-t border-slate-100">

    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      Profile photo
    </label>

    <div className="mt-2 flex items-center gap-3">

      <label className="cursor-pointer text-sm font-semibold text-teal-600 hover:text-teal-700">
        Change photo

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setPhoto(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </label>

      <span className="text-xs text-slate-400">
        JPG or PNG
      </span>

    </div>
<button
  onClick={() => {
    alert("Button clicked");
    uploadPhoto();
  }}
  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
>
  Upload Photo
</button>
  </div>

</section>


          {/* CURRENT TRIP */}
          {myInProgressTrips.length > 0 && (
            <section className="mb-8">

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
                    Current trip
                  </p>

                  <h2 className="text-xl font-bold mt-1">
                    Trip in progress
                  </h2>
                </div>

                <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                  IN PROGRESS
                </span>
              </div>

              <div className="space-y-4">

                {myInProgressTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                  >

                    {/* Passenger */}
                    <div className="p-5 border-b border-slate-100">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">
                            Passenger
                          </p>

                          <h3 className="text-lg font-bold mt-1">
                            {trip.full_name}
                          </h3>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            Booking
                          </p>

                          <p className="font-semibold">
                            BK-{trip.id
                              .toString()
                              .padStart(4, "0")}
                          </p>
                        </div>

                      </div>

                      <p className="text-sm text-slate-500 mt-2">
                        {trip.phone}
                      </p>

                    </div>

                    {/* Route */}
                    <div className="p-5">

                      <div className="relative pl-7">

                        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-300" />

                        <div className="relative mb-6">
                          <span className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-teal-600" />

                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Pickup
                          </p>

                          <p className="font-medium mt-1">
                            {trip.pickup_address}
                          </p>
                        </div>

                        <div className="relative">
                          <span className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-slate-900" />

                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Destination
                          </p>

                          <p className="font-medium mt-1">
                            {trip.dropoff_address}
                          </p>
                        </div>

                      </div>

                      {/* Navigation */}
                      <button
                        onClick={() =>
                          openNavigation(
                            trip.destination_lat,
                            trip.destination_lng
                          )
                        }
                        className="w-full mt-6 h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
                      >
                        Navigate to Destination
                      </button>

                      <button
                        onClick={() =>
                          completeTrip(trip.id)
                        }
                        disabled={loadingAction === trip.id}
                        className="w-full mt-3 h-14 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold transition"
                      >
                        {loadingAction === trip.id
                          ? "Completing..."
                          : "Complete Trip"}
                      </button>

                    </div>

                  </div>
                ))}

              </div>
            </section>
          )}

          {/* AVAILABLE TRIPS */}
          <section className="mb-8">

            <div className="mb-4">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
                    Ride requests
                  </p>

                  <h2 className="text-xl font-bold mt-1">
                    Available trips
                  </h2>
                </div>

                {availableTrips.length > 0 && (
                  <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {availableTrips.length}
                  </span>
                )}

              </div>

              <p className="text-sm text-slate-500 mt-1">
                Trips waiting for driver acceptance.
              </p>
            </div>

            {availableTrips.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">

                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
                  —
                </div>

                <h3 className="font-semibold mt-4">
                  No available trips
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  New ride requests will appear here automatically.
                </p>

              </div>
            )}

            <div className="space-y-4">

              {availableTrips.map((request) => (
                <div
                  key={request.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                >

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Passenger
                        </p>

                        <h3 className="text-lg font-bold mt-1">
                          {request.full_name}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          {request.phone}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Fare
                        </p>

                        <p className="text-xl font-bold text-teal-600 mt-1">
                          R{request.fare_amount}
                        </p>
                      </div>

                    </div>

                    {/* Route */}
                    <div className="mt-5 bg-slate-50 rounded-xl p-4">

                      <div className="flex gap-3">

                        <div className="flex flex-col items-center pt-1">

                          <span className="w-3 h-3 rounded-full bg-teal-600" />

                          <span className="w-px h-8 bg-slate-300" />

                          <span className="w-3 h-3 rounded-full bg-slate-900" />

                        </div>

                        <div className="flex-1">

                          <div className="mb-4">
                            <p className="text-xs text-slate-500">
                              Pickup
                            </p>

                            <p className="text-sm font-medium mt-1">
                              {request.pickup_address}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Dropoff
                            </p>

                            <p className="text-sm font-medium mt-1">
                              {request.dropoff_address}
                            </p>
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* Date */}
                    <div className="mt-4 flex items-center justify-between">

                      <p className="text-sm text-slate-500">
                        Travel date
                      </p>

                      <p className="text-sm font-medium">
                        {new Date(
                          request.travel_date
                        ).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        acceptTrip(request.id)
                      }
                      disabled={loadingAction === request.id}
                      className="w-full h-14 mt-5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold transition"
                    >
                      {loadingAction === request.id
                        ? "Accepting..."
                        : "Accept Trip"}
                    </button>

                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* ACCEPTED TRIPS */}
          <section className="mb-8">

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Upcoming
              </p>

              <h2 className="text-xl font-bold mt-1">
                My accepted trips
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Trips you have accepted and are waiting to start.
              </p>
            </div>

            {myAcceptedTrips.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <p className="text-sm text-slate-500">
                  You have no accepted trips yet.
                </p>
              </div>
            )}

            <div className="space-y-4">

              {myAcceptedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5"
                >

                  <div className="flex items-center justify-between mb-5">

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Booking reference
                      </p>

                      <h3 className="font-bold mt-1">
                        BK-{trip.id
                          .toString()
                          .padStart(4, "0")}
                      </h3>
                    </div>

                    <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                      ACCEPTED
                    </span>

                  </div>

                  <div className="space-y-4">

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Passenger
                      </p>

                      <p className="font-medium mt-1">
                        {trip.full_name || "Passenger"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {trip.phone}
                      </p>
                    </div>

                    <div className="relative pl-6">

                      <div className="absolute left-1 top-2 bottom-2 w-px bg-slate-300" />

                      <div className="relative mb-5">
                        <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-600" />

                        <p className="text-xs text-slate-500">
                          Pickup
                        </p>

                        <p className="text-sm font-medium mt-1">
                          {trip.pickup_address}
                        </p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-slate-900" />

                        <p className="text-xs text-slate-500">
                          Dropoff
                        </p>

                        <p className="text-sm font-medium mt-1">
                          {trip.dropoff_address}
                        </p>
                      </div>

                    </div>

                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-6">

                    <button
                      onClick={() =>
                        openNavigation(
                          trip.pickup_lat,
                          trip.pickup_lng
                        )
                      }
                      className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
                    >
                      Navigate to Pickup
                    </button>

                    <button
                      onClick={() =>
                        startTrip(trip.id)
                      }
                      disabled={loadingAction === trip.id}
                      className="h-12 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold transition"
                    >
                      {loadingAction === trip.id
                        ? "Starting..."
                        : "Start Trip"}
                    </button>

                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* COMPLETED */}
          <section className="pb-10">

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                History
              </p>

              <h2 className="text-xl font-bold mt-1">
                Completed trips
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Your completed RouteX trips.
              </p>
            </div>

            {myCompletedTrips.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <p className="text-sm text-slate-500">
                  No completed trips yet.
                </p>
              </div>
            )}

            <div className="space-y-3">

              {myCompletedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Booking
                      </p>

                      <h3 className="font-semibold mt-1">
                        BK-{trip.id
                          .toString()
                          .padStart(4, "0")}
                      </h3>
                    </div>

                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      COMPLETED
                    </span>

                  </div>

                  <div className="mt-5 space-y-3">

                    <div>
                      <p className="text-xs text-slate-500">
                        Pickup
                      </p>

                      <p className="text-sm font-medium mt-1">
                        {trip.pickup_address}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Dropoff
                      </p>

                      <p className="text-sm font-medium mt-1">
                        {trip.dropoff_address}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Passenger
                      </p>

                      <p className="text-sm font-medium mt-1">
                        {trip.phone}
                      </p>
                    </div>

                  </div>

                </div>
              ))}

            </div>

          </section>

        </div>
      </main>
    </AuthGuard>
  );
}
