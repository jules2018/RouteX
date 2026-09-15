"use client";

import { useEffect, useMemo, useState } from "react";
import { Outfit } from "next/font/google";
import { API_URL } from "../lib/api";
import {
  Car,
  CalendarDays,
  UserRound,
  Palette,
  CreditCard,
} from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
});

/* =========================================================
   API CONFIGURATION
========================================================= */



/* =========================================================
   IMAGE URL HELPER
========================================================= */

function getProfileImageUrl(image: string | null | undefined) {
  if (!image) {
    return "";
  }

  // Already a complete HTTPS URL
  if (image.startsWith("https://")) {
    return image;
  }

  // Convert HTTP to HTTPS
  // This is important when your website is opened over HTTPS.
  if (image.startsWith("http://")) {
    return image.replace("http://", "https://");
  }

  // Backend returned something like:
  // /uploads/profile.jpg
  //
  // or:
  // uploads/profile.jpg
 return `${API_URL}${
  image.startsWith("/") ? "" : "/"
}${image}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function PassengerPortalPage() {
  const [passenger, setPassenger] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState(0);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
 
  
  const [reviewRatings, setReviewRatings] = useState<Record<number, number>>({});
  const [reviewTexts, setReviewTexts] = useState<Record<number, string>>({});
  const [submittingReview, setSubmittingReview] = useState<number | null>(null);
  const [reviewedTrips, setReviewedTrips] = useState<Record<number, boolean>>({});
  /* =======================================================
     LOCAL PHOTO PREVIEW
  ======================================================= */

  const photoPreviewUrl = useMemo(() => {
    if (!photo) {
      return "";
    }

    return URL.createObjectURL(photo);
  }, [photo]);

  /* =======================================================
     CLEAN UP PHOTO PREVIEW
  ======================================================= */

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  /* =======================================================
     LOAD PASSENGER TRIPS
  ======================================================= */

  const loadTrips = async (passengerId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/passenger-bookings/${passengerId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load trips: ${response.status}`
        );
      }

      const data = await response.json();

      setTrips(Array.isArray(data) ? data : []);
      const waitingTrip = Array.isArray(data)
  ? data.find(
      (trip: any) =>
        trip.trip_status === "Waiting" &&
        trip.pickup_lat &&
        trip.pickup_lng
    )
  : null;

