
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
    fetch("https://routex-development.onrender.com/accepted-trips")
      .then((res) => res.json())
      .then((data) => setAcceptedTrips(data));

    fetch("https://routex-1-z1hf.onrender.com/in-progress-trips")
      .then((res) => res.json())
      .then((data) => setInProgressTrips(data));

    fetch("https://routex-1-z1hf.onrender.com/completed-trips")
      .then((res) => res.json())
      .then((data) => setCompletedTrips(data));

  fetch("https://routex-1-z1hf.onrender.com/trip-requests")
  .then((res) => res.json())
  .then((data) => setRequests(data));
};
  useEffect(() => {
    const storedDriver = localStorage.getItem("driver");

    if (storedDriver) {
      const parsedDriver = JSON.parse(storedDriver);
      setDriver(parsedDriver);

      fetch("https://routex-1-z1hf.onrender.com/driver-list")
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
  if (!photo) {
    alert("Please select a photo first.");
    return;
  }

  if (!driver?.id) {
    alert("Driver not found.");
    return;
  }

  const formData = new FormData();

  formData.append("photo", photo);
  formData.append("driverId", String(driver.id));

  try {
    const response = await fetch(
      "https://routex-1-z1hf.onrender.com/driver/upload-photo",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log("Upload response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    if (data.success) {
      alert("Photo uploaded successfully!");

      const updatedDriver = {
        ...driver,
        profile_image: data.image,
      };

      setDriver(updatedDriver);

      localStorage.setItem(
        "driver",
        JSON.stringify(updatedDriver)
      );

      setPhoto(null);
    }

  } 
  catch (error) {
    console.error("Upload error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Error uploading photo"
    );
  }
};

  const toggleStatus = async () => {
    const newStatus =
      status === "available"
        ? "Offline"
        : "Available";

    try {
      const response = await fetch(
        `https://routex-1-z1hf.onrender.com/drivers/${driver?.id}/status`,
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
        `https://routex-development.onrender.com/trip-requests/${tripId}/accept`,
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
  const errorText = await response.text();

  console.error("ACCEPT TRIP BACKEND ERROR:", errorText);

  alert(
    errorText || "Unable to accept this ride."
  );

  return;
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
        `https://routex-1-z1hf.onrender.com/trip-requests/${tripId}/start`,
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
        `https://routex-1-z1hf.onrender.com/trip-requests/${tripId}/complete`,
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
    <main className="min-h-screen bg-white text-[#111111]">

      <div className="mx-auto w-full max-w-md px-5 pb-12">

        {/* =================================
            HEADER
        ================================= */}
        <header className="flex items-center justify-between pt-6">

          <a
            href="/"
            className="text-[24px] font-extrabold tracking-tight"
          >
            Route<span className="text-[#ff6a00]">X</span>
          </a>

          <div
            className={`
              flex items-center gap-2
              rounded-full
              px-3 py-1.5
              text-[11px]
              font-bold
              ${
                status === "available"
                  ? "bg-[#fff3e8] text-[#ff6a00]"
                  : "bg-[#f4f4f4] text-[#777777]"
              }
            `}
          >
            <span
              className={`
                h-2 w-2 rounded-full
                ${
                  status === "available"
                    ? "bg-[#ff6a00]"
                    : "bg-[#aaaaaa]"
                }
              `}
            />

            {status === "available" ? "Online" : "Offline"}
          </div>

        </header>


        {/* =================================
            DRIVER PROFILE
        ================================= */}
        <section className="pt-9">

          <div className="flex items-center gap-4">

            {/* PROFILE PHOTO */}
            <div className="relative h-[68px] w-[68px] shrink-0">

              <div
                className="
                  h-[68px]
                  w-[68px]
                  overflow-hidden
                  rounded-full
                  border
                  border-[#e8e8e8]
                  bg-[#f7f7f7]
                "
              >
                {driver?.profile_image ? (
                  <img
                    src={`https://routex-1-z1hf.onrender.com/uploads/${driver.profile_image}`}
                    alt={driver?.full_name || "Driver"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-full
                      w-full
                      items-center
                      justify-center
                      text-xl
                      font-bold
                      text-[#aaaaaa]
                    "
                  >
                    {driver?.full_name?.charAt(0)?.toUpperCase() || "D"}
                  </div>
                )}
              </div>


              {/* CHANGE PHOTO */}
              <label
                className="
                  absolute
                  -bottom-1
                  -right-1
                  flex
                  h-7
                  w-7
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-white
                  bg-[#ff6a00]
                  text-[14px]
                  font-bold
                  text-white
                  shadow-sm
                "
              >
                +

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      setPhoto(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

            </div>


            {/* DRIVER DETAILS */}
            <div className="min-w-0 flex-1">

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#ff6a00]
                "
              >
                Driver Portal
              </p>

              <h1
                className="
                  mt-1
                  truncate
                  text-[22px]
                  font-extrabold
                  tracking-tight
                "
              >
                Hi, {driver?.full_name?.split(" ")[0] || "Driver"}
              </h1>

              <p className="mt-1 text-[12px] text-[#777777]">
                {status === "available"
                  ? "You're ready to receive ride requests."
                  : "Go online when you're ready to drive."}
              </p>

            </div>

          </div>


          {/* PHOTO UPLOAD */}
          {photo && (
            <div
              className="
                mt-4
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-[#eeeeee]
                bg-[#fafafa]
                px-4
                py-3
              "
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold">
                  New profile photo
                </p>

                <p className="mt-0.5 truncate text-[10px] text-[#888888]">
                  {photo.name}
                </p>
              </div>

              <button
                type="button"
                onClick={uploadPhoto}
                className="
                  ml-3
                  shrink-0
                  rounded-lg
                  bg-[#111111]
                  px-4
                  py-2
                  text-[11px]
                  font-bold
                  text-white
                "
              >
                Save
              </button>
            </div>
          )}

        </section>


        {/* =================================
            AVAILABILITY
        ================================= */}
        <section
          className={`
            mt-7
            rounded-[22px]
            border
            p-5
            transition
            ${
              status === "available"
                ? "border-[#ffd9bd] bg-[#fff8f3]"
                : "border-[#eeeeee] bg-[#fafafa]"
            }
          `}
        >

          <div className="flex items-start justify-between gap-4">

            <div>

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#888888]
                "
              >
                Availability
              </p>

              <div className="mt-2 flex items-center gap-2">

                <span
                  className={`
                    h-2.5 w-2.5 rounded-full
                    ${
                      status === "available"
                        ? "bg-[#ff6a00]"
                        : "bg-[#aaaaaa]"
                    }
                  `}
                />

                <h2 className="text-[18px] font-extrabold">
                  {status === "available"
                    ? "You're online"
                    : "You're offline"}
                </h2>

              </div>

              <p className="mt-2 max-w-[220px] text-[12px] leading-5 text-[#777777]">
                {status === "available"
                  ? "New RouteX ride requests can appear below."
                  : "Go online to start receiving new ride requests."}
              </p>

            </div>


            {/* STATUS BUTTON */}
            <button
              onClick={toggleStatus}
              className={`
                shrink-0
                rounded-xl
                px-4
                py-3
                text-[12px]
                font-bold
                transition
                active:scale-[0.98]
                ${
                  status === "available"
                    ? "border border-[#dddddd] bg-white text-[#111111]"
                    : "bg-[#111111] text-white"
                }
              `}
            >
              {status === "available"
                ? "Go offline"
                : "Go online"}
            </button>

          </div>

        </section>


         {/* =================================
    CURRENT TRIP
================================= */}
{myInProgressTrips.length > 0 && (
  <section className="mt-8 mb-8">

    {/* HEADER */}
    <div className="mb-4">

      <div className="flex items-center justify-between">

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.08em]
            text-[#ff6a00]
          "
        >
          Current ride
        </p>

        <span
          className="
            rounded-full
            bg-[#fff3e8]
            px-3
            py-1.5
            text-[9px]
            font-bold
            uppercase
            tracking-[0.05em]
            text-[#ff6a00]
          "
        >
          In progress
        </span>

      </div>

      <h2 className="mt-1 text-[20px] font-extrabold tracking-tight">
        Ride in progress
      </h2>

      <p className="mt-1 text-[12px] text-[#777777]">
        Take the passenger to their destination.
      </p>

    </div>


    <div className="space-y-4">

      {myInProgressTrips.map((trip) => (

        <div
          key={trip.id}
          className="
            overflow-hidden
            rounded-[22px]
            border
            border-[#ffd9bd]
            bg-white
            shadow-[0_12px_35px_rgba(0,0,0,0.06)]
          "
        >

          {/* ORANGE ACCENT */}
          <div className="h-1.5 w-full bg-[#ff6a00]" />


          <div className="p-5">

            {/* PASSENGER + BOOKING */}
            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">

                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-[#999999]
                  "
                >
                  Passenger
                </p>

                <h3 className="mt-1 truncate text-[17px] font-extrabold">
                  {trip.full_name || "Passenger"}
                </h3>

                <p className="mt-1 text-[11px] text-[#777777]">
                  {trip.phone}
                </p>

              </div>


              <div className="shrink-0 text-right">

                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-[#999999]
                  "
                >
                  Booking
                </p>

                <p className="mt-1 text-[12px] font-bold">
                  BK-{trip.id.toString().padStart(4, "0")}
                </p>

              </div>

            </div>


            {/* ROUTE */}
            <div className="mt-6 flex gap-3">

              <div className="flex flex-col items-center pt-1">

                <span
                  className="
                    h-2.5
                    w-2.5
                    rounded-full
                    border-[3px]
                    border-[#111111]
                    bg-white
                  "
                />

                <span className="my-1 h-10 w-px bg-[#dddddd]" />

                <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />

              </div>


              <div className="min-w-0 flex-1">

                <div className="mb-4">

                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      text-[#999999]
                    "
                  >
                    Pickup
                  </p>

                  <p className="mt-1 text-[12px] font-semibold leading-5">
                    {trip.pickup_address}
                  </p>

                </div>


                <div>

                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      text-[#999999]
                    "
                  >
                    Destination
                  </p>

                  <p className="mt-1 text-[12px] font-semibold leading-5">
                    {trip.dropoff_address}
                  </p>

                </div>

              </div>

            </div>


            {/* DESTINATION ACTION */}
            <button
              onClick={() =>
                openNavigation(
                  trip.destination_lat,
                  trip.destination_lng
                )
              }
              className="
                mt-6
                flex
                min-h-[52px]
                w-full
                items-center
                justify-center
                rounded-xl
                bg-[#111111]
                px-4
                text-[12px]
                font-bold
                text-white
                transition
                hover:bg-[#222222]
                active:scale-[0.99]
              "
            >
              Navigate to destination →
            </button>


            {/* COMPLETE */}
            <button
              onClick={() => completeTrip(trip.id)}
              disabled={loadingAction === trip.id}
              className="
                mt-3
                flex
                min-h-[52px]
                w-full
                items-center
                justify-center
                rounded-xl
                border
                border-[#ff6a00]
                bg-[#fff8f3]
                px-4
                text-[12px]
                font-bold
                text-[#ff6a00]
                transition
                hover:bg-[#fff3e8]
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loadingAction === trip.id
                ? "Completing..."
                : "Complete ride"}
            </button>

          </div>

        </div>

      ))}

    </div>

  </section>
)}

         {/* =================================
    AVAILABLE TRIPS
================================= */}
<section className="mt-6 mb-8">

  {/* SECTION HEADER */}
  <div className="mb-4">

    <div className="flex items-center justify-between">

      <p
        className="
          text-[10px]
          font-bold
          uppercase
          tracking-[0.08em]
          text-[#ff6a00]
        "
      >
        Ride requests
      </p>

      <span
        className="
          flex
          min-w-[26px]
          items-center
          justify-center
          rounded-full
          bg-[#fff3e8]
          px-2
          py-1
          text-[10px]
          font-bold
          text-[#ff6a00]
        "
      >
        {availableTrips.length}
      </span>

    </div>


    <h2 className="mt-1 text-[20px] font-extrabold tracking-tight">
      Available rides
    </h2>

    <p className="mt-1 text-[12px] text-[#777777]">
      New ride requests will appear here.
    </p>

  </div>


  {/* EMPTY STATE */}
  {availableTrips.length === 0 && (
    <div
      className="
        rounded-[18px]
        border
        border-[#eeeeee]
        bg-[#fafafa]
        px-5
        py-5
      "
    >

      <div className="flex items-center gap-3">

        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-white
            border
            border-[#eeeeee]
          "
        >
          <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />
        </div>


        <div>
          <h3 className="text-[13px] font-bold">
            No ride requests yet
          </h3>

          <p className="mt-1 text-[11px] leading-4 text-[#888888]">
            {status === "available"
              ? "Stay online — new rides will appear automatically."
              : "Go online to start receiving ride requests."}
          </p>
        </div>

      </div>

    </div>
  )}


  {/* RIDE REQUESTS */}
  <div className="space-y-4">

    {availableTrips.map((request) => (

      <div
        key={request.id}
        className="
          overflow-hidden
          rounded-[20px]
          border
          border-[#eeeeee]
          bg-white
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        "
      >

        {/* TOP */}
        <div className="p-5">

          <div className="flex items-start justify-between gap-4">

            {/* PASSENGER */}
            <div className="min-w-0">

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#888888]
                "
              >
                Passenger
              </p>

              <h3 className="mt-1 truncate text-[17px] font-extrabold">
                {request.full_name}
              </h3>

              <p className="mt-1 text-[11px] text-[#777777]">
                {request.phone}
              </p>

            </div>


            {/* FARE */}
            <div className="shrink-0 text-right">

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#888888]
                "
              >
                Fare
              </p>

              <p className="mt-1 text-[24px] font-extrabold tracking-tight text-[#111111]">
                R{request.fare_amount}
              </p>

            </div>

          </div>


          {/* PROMO */}
          {Number(request.discount_amount || 0) > 0 && (
            <div
              className="
                mt-4
                rounded-xl
                border
                border-[#ffd9bd]
                bg-[#fff8f3]
                px-4
                py-3
              "
            >
              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#ff6a00]
                "
              >
                RouteX Promo
              </p>

              <p className="mt-1 text-[12px] font-bold text-[#111111]">
                RouteX covers R
                {Number(request.discount_amount).toFixed(2)}
              </p>

              <p className="mt-1 text-[10px] text-[#777777]">
                Your full fare remains R
                {Number(request.fare_amount).toFixed(2)}
              </p>
            </div>
          )}


          {/* ROUTE */}
          <div className="mt-5">

            <div className="flex gap-3">

              {/* ROUTE LINE */}
              <div className="flex flex-col items-center pt-1">

                <span
                  className="
                    h-2.5
                    w-2.5
                    rounded-full
                    border-[3px]
                    border-[#111111]
                    bg-white
                  "
                />

                <span className="my-1 h-9 w-px bg-[#dddddd]" />

                <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />

              </div>


              {/* LOCATIONS */}
              <div className="min-w-0 flex-1">

                <div className="mb-4">

                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      text-[#999999]
                    "
                  >
                    Pickup
                  </p>

                  <p className="mt-1 text-[12px] font-semibold leading-5">
                    {request.pickup_address}
                  </p>

                </div>


                <div>

                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      text-[#999999]
                    "
                  >
                    Destination
                  </p>

                  <p className="mt-1 text-[12px] font-semibold leading-5">
                    {request.dropoff_address}
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* DATE */}
          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              border-t
              border-[#eeeeee]
              pt-4
            "
          >

            <p className="text-[10px] font-medium text-[#888888]">
              Travel date
            </p>

            <p className="text-[11px] font-bold">
              {new Date(request.travel_date).toLocaleDateString(
                "en-ZA",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              )}
            </p>

          </div>


          {/* ACCEPT */}
          <button
            onClick={() => acceptTrip(request.id)}
            disabled={loadingAction === request.id}
            className="
              mt-5
              flex
              h-13
              w-full
              items-center
              justify-center
              rounded-xl
              bg-[#111111]
              px-4
              py-3.5
              text-[12px]
              font-bold
              text-white
              transition
              hover:bg-[#222222]
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loadingAction === request.id
              ? "Accepting..."
              : "Accept ride →"}
          </button>

        </div>

      </div>

    ))}

  </div>

</section>
          {/* =================================
    ACCEPTED TRIPS
================================= */}
<section className="mb-8">

  {/* HEADER */}
  <div className="mb-4">

    <div className="flex items-center justify-between">

      <p className="
        text-[10px]
        font-bold
        uppercase
        tracking-[0.08em]
        text-[#ff6a00]
      ">
        Upcoming
      </p>

      {myAcceptedTrips.length > 0 && (
        <span className="
          rounded-full
          bg-[#fff3e8]
          px-2.5
          py-1
          text-[10px]
          font-bold
          text-[#ff6a00]
        ">
          {myAcceptedTrips.length}
        </span>
      )}

    </div>

    <h2 className="mt-1 text-[20px] font-extrabold tracking-tight">
      Accepted rides
    </h2>

    <p className="mt-1 text-[12px] text-[#777777]">
      Rides you've accepted and are ready to start.
    </p>

  </div>


  {/* EMPTY STATE */}
  {myAcceptedTrips.length === 0 && (
    <div className="
      rounded-[18px]
      border
      border-[#eeeeee]
      bg-[#fafafa]
      px-5
      py-4
    ">
      <p className="text-[12px] text-[#777777]">
        You have no accepted rides yet.
      </p>
    </div>
  )}


  {/* ACCEPTED RIDE CARDS */}
  <div className="space-y-4">

    {myAcceptedTrips.map((trip) => (

      <div
        key={trip.id}
        className="
          overflow-hidden
          rounded-[20px]
          border
          border-[#eeeeee]
          bg-white
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        "
      >

        <div className="p-5">

          {/* BOOKING + STATUS */}
          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-[#888888]
              ">
                Booking
              </p>

              <h3 className="mt-1 text-[15px] font-extrabold">
                BK-{trip.id.toString().padStart(4, "0")}
              </h3>

            </div>


            <span className="
              rounded-full
              bg-[#fff3e8]
              px-3
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.05em]
              text-[#ff6a00]
            ">
              Accepted
            </span>

          </div>


          {/* PASSENGER */}
          <div className="mt-5">

            <p className="
              text-[9px]
              font-bold
              uppercase
              tracking-[0.08em]
              text-[#999999]
            ">
              Passenger
            </p>

            <p className="mt-1 text-[14px] font-bold">
              {trip.full_name || "Passenger"}
            </p>

            <p className="mt-0.5 text-[11px] text-[#777777]">
              {trip.phone}
            </p>

          </div>


          {/* ROUTE */}
          <div className="mt-5 flex gap-3">

            {/* ROUTE LINE */}
            <div className="flex flex-col items-center pt-1">

              <span className="
                h-2.5
                w-2.5
                rounded-full
                border-[3px]
                border-[#111111]
                bg-white
              " />

              <span className="my-1 h-10 w-px bg-[#dddddd]" />

              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />

            </div>


            {/* LOCATIONS */}
            <div className="min-w-0 flex-1">

              <div className="mb-4">

                <p className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#999999]
                ">
                  Pickup
                </p>

                <p className="mt-1 text-[12px] font-semibold leading-5">
                  {trip.pickup_address}
                </p>

              </div>


              <div>

                <p className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-[#999999]
                ">
                  Destination
                </p>

                <p className="mt-1 text-[12px] font-semibold leading-5">
                  {trip.dropoff_address}
                </p>

              </div>

            </div>

          </div>


          {/* ACTIONS */}
          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              onClick={() =>
                openNavigation(
                  trip.pickup_lat,
                  trip.pickup_lng
                )
              }
              className="
                min-h-[50px]
                rounded-xl
                border
                border-[#dddddd]
                bg-white
                px-3
                text-[11px]
                font-bold
                text-[#111111]
                transition
                hover:bg-[#fafafa]
                active:scale-[0.98]
              "
            >
              Navigate to pickup
            </button>


            <button
              onClick={() => startTrip(trip.id)}
              disabled={loadingAction === trip.id}
              className="
                min-h-[50px]
                rounded-xl
                bg-[#111111]
                px-3
                text-[11px]
                font-bold
                text-white
                transition
                hover:bg-[#222222]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loadingAction === trip.id
                ? "Starting..."
                : "Start ride →"}
            </button>

          </div>

        </div>

      </div>

    ))}

  </div>

</section>
         {/* =================================
    COMPLETED TRIPS
================================= */}
<section className="pb-10">

  {/* HEADER */}
  <div className="mb-4">

    <div className="flex items-center justify-between">

      <p
        className="
          text-[10px]
          font-bold
          uppercase
          tracking-[0.08em]
          text-[#888888]
        "
      >
        History
      </p>

      {myCompletedTrips.length > 0 && (
        <span
          className="
            rounded-full
            bg-[#f4f4f4]
            px-2.5
            py-1
            text-[10px]
            font-bold
            text-[#666666]
          "
        >
          {myCompletedTrips.length}
        </span>
      )}

    </div>

    <h2 className="mt-1 text-[20px] font-extrabold tracking-tight">
      Completed rides
    </h2>

    <p className="mt-1 text-[12px] text-[#777777]">
      Your recent RouteX ride history.
    </p>

  </div>


  {/* EMPTY */}
  {myCompletedTrips.length === 0 && (
    <div
      className="
        rounded-[18px]
        border
        border-[#eeeeee]
        bg-[#fafafa]
        px-5
        py-4
      "
    >
      <p className="text-[12px] text-[#777777]">
        No completed rides yet.
      </p>
    </div>
  )}


  {/* HISTORY */}
  <div className="space-y-3">

    {myCompletedTrips.map((trip) => (

      <div
        key={trip.id}
        className="
          rounded-[18px]
          border
          border-[#eeeeee]
          bg-white
          p-4
        "
      >

        {/* TOP */}
        <div className="flex items-center justify-between gap-3">

          <div>
            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-[#999999]
              "
            >
              Booking
            </p>

            <p className="mt-1 text-[13px] font-bold">
              BK-{trip.id.toString().padStart(4, "0")}
            </p>
          </div>


          <span
            className="
              rounded-full
              bg-[#f4f4f4]
              px-3
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.05em]
              text-[#666666]
            "
          >
            Completed
          </span>

        </div>


        {/* ROUTE */}
        <div className="mt-4 flex gap-3">

          <div className="flex flex-col items-center pt-1">

            <span
              className="
                h-2
                w-2
                rounded-full
                border-2
                border-[#111111]
                bg-white
              "
            />

            <span className="my-1 h-8 w-px bg-[#dddddd]" />

            <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />

          </div>


          <div className="min-w-0 flex-1">

            <div className="mb-3">

              <p className="text-[9px] font-bold uppercase text-[#999999]">
                Pickup
              </p>

              <p className="mt-1 text-[11px] font-medium leading-4">
                {trip.pickup_address}
              </p>

            </div>


            <div>

              <p className="text-[9px] font-bold uppercase text-[#999999]">
                Destination
              </p>

              <p className="mt-1 text-[11px] font-medium leading-4">
                {trip.dropoff_address}
              </p>

            </div>

          </div>

        </div>


        {/* PASSENGER */}
        <div
          className="
            mt-4
            border-t
            border-[#eeeeee]
            pt-3
          "
        >
          <p className="text-[10px] text-[#888888]">
            Passenger
          </p>

          <p className="mt-1 text-[11px] font-semibold">
            {trip.phone}
          </p>
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
