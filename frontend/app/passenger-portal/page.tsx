"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Car,
  CalendarDays,
  UserRound,
  Palette,
  CreditCard,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL = "https://routex-1-z1hf.onrender.com";
const PHOTO_API_URL = "https://routex-1-z1hf.onrender.com";


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
  return `${PHOTO_API_URL}${
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

  const [photo, setPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);

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
        `${API_BASE_URL}/passenger-bookings/${passengerId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load trips: ${response.status}`
        );
      }

      const data = await response.json();

      setTrips(Array.isArray(data) ? data : []);

      console.log("TRIPS:", data);
    } catch (error) {
      console.error("Error loading trips:", error);
    }
  };

  /* =======================================================
     LOAD ONLINE DRIVERS
  ======================================================= */

  const loadOnlineDrivers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/online-drivers`
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
        `${PHOTO_API_URL}/passenger/upload-photo`,
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
    className={`${jakarta.variable} min-h-[100dvh] bg-white text-[#111111]`}
    style={{
      fontFamily: "var(--font-jakarta)",
    }}
  >
    <div className="mx-auto w-full max-w-md px-5 pb-8">

      {/* =================================
          HEADER
      ================================= */}
      <header className="flex items-center justify-between pt-5">

        <h1 className="text-[24px] font-extrabold tracking-[-0.055em]">
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

            <span className="text-[10px] font-bold text-[#777777]">
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
                text-[10px]
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
                text-[24px]
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
                text-[12px]
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

            <p className="text-[15px] font-extrabold">
              Book a ride
            </p>

            <p className="mt-0.5 text-[11px] font-medium text-[#888888]">
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

        <p className="text-[11px] font-semibold text-[#666666]">
          {onlineDrivers > 0
            ? `${onlineDrivers} driver${
                onlineDrivers !== 1 ? "s" : ""
              } available now`
            : "No drivers currently online"}
        </p>

      </section>


      {/* =================================
          RIDES HEADER
      ================================= */}
      <section className="mt-7">

        <div className="flex items-end justify-between">

          <div>

            <p
              className="
                text-[10px]
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
                text-[20px]
                font-extrabold
                tracking-[-0.035em]
              "
            >
              Recent bookings
            </h2>

          </div>

          <p className="text-[10px] font-bold text-[#999999]">
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

            <p className="mt-3 text-[14px] font-extrabold">
              No rides booked yet
            </p>

            <p className="mt-1 text-[11px] font-medium text-[#888888]">
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
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.1em]
                      text-[#999999]
                    "
                  >
                    Booking
                  </p>

                  <h3 className="mt-1 text-[14px] font-extrabold">
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
                    text-[9px]
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
                        text-[9px]
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
                        text-[12px]
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
                        text-[9px]
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
                        text-[12px]
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

                  <p className="text-[9px] font-bold uppercase text-[#aaaaaa]">
                    Fare
                  </p>

                  <p className="mt-1 text-[12px] font-extrabold">
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

                  <p className="text-[9px] font-bold uppercase text-[#aaaaaa]">
                    Date
                  </p>

                  <p className="mt-1 text-[11px] font-bold">
                    {new Date(
                      trip.travel_date
                    ).toLocaleDateString()}
                  </p>

                </div>


                {/* DRIVER */}
                <div>

                  <p className="text-[9px] font-bold uppercase text-[#aaaaaa]">
                    Driver
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-[11px]
                      font-bold
                    "
                  >
                    {trip.driver_name ||
                      "Not assigned"}
                  </p>

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

                      <p className="text-[10px] font-extrabold">
                        {trip.vehicle_type ||
                          "Vehicle not assigned"}
                      </p>

                      <p className="mt-0.5 text-[9px] font-medium text-[#888888]">
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
                    text-[10px]
                    font-extrabold
                    text-[#333333]
                    transition
                    active:scale-[0.98]
                  "
                >
                  WhatsApp Driver
                </a>

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
        <p className="text-[9px] font-medium text-[#aaaaaa]">
          RouteX • Getting Upington Moving
        </p>
      </footer>

    </div>
  </main>
);
}