if (waitingTrip) {
  loadAvailableDrivers(
    Number(waitingTrip.pickup_lat),
    Number(waitingTrip.pickup_lng)
  );
} else {
  setAvailableDrivers([]);
}

      console.log("TRIPS:", data);
    } catch (error) {
      console.error("Error loading trips:", error);
    }
  };

  const cancelBooking = async (bookingId: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this booking?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/bookings/${bookingId}/cancel`,
      {
        method: "PATCH",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Could not cancel booking.");
      return;
    }

    setTrips((currentTrips) =>
      currentTrips.map((trip) =>
        trip.id === bookingId
          ? {
              ...trip,
              trip_status: "Cancelled",
              booking_status: "Cancelled",
            }
          : trip
      )
    );
  } catch (error) {
    console.error("CANCEL BOOKING ERROR:", error);
    alert("Could not cancel booking.");
  }
};

const submitDriverReview = async (trip: any) => {
  const rating = reviewRatings[trip.id];

  if (!rating) {
    alert("Please select a star rating.");
    return;
  }

  try {
    setSubmittingReview(trip.id);

    const response = await fetch(`${API_URL}/driver-reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        booking_id: trip.id,
        passenger_id: passenger.id,
        rating,
        review_text: reviewTexts[trip.id] || "",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to submit review."
      );
    }

    setReviewedTrips((prev) => ({
      ...prev,
      [trip.id]: true,
    }));

    alert("Thank you for rating your driver.");

  } catch (error: any) {
    console.error("REVIEW ERROR:", error);
    alert(error.message || "Unable to submit review.");
  } finally {
    setSubmittingReview(null);
  }
};
  /* =======================================================
     LOAD ONLINE DRIVERS
  ======================================================= */

  const loadOnlineDrivers = async () => {
    try {
      const response = await fetch(
        `${API_URL}/online-drivers`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load drivers: ${response.status}`
        );
      }

      const data = await response.json();

      setOnlineDrivers(Number(data.total) || 0);

      console.log("ONLINE DRIVERS:", data);
    } catch (error) {
      console.error(
        "Error loading online drivers:",
        error
      );
    }
  };

  const loadAvailableDrivers = async (
  pickupLat: number,
  pickupLng: number
) => {
  try {
    const response = await fetch(
      `${API_URL}/available-drivers?pickup_lat=${pickupLat}&pickup_lng=${pickupLng}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load available drivers: ${response.status}`
      );
    }

    const data = await response.json();

    setAvailableDrivers(
      Array.isArray(data) ? data : []
    );

    console.log("AVAILABLE DRIVERS:", data);

  } catch (error) {
    console.error(
      "Error loading available drivers:",
      error
    );

    setAvailableDrivers([]);
  }
};

  /* =======================================================
     LOAD PASSENGER
  ======================================================= */

  useEffect(() => {
    const storedPassenger =
      localStorage.getItem("passenger");

    if (!storedPassenger) {
      console.log("No passenger found in localStorage.");
      return;
    }

    try {
      const passengerData =
        JSON.parse(storedPassenger);

      console.log(
        "PASSENGER FROM LOCAL STORAGE:",
        passengerData
      );

      setPassenger(passengerData);

      loadTrips(passengerData.id);
      loadOnlineDrivers();

      const interval = setInterval(() => {
        loadTrips(passengerData.id);
        loadOnlineDrivers();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    } catch (error) {
      console.error(
        "Could not parse passenger data:",
        error
      );
    }
  }, []);

  /* =======================================================
     UPLOAD PROFILE PHOTO
  ======================================================= */

  const uploadPhoto = async (file: File) => {
    if (!passenger?.id) {
      console.error("Passenger not found.");
      return;
    }

    setUploadingPhoto(true);

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("passengerId", String(passenger.id));

    try {
     const response = await fetch(
  `${API_URL}/passenger/upload-photo`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("UPLOAD SERVER ERROR:", errorText);
        throw new Error(
          `Upload failed (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      console.log("UPLOAD RESPONSE:", data);

      if (!data.success) {
        throw new Error(data.error || "Photo upload failed.");
      }

      // The backend saves the permanent Supabase URL in
      // data.passenger.profile_image.
      const savedImage = data.passenger?.profile_image;

      if (!savedImage) {
        throw new Error(
          "The server did not return the saved photo URL."
        );
      }

      const finalImageUrl = getProfileImageUrl(savedImage);

if (!finalImageUrl) {
  throw new Error("The saved photo URL is invalid.");
}

const updatedPassenger = {
  ...passenger,
  profile_image: finalImageUrl,
};

setPassenger(updatedPassenger);

localStorage.setItem(
  "passenger",
  JSON.stringify(updatedPassenger)
);

// Force the displayed image to reload
setPhotoVersion(Date.now());

setPhoto(null);

console.log("PHOTO UPLOAD COMPLETE:", finalImageUrl);

} catch (error) {
  console.error("PHOTO UPLOAD ERROR:", error);
} finally {
  setUploadingPhoto(false);
}
};

  /* =======================================================
     PROFILE IMAGE URL
  ======================================================= */

const profileImageUrl =
  getProfileImageUrl(passenger?.profile_image);
  /* =======================================================
     PAGE
  ======================================================= */

  return (
  <main
    className={`${outfit.className} min-h-[100dvh] bg-white text-[#111111]`}
  >
    <div className="mx-auto w-full max-w-md px-5 pb-8">

      {/* =================================
          HEADER
      ================================= */}
      <header className="flex items-center justify-between pt-5">

        <h1 className="text-[26px] font-extrabold tracking-[-0.055em]">
          Route<span className="text-[#ff6a00]">X</span>
        </h1>

        <div className="flex items-center gap-3">

          {/* DRIVER AVAILABILITY */}
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                onlineDrivers > 0
                  ? "bg-[#ff6a00]"
                  : "bg-[#cccccc]"
              }`}
            />

            <span className="text-[12px] font-bold text-[#777777]">
              {onlineDrivers} online
            </span>
          </div>

        </div>

      </header>


      {/* =================================
          WELCOME
      ================================= */}
      <section className="pt-7">

        <div className="flex items-center justify-between gap-4">

          <div className="min-w-0">

            <p
              className="
                text-[12px]
                font-extrabold
                uppercase
                tracking-[0.12em]
                text-[#ff6a00]
              "
            >
              Passenger Portal
            </p>

            <h2
              className="
                mt-1
                text-[26px]
                font-extrabold
                leading-tight
                tracking-[-0.04em]
              "
            >
              Hi
              {passenger?.full_name
                ? `, ${passenger.full_name
                    .trim()
                    .split(/\s+/)[0]}`
                : ""}
            </h2>

            <p
              className="
                mt-1
                text-[15px]
                font-medium
                text-[#777777]
              "
            >
              Where are you going today?
            </p>

          </div>


          {/* PROFILE PHOTO */}
          <div className="relative h-[68px] w-[68px] shrink-0">

            <div
              className="
                relative
                h-[68px]
                w-[68px]
                overflow-hidden
                rounded-full
                border
                border-[#e8e8e8]
                bg-[#f7f7f7]
              "
            >

              {photo ? (
                <img
                  src={photoPreviewUrl}
                  alt="Selected profile photo"
                  className="block h-full w-full object-cover"
                />
              ) : profileImageUrl ? (
                <img
                  key={`${passenger?.profile_image}-${photoVersion}`}
                  src={`${profileImageUrl}${
                    profileImageUrl.includes("?") ? "&" : "?"
                  }v=${photoVersion}`}
                  alt={passenger?.full_name || "Passenger"}
                  className="block h-full w-full object-cover"
                />
              ) : null}

              <div
                className={`
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                  text-[16px]
                  font-extrabold
                  text-[#999999]
                  ${
                    photo || profileImageUrl
                      ? "hidden"
                      : ""
                  }
                `}
              >
                {passenger?.full_name
                  ?.charAt(0)
                  ?.toUpperCase() || "P"}
              </div>

            </div>


            {/* CHANGE PHOTO */}
            <label
              className="
                absolute
                -bottom-1
                -right-1
                flex
                h-6
                w-6
                cursor-pointer
                items-center
                justify-center
                rounded-full
                border-2
                border-white
                bg-[#ff6a00]
                text-white
                shadow-sm
              "
              title="Change photo"
            >
              <span className="text-[10px]">
                ✎
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  setPhoto(file);
                  await uploadPhoto(file);
                  e.target.value = "";
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

          </div>

        </div>

      </section>


      {/* =================================
          BOOK RIDE
      ================================= */}
      <a
        href="/bookings"
        className="
          mt-6
          flex
          w-full
          items-center
          justify-between
          rounded-[18px]
          border
          border-[#eeeeee]
          bg-[#fafafa]
          px-4
          py-4
          transition
          active:scale-[0.98]
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#fff1e8]
              text-[#ff6a00]
            "
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </div>

          <div>

            <p className="text-[17px] font-extrabold">
              Book a ride
            </p>

            <p className="mt-0.5 text-[14px] font-medium text-[#888888]">
              Enter your destination
            </p>

          </div>

        </div>


        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-[#111111]
            text-white
          "
        >
          <span className="text-[17px]">→</span>
        </div>

      </a>


      {/* =================================
          AVAILABILITY
      ================================= */}
      <section
        className="
          mt-4
          flex
          items-center
          gap-2
          border-b
          border-[#eeeeee]
          pb-4
        "
      >

        <span
          className={`h-2 w-2 rounded-full ${
            onlineDrivers > 0
              ? "bg-[#ff6a00]"
              : "bg-[#cccccc]"
          }`}
        />

        <p className="text-[13px] font-semibold text-[#666666]">
          {onlineDrivers > 0
            ? `${onlineDrivers} driver${
                onlineDrivers !== 1 ? "s" : ""
              } available now`
            : "No drivers currently online"}
        </p>

      </section>

{/* =================================
    AVAILABLE DRIVERS
================================= */}
{availableDrivers.length > 0 && (
  <section className="mt-7">

    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#ff6a00]">
        Drivers near your pickup
      </p>

      <h2 className="mt-1 text-[20px] font-extrabold tracking-tight">
        Available drivers
      </h2>

      <p className="mt-1 text-[12px] text-[#777777]">
        These drivers are currently online.
      </p>
    </div>

    <div className="space-y-3">
      {availableDrivers.map((driver) => (
        <div
          key={driver.id}
          className="
            flex
            items-center
            gap-4
            rounded-[18px]
            border
            border-[#eeeeee]
            bg-white
            p-4
          "
        >

          {/* DRIVER PHOTO */}
          <div
            className="
              relative
              h-14
              w-14
              shrink-0
              overflow-hidden
              rounded-full
              bg-[#f5f5f5]
            "
          >
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                text-lg
                font-bold
                text-[#aaaaaa]
              "
            >
              {driver.first_name?.charAt(0)?.toUpperCase() || "D"}
            </div>

            {driver.profile_image && (
              <img
                src={
                  driver.profile_image.startsWith("http")
                    ? driver.profile_image
                    : `${API_URL}/uploads/${driver.profile_image}`
                }
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>

          {/* DRIVER DETAILS */}
          <div className="min-w-0 flex-1">

            <div className="flex items-center justify-between gap-3">

              <p className="truncate text-[15px] font-extrabold">
                {driver.first_name}
              </p>

              <span
                className="
                  shrink-0
                  rounded-full
                  bg-[#fff3e8]
                  px-2.5
                  py-1
                  text-[10px]
                  font-bold
                  text-[#ff6a00]
                "
              >
                {driver.distance_km
              ? `${Number(driver.distance_km).toFixed(1)} km away`
              : "Nearby"}
              </span>

            </div>

            <p className="mt-1 text-[12px] font-semibold text-[#555555]">
              {driver.vehicle_color} {driver.vehicle_type}
            </p>

            <p className="mt-0.5 text-[11px] text-[#888888]">
              {driver.license_plate}
            </p>

          </div>

        </div>
      ))}
    </div>

  </section>
)}

      {/* =================================
          RIDES HEADER
      ================================= */}
      <section className="mt-7">

        <div className="flex items-end justify-between">

          <div>

            <p
              className="
                text-[12px]
                font-extrabold
                uppercase
                tracking-[0.12em]
                text-[#ff6a00]
              "
            >
              Your rides
            </p>

            <h2
              className="
                mt-1
                text-[22px]
                font-extrabold
                tracking-[-0.035em]
              "
            >
              Recent bookings
            </h2>

          </div>

          <p className="text-[12px] font-bold text-[#999999]">
            {trips.length} booking
            {trips.length !== 1 ? "s" : ""}
          </p>

        </div>

      </section>


      {/* =================================
          TRIPS
      ================================= */}
      <section className="mt-4 space-y-3">

        {trips.length === 0 ? (

          /* NO TRIPS */
          <div
            className="
              rounded-[20px]
              border
              border-[#eeeeee]
              bg-[#fafafa]
              px-5
              py-7
              text-center
            "
          >

            <div
              className="
                mx-auto
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-[#fff1e8]
                text-[#ff6a00]
              "
            >
              <Car
                size={20}
                strokeWidth={2.2}
              />
            </div>

            <p className="mt-3 text-[16px] font-extrabold">
              No rides booked yet
            </p>

            <p className="mt-1 text-[14px] font-medium text-[#888888]">
              Your RouteX trips will appear here.
            </p>

          </div>

        ) : (

          trips.map((trip) => (

            <div
              key={trip.id}
              className="
                rounded-[20px]
                border
                border-[#e8e8e8]
                bg-white
                p-4
              "
            >

              {/* TOP */}
              <div className="flex items-start justify-between gap-3">

                <div>

                  <p
                    className="
                      text-[13px]
                      font-bold
                      uppercase
                      tracking-[0.1em]
                      text-[#999999]
                    "
                  >
                    Booking
                  </p>

                  <h3 className="mt-1 text-[16px] font-extrabold">
                    BK-
                    {trip.id
                      .toString()
                      .padStart(4, "0")}
                  </h3>

                </div>


                {/* STATUS */}
                <span
                  className={`
                    shrink-0
                    rounded-full
                    px-2.5
                    py-1
                    text-[11px]
                    font-extrabold
                    ${
                      trip.trip_status === "In Progress"
                        ? "bg-[#111111] text-white"
                        : trip.trip_status === "Accepted"
                        ? "bg-[#fff1e8] text-[#e65f00]"
                        : "bg-[#f2f2f2] text-[#555555]"
                    }
                  `}
                >
                  {trip.trip_status}
                </span>

              </div>


              {/* ROUTE */}
              <div className="mt-5 flex gap-3">

                {/* ROUTE LINE */}
                <div className="flex w-3 shrink-0 flex-col items-center">

                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#111111]" />

                  <div
                    className="
                      my-1
                      h-9
                      border-l
                      border-dashed
                      border-[#cccccc]
                    "
                  />

                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />

                </div>


                {/* ADDRESSES */}
                <div className="min-w-0 flex-1">

                  <div>
                    <p
                      className="
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-[#aaaaaa]
                      "
                    >
                      Pickup
                    </p>

                    <p
                      className="
                        mt-1
                        line-clamp-1
                        text-[14px]
                        font-semibold
                        text-[#333333]
                      "
                    >
                      {trip.pickup_address}
                    </p>
                  </div>


                  <div className="mt-4">

                    <p
                      className="
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-[#aaaaaa]
                      "
                    >
                      Destination
                    </p>

                    <p
                      className="
                        mt-1
                        line-clamp-1
                        text-[14px]
                        font-semibold
                        text-[#333333]
                      "
                    >
                      {trip.dropoff_address}
                    </p>

                  </div>

                </div>

              </div>


              {/* TRIP SUMMARY */}
              <div
                className="
                  mt-5
                  grid
                  grid-cols-3
                  gap-3
                  border-t
                  border-[#eeeeee]
                  pt-4
                "
              >

                {/* FARE */}
                <div>

                  <p className="text-[11px] font-bold uppercase text-[#aaaaaa]">
                    Fare
                  </p>

                  <p className="mt-1 text-[14px] font-extrabold">
                    R
                    {Number(
                      trip.passenger_amount ??
                        trip.fare_amount ??
                        0
                    ).toFixed(2)}
                  </p>

                </div>


                {/* DATE */}
                <div>

                  <p className="text-[11px] font-bold uppercase text-[#aaaaaa]">
                    Date
                  </p>

                  <p className="mt-1 text-[13px] font-bold">
                    {new Date(
                      trip.travel_date
                    ).toLocaleDateString()}
                  </p>

                </div>


  {/* DRIVER */}
<div className="col-span-full mt-3">

  <p className="text-[10px] font-bold uppercase text-[#aaaaaa]">
    Driver
  </p>

  <div className="mt-2 flex items-center gap-3">

    {/* DRIVER PHOTO */}
    <div
      className="
        relative
        h-10
        w-10
        shrink-0
        overflow-hidden
        rounded-full
        bg-[#f5f5f5]
      "
    >
      {/* FALLBACK */}
      <div
        className="
          absolute
          inset-0
          flex
          items-center
          justify-center
          text-[13px]
          font-bold
          text-[#aaaaaa]
        "
      >
        {trip.driver_name?.charAt(0)?.toUpperCase() || "D"}
      </div>

      {/* PHOTO */}
      {trip.driver_profile_image && (
        <img
          src={
            trip.driver_profile_image.startsWith("http")
              ? trip.driver_profile_image
              : `${API_URL}/uploads/${trip.driver_profile_image}`
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>

    {/* NAME + RATING */}
    <div className="min-w-0 flex-1">

      <p className="text-[14px] font-extrabold leading-tight text-[#111111]">
        {trip.driver_name || "Driver"}
      </p>

      {trip.average_rating && (
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5">

          <span className="text-[14px] leading-none text-[#ff6a00]">
            ★
          </span>

          <span className="text-[12px] font-extrabold text-[#333333]">
            {Number(trip.average_rating).toFixed(1)}
          </span>

          <span className="text-[11px] text-[#999999]">
            {trip.review_count}{" "}
            {Number(trip.review_count) === 1
              ? "review"
              : "reviews"}
          </span>

        </div>
      )}

    </div>

  </div>

</div>
              </div>


              {/* DRIVER / VEHICLE DETAILS */}
              {(trip.driver_name ||
                trip.vehicle_type ||
                trip.license_plate) && (

                <div
                  className="
                    mt-4
                    rounded-[14px]
                    bg-[#fafafa]
                    px-3
                    py-3
                  "
                >

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#fff1e8]
                        text-[#ff6a00]
                      "
                    >
                      <Car
                        size={16}
                        strokeWidth={2.2}
                      />
                    </div>


                    <div className="min-w-0 flex-1">

                      <p className="text-[13px] font-extrabold">
                        {trip.vehicle_type ||
                          "Vehicle not assigned"}
                      </p>

                      <p className="mt-0.5 text-[12px] font-medium text-[#888888]">
                        {trip.vehicle_color || ""}
                        {trip.vehicle_color &&
                        trip.license_plate
                          ? " • "
                          : ""}
                        {trip.license_plate || ""}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================
    RATE YOUR DRIVER
================================= */}
{String(trip.trip_status).trim().toLowerCase() === "completed" &&
  !trip.has_reviewed &&
  !reviewedTrips[trip.id] && (
  <div className="mt-5 rounded-[18px] border border-[#ffe0cc] bg-[#fffaf6] p-4">

    <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff6a00]">
      Rate your driver
    </p>

    <h4 className="mt-1 text-[16px] font-extrabold text-[#111111]">
      How was your trip with {trip.driver_name || "your driver"}?
    </h4>

   
        {/* STARS */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() =>
                setReviewRatings((prev) => ({
                  ...prev,
                  [trip.id]: star,
                }))
              }
              className={`text-[32px] leading-none transition active:scale-90 ${
                (reviewRatings[trip.id] || 0) >= star
                  ? "text-[#ff6a00]"
                  : "text-[#d4d4d4]"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {/* REVIEW TEXT */}
        <textarea
          value={reviewTexts[trip.id] || ""}
          onChange={(e) =>
            setReviewTexts((prev) => ({
              ...prev,
              [trip.id]: e.target.value,
            }))
          }
          placeholder="Tell us about your trip (optional)"
          rows={3}
          className="
            mt-4
            w-full
            resize-none
            rounded-xl
            border
            border-[#e5e5e5]
            bg-white
            px-3
            py-3
            text-[14px]
            text-[#111111]
            outline-none
            transition
            focus:border-[#ff6a00]
          "
        />

        {/* SUBMIT */}
        <button
          type="button"
          disabled={
            submittingReview === trip.id ||
            !reviewRatings[trip.id]
          }
          onClick={() => submitDriverReview(trip)}
          className="
            mt-3
            w-full
            rounded-xl
            bg-[#ff6a00]
            px-4
            py-3
            text-[14px]
            font-extrabold
            text-white
            transition
            hover:bg-[#e65f00]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {submittingReview === trip.id
            ? "Submitting..."
            : "Submit Review"}
        </button>
    
  </div>
)}
              {/* WHATSAPP DRIVER */}
              {trip.driver_phone && (

                <a
                  href={`https://wa.me/27${String(
                    trip.driver_phone
                  )
                    .replace(/\D/g, "")
                    .replace(/^0/, "")}?text=${encodeURIComponent(
                    `Hi, this is your RouteX passenger for booking BK-${trip.id
                      .toString()
                      .padStart(4, "0")}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    mt-3
                    flex
                    w-full
                    items-center
                    justify-center
                    rounded-[12px]
                    border
                    border-[#e6e6e6]
                    bg-white
                    py-2.5
                    text-[13px]
                    font-extrabold
                    text-[#333333]
                    transition
                    active:scale-[0.98]
                  "
                >
                  WhatsApp Driver
                </a>

              )}
{/* CANCEL BOOKING */}
{trip.trip_status === "Waiting" && (
  <button
    type="button"
    onClick={() => cancelBooking(trip.id)}
    className="
      mt-3
      flex
      w-full
      items-center
      justify-center
      rounded-[12px]
      border
      border-[#ff6a00]
      bg-white
      py-2.5
      text-[13px]
      font-extrabold
      text-[#ff6a00]
      transition
      active:scale-[0.98]
    "
  >
    Cancel Booking
  </button>
)}
            </div>

          ))

        )}

      </section>


      {/* =================================
          FOOTER
      ================================= */}
      <footer
        className="
          mt-8
          border-t
          border-[#eeeeee]
          pt-4
          text-center
        "
      >
        <p className="text-[11px] font-medium text-[#aaaaaa]">
          RouteX • Getting Upington Moving
        </p>
      </footer>

    </div>
  </main>
);
}