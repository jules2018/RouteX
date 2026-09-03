"use client";

import { useEffect, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Car,
  MapPin,
  CalendarDays,
  UserRound,
  Palette,
  CreditCard,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export default function PassengerPortalPage() {
  const [passenger, setPassenger] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);

  /* ================================
      LOAD PASSENGER TRIPS
  ================================= */
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

  /* ================================
      LOAD ONLINE DRIVERS
  ================================= */
  const loadOnlineDrivers = () => {
    fetch(
      "https://routex-smgu.onrender.com/online-drivers"
    )
      .then((res) => res.json())
      .then((data) => {
        setOnlineDrivers(Number(data.total));
      });
  };

  /* ================================
      LOAD DATA
  ================================= */
  useEffect(() => {
    const storedPassenger =
      localStorage.getItem("passenger");

    if (storedPassenger) {
      const passengerData =
        JSON.parse(storedPassenger);

      setPassenger(passengerData);

      loadTrips(passengerData.id);
      loadOnlineDrivers();

      const interval = setInterval(() => {
        loadTrips(passengerData.id);
        loadOnlineDrivers();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);
  console.log("PHOTO STATE:", photo);
const uploadPhoto = async () => {
  if (!photo) {
    alert("Please select a photo first.");
    return;
  }

  if (!passenger?.id) {
    alert("Passenger not found.");
    return;
  }

  const formData = new FormData();

  formData.append("photo", photo);
  formData.append("passengerId", String(passenger.id));

  try {
   const response = await fetch(
  "https://routex-1-z1hf.onrender.com/passenger/upload-photo",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

 if (data.success) {
  alert("Photo uploaded successfully!");

  const updatedPassenger = {
    ...passenger,
    profile_image: data.image,
  };

  setPassenger(updatedPassenger);

  localStorage.setItem(
    "passenger",
    JSON.stringify(updatedPassenger)
  );

  setPhoto(null);
}
    
    else {
      alert(data.error || "Upload failed.");
    }

  } catch (error) {
    console.error(error);
    alert("Error uploading photo.");
  }
};
  return (
    <main
      className={`${jakarta.variable} min-h-[100dvh] bg-white text-[#111111]`}
      style={{ fontFamily: "var(--font-jakarta)" }}
    >

      {/* =================================
          MAIN CONTAINER
      ================================== */}
      <div className="mx-auto w-full max-w-md px-5 pb-10">


        {/* =================================
            ROUTEX BRAND
        ================================= */}
        <header className="pt-7">

          <h1
            className="
              text-[25px]
              font-extrabold
              tracking-[-0.06em]
            "
          >
            <span className="text-[#111111]">
              Route
            </span>

            <span className="text-teal-600">
              X
            </span>
          </h1>

        </header>


{/* =================================
    WELCOME
================================= */}

<section className="pt-8">
  <div className="flex items-center gap-4">

    {/* Profile Photo */}
    <div className="relative h-20 w-20 shrink-0">

      {/* Photo Circle */}
      <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100">

        {photo ? (
          <img
            src={URL.createObjectURL(photo)}
            alt="Selected profile photo"
            className="h-full w-full object-cover"
          />
        ) : passenger?.profile_image ? (
          <img
            src={passenger.profile_image}
            alt={passenger?.full_name || "Passenger"}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}

        {/* Fallback Initial */}
        <div
          className={`absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-400 ${
            photo || passenger?.profile_image ? "hidden" : ""
          }`}
        >
          {passenger?.full_name?.charAt(0)?.toUpperCase() || "P"}
        </div>
      </div>

      {/* Change Photo Button */}
      <label
        className="
          absolute
          -bottom-1
          -right-1
          z-10
          flex
          h-7
          w-7
          cursor-pointer
          items-center
          justify-center
          rounded-full
          border-2
          border-white
          bg-teal-600
          text-white
          shadow-md
          hover:bg-teal-700
        "
        title="Change profile photo"
      >
        <span className="text-[12px]">✎</span>

        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
         onChange={async (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Please choose an image smaller than 5MB.");
    return;
  }

  setPhoto(file);

}}

          className="hidden"
        />
      </label>

    </div>

    {/* Passenger Information */}
    <div className="min-w-0">

      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#888888]">
        Passenger Portal
      </p>

      <h2 className="mt-1 text-[24px] font-extrabold leading-tight">
        Welcome back
        {passenger?.full_name
          ? `, ${passenger.full_name.trim().split(/\s+/)[0]}`
          : ""}
      </h2>

      <p className="mt-1 text-[13px] font-medium text-[#777777]">
        Manage your rides and bookings.
      </p>

    </div>

  </div>
</section>

       
        {/* =================================
            AVAILABILITY
        ================================== */}
        <section className="mt-7">

          <div
            className="
              rounded-[20px]
              bg-[#f5f5f5]
              p-5
            "
          >

            <div className="flex items-center gap-4">

              {/* Icon */}
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                "
              >
                <Car
                  size={21}
                  strokeWidth={2.3}
                  className="text-[#111111]"
                />
              </div>


              {/* Text */}
              <div>

                <p
                  className="
                    text-[11px]
                    font-bold
                    text-[#777777]
                  "
                >
                  RouteX Availability
                </p>

                <p
                  className="
                    mt-0.5
                    text-[18px]
                    font-extrabold
                    tracking-[-0.03em]
                  "
                >
                  {onlineDrivers} Drivers Online
                </p>

              </div>

            </div>


            <p
              className="
                mt-4
                text-[12px]
                font-medium
                leading-relaxed
                text-[#777777]
              "
            >
              Available drivers ready to accept trips.
            </p>

          </div>

        </section>


        {/* =================================
            ACCOUNT
        ================================== */}
        <section className="mt-5">

          <div
            className="
              rounded-[20px]
              border
              border-[#e5e5e5]
              bg-white
              p-5
            "
          >

            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-[#999999]
              "
            >
              Account
            </p>

            <p
              className="
                mt-2
                text-[14px]
                font-bold
                text-[#222222]
              "
            >
              {passenger?.email}
            </p>

          </div>

        </section>


        {/* =================================
            TRIPS HEADER
        ================================== */}
        <section className="mt-9">

          <h2
            className="
              text-[22px]
              font-extrabold
              tracking-[-0.04em]
            "
          >
            Your Trips
          </h2>

          <p
            className="
              mt-1
              text-[12px]
              font-medium
              text-[#777777]
            "
          >
            {trips.length} booking
            {trips.length !== 1 ? "s" : ""} tracked
          </p>

        </section>


        {/* =================================
            TRIPS
        ================================== */}
        <section className="mt-5 space-y-4">

          {trips.length === 0 ? (

            /* =================================
                NO TRIPS
            ================================== */
            <div
              className="
                rounded-[20px]
                bg-[#f5f5f5]
                p-7
                text-center
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                "
              >
                <Car
                  size={21}
                  strokeWidth={2}
                  className="text-[#555555]"
                />
              </div>

              <p
                className="
                  mt-4
                  text-[14px]
                  font-extrabold
                "
              >
                No trips yet
              </p>

              <p
                className="
                  mt-1
                  text-[12px]
                  font-medium
                  text-[#777777]
                "
              >
                You have no trips scheduled.
              </p>

            </div>

          ) : (

            /* =================================
                TRIP CARDS
            ================================== */
            trips.map((trip) => (

              <div
                key={trip.id}
                className="
                  rounded-[20px]
                  border
                  border-[#e5e5e5]
                  bg-white
                  p-5
                "
              >

                {/* =================================
                    BOOKING HEADER
                ================================== */}
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >

                  <div>

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.08em]
                        text-[#999999]
                      "
                    >
                      Booking Reference
                    </p>

                    <h3
                      className="
                        mt-1
                        text-[16px]
                        font-extrabold
                      "
                    >
                      BK-
                      {trip.id
                        .toString()
                        .padStart(4, "0")}
                    </h3>

                  </div>


                  {/* Status */}
                  <span
                    className={`
                      shrink-0
                      rounded-full
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold

                      ${
                        trip.trip_status === "Waiting"
                          ? "bg-[#f1f1f1] text-[#333333]"
                          : trip.trip_status === "Accepted"
                          ? "bg-[#eeeeee] text-[#111111]"
                          : trip.trip_status === "In Progress"
                          ? "bg-[#111111] text-white"
                          : "bg-[#f1f1f1] text-[#333333]"
                      }
                    `}
                  >
                    {trip.trip_status}
                  </span>

                </div>


                {/* =================================
                    ROUTE
                ================================== */}
                <div className="mt-6">

                  <div className="flex gap-4">

                    {/* Route Line */}
                    <div
                      className="
                        flex
                        w-3
                        shrink-0
                        flex-col
                        items-center
                      "
                    >

                      <div
                        className="
                          mt-1
                          h-2.5
                          w-2.5
                          rounded-full
                          bg-[#111111]
                        "
                      />

                      <div
                        className="
                          my-1
                          h-10
                          border-l
                          border-dashed
                          border-[#cccccc]
                        "
                      />

                      <div
                        className="
                          h-2.5
                          w-2.5
                          rounded-full
                          bg-teal-600
                        "
                      />

                    </div>


                    {/* Locations */}
                    <div className="flex-1">

                      {/* Pickup */}
                      <div>

                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-[#999999]
                          "
                        >
                          Pickup
                        </p>

                        <p
                          className="
                            mt-1
                            text-[13px]
                            font-semibold
                            leading-relaxed
                            text-[#333333]
                          "
                        >
                          {trip.pickup_address}
                        </p>

                      </div>


                      {/* Dropoff */}
                      <div className="mt-6">

                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-[#999999]
                          "
                        >
                          Dropoff
                        </p>

                        <p
                          className="
                            mt-1
                            text-[13px]
                            font-semibold
                            leading-relaxed
                            text-[#333333]
                          "
                        >
                          {trip.dropoff_address}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>


                {/* =================================
                    TRIP INFORMATION
                ================================== */}
                <div
                  className="
                    mt-6
                    border-t
                    border-[#eeeeee]
                    pt-5
                  "
                >

                  <div className="grid grid-cols-2 gap-5">


                    {/* Travel Date */}
                    <div className="flex gap-2.5">

                      <CalendarDays
                        size={17}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-[#555555]"
                      />

                      <div>

                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-[#999999]
                          "
                        >
                          Travel Date
                        </p>

                        <p
                          className="
                            mt-1
                            text-[12px]
                            font-semibold
                          "
                        >
                          {new Date(
                            trip.travel_date
                          ).toLocaleDateString()}
                        </p>

                      </div>

                    </div>


                    {/* Driver */}
                    <div className="flex gap-2.5">

                      <UserRound
                        size={17}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-[#555555]"
                      />

                      <div>

                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-[#999999]
                          "
                        >
                          Driver
                        </p>

                        <p
                          className="
                            mt-1
                            text-[12px]
                            font-semibold
                          "
                        >
                          {trip.driver_name || "Not assigned"}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* =================================
                      VEHICLE
                  ================================== */}
                  <div
                    className="
                      mt-5
                      rounded-[16px]
                      bg-[#f7f7f7]
                      p-4
                    "
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          bg-white
                        "
                      >

                        <Car
                          size={18}
                          strokeWidth={2.2}
                          className="text-[#111111]"
                        />

                      </div>


                      <div>

                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-[#999999]
                          "
                        >
                          Vehicle
                        </p>

                        <p
                          className="
                            mt-1
                            text-[12px]
                            font-bold
                          "
                        >
                          {trip.vehicle_type ||
                            "Not assigned"}
                        </p>

                      </div>

                    </div>


                    {/* Vehicle Details */}
                    <div
                      className="
                        mt-4
                        grid
                        grid-cols-2
                        gap-3
                      "
                    >

                      <div className="flex items-center gap-2">

                        <Palette
                          size={14}
                          strokeWidth={2}
                          className="text-[#777777]"
                        />

                        <span
                          className="
                            text-[11px]
                            font-medium
                            text-[#555555]
                          "
                        >
                          {trip.vehicle_color ||
                            "—"}
                        </span>

                      </div>


                      <div className="flex items-center gap-2">

                        <CreditCard
                          size={14}
                          strokeWidth={2}
                          className="text-[#777777]"
                        />

                        <span
                          className="
                            text-[11px]
                            font-bold
                            text-[#333333]
                          "
                        >
                          {trip.license_plate ||
                            "—"}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            ))

          )}

        </section>


        {/* =================================
            FOOTER
        ================================== */}
        <footer className="mt-10 border-t border-[#eeeeee] pt-5 text-center">

          <p
            className="
              text-[11px]
              font-medium
              text-[#aaaaaa]
            "
          >
            Getting Upington Moving
          </p>

        </footer>

      </div>

    </main>
  );
}