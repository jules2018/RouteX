"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";


const DriverMap = dynamic(
  () => import("./DriverMap"),
  {
    ssr: false,
  }
);
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

  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [showCompletedTrips, setShowCompletedTrips] = useState(false);
  const [showLiveTrip, setShowLiveTrip] = useState(false);

  const router = useRouter();
 

  type ScheduledRide = {
    id: number;
    pickup_address: string;
    dropoff_address: string;
    fare_amount: number | string;
    scheduled_pickup_at: string;
    matching_opens_at?: string | null;
    booking_status: string;
    trip_status?: string;
    driver_name?: string | null;
    driver_phone?: string | null;
    driver_profile_image?: string | null;
    vehicle_type?: string | null;
    vehicle_color?: string | null;
    license_plate?: string | null;

    confirmed_pickup_lat?: number | string | null;
    confirmed_pickup_lng?: number | string | null;
    pickup_location_confirmed_at?: string | null;
  };

  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [cancellingRideId, setCancellingRideId] = useState<number | null>(null);

  const loadScheduledRides = async (passengerId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/passenger-scheduled-bookings/${passengerId}`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load scheduled rides.");
      }
      setScheduledRides(Array.isArray(data) ? data : data.bookings || []);
    } catch (error) {
      console.error("SCHEDULED RIDES ERROR:", error);
    } finally {
      setScheduledLoading(false);
    }
  };

  const cancelScheduledRide = async (rideId: number) => {
    if (!window.confirm("Cancel this scheduled RouteX ride?")) return;
    try {
      setCancellingRideId(rideId);
      const response = await fetch(
        `${API_URL}/scheduled-bookings/${rideId}/cancel`,
        { method: "PATCH" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not cancel this ride.");
      }
      setScheduledRides((current) =>
        current.filter((ride) => ride.id !== rideId)
      );
    } catch (error: any) {
      console.error("CANCEL SCHEDULED RIDE ERROR:", error);
      window.alert(error?.message || "Could not cancel this ride.");
    } finally {
      setCancellingRideId(null);
    }
  };



  const confirmScheduledPickupLocation = async (rideId: number) => {
  if (!navigator.geolocation) {
    window.alert("Location services are not supported on this device.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const response = await fetch(
          `${API_URL}/bookings/${rideId}/confirm-pickup-location`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat,
              lng,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Could not confirm your pickup location."
          );
        }

        console.log("SCHEDULED PICKUP GPS CONFIRMED:", data);

        window.alert(
          "Pickup location confirmed. Your driver will use this location for navigation."
        );

        if (passenger?.id) {
          await loadScheduledRides(passenger.id);
        }
      } catch (error: any) {
        console.error(
          "SCHEDULED PICKUP LOCATION ERROR:",
          error
        );

        window.alert(
          error?.message || "Could not confirm your pickup location."
        );
      }
    },

    (error) => {
      console.error("GPS ERROR:", error);

      if (error.code === error.PERMISSION_DENIED) {
        window.alert(
          "Location permission was denied. Please allow location access and try again."
        );
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        window.alert(
          "Your current location could not be determined. Please try again."
        );
      } else if (error.code === error.TIMEOUT) {
        window.alert(
          "Getting your location took too long. Please try again."
        );
      } else {
        window.alert(
          "Could not get your current location."
        );
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
};
  const bookingResult =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("booking")
    : null;
  const [showBookingSuccess, setShowBookingSuccess] = useState(
    bookingResult === "scheduled" || bookingResult === "requested"
  );
  const bookingWasScheduled = bookingResult === "scheduled";

  const closeBookingSuccess = () => {
    setShowBookingSuccess(false);
    router.replace("/passenger-portal");
  };
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
const loadDriverLocation = async (
  passengerId: number,
  bookingId: number
) => {
  try {
    const response = await fetch(
      `${API_URL}/passenger-bookings/${passengerId}/${bookingId}/driver-location`
    );

    if (!response.ok) {
      setDriverLocation(null);
      return;
    }

    const data = await response.json();

    console.log("DRIVER LOCATION:", data);

    setDriverLocation(data);

  } catch (error) {
    console.error(
      "Error loading driver location:",
      error
    );

    setDriverLocation(null);
  }
};


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
      const activeTrip = Array.isArray(data)
  ? data.find(
      (trip: any) =>
        trip.assigned_driver_id &&
        (
          trip.trip_status === "Accepted" ||
          trip.trip_status === "In Progress"
        )
    )
  : null;

if (activeTrip) {
  loadDriverLocation(
    Number(passengerId),
    Number(activeTrip.id)
  );
} else {
  setDriverLocation(null);
}
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
      loadScheduledRides(passengerData.id);
      loadOnlineDrivers();

      const interval = setInterval(() => {
        loadTrips(passengerData.id);
        loadScheduledRides(passengerData.id);
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

  const normalizedStatus = (trip: any) =>
    String(trip?.trip_status || trip?.booking_status || "")
      .trim()
      .toLowerCase();

  const activeTrip =
    trips.find((trip) =>
      ["accepted", "in progress"].includes(normalizedStatus(trip))
    ) || null;

  const waitingTrips = trips.filter(
    (trip) => normalizedStatus(trip) === "waiting"
  );

  const completedTrips = trips.filter(
    (trip) => normalizedStatus(trip) === "completed"
  );
const upcomingScheduledRides = scheduledRides.filter((ride) => {
  const status = String(
    ride.trip_status || ride.booking_status || ""
  )
    .trim()
    .toLowerCase();

  return [
    "scheduled",
    "waiting",
    "accepted",
    "in progress",
  ].includes(status);
});
  const otherTrips = trips.filter((trip) => {
    const status = normalizedStatus(trip);
    return (
      status &&
      !["scheduled", "waiting", "accepted", "in progress", "completed", "cancelled"].includes(status)
    );
  });

  const firstName =
    passenger?.full_name?.trim()?.split(/\s+/)?.[0] || "Passenger";
  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-[100dvh] bg-[#e7e9ee] text-[#17191f]">
      {showBookingSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-5 backdrop-blur-[3px]">
          <div className="w-full max-w-[350px] rounded-[28px] bg-[#e7e9ee] p-6 text-[#17191f] shadow-[10px_10px_30px_rgba(0,0,0,0.25),-6px_-6px_18px_rgba(255,255,255,0.8)]">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6846] text-white">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>
            </div>
            <div className="mt-5 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ff6846]">RouteX</p>
              <h2 className="mt-2 text-[24px] font-black tracking-[-0.045em]">
                {bookingWasScheduled ? "Ride scheduled" : "Ride requested"}
              </h2>
              <p className="mx-auto mt-2 max-w-[260px] text-[11px] font-semibold leading-5 text-[#85888f]">
                {bookingWasScheduled
                  ? "Your ride is booked. RouteX will start matching you with a driver closer to your pickup time."
                  : "Your request has been sent. Nearby RouteX drivers can now accept your ride."}
              </p>
            </div>
            {bookingWasScheduled && (
              <div className="mt-5 rounded-[18px] bg-[#e7e9ee] px-4 py-3 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#17191f] text-[#ff6846]">
                    <ClockIcon />
                  </div>
                  <div>
                    <p className="text-[10px] font-black">Scheduled</p>
                    <p className="mt-0.5 text-[8px] font-semibold text-[#8d9097]">
                      Driver matching opens closer to pickup time.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={closeBookingSuccess}
              className="mt-6 flex w-full items-center justify-center rounded-[16px] bg-[#17191f] px-5 py-4 text-[12px] font-black text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-md px-5 pb-10">

        <header className="flex items-center justify-between pt-6">
          <h1 className="text-[27px] font-black tracking-[-0.06em]">
            Route<span className="text-[#ff6846]">X</span>
          </h1>

          <div className="flex items-center gap-2 rounded-full bg-[#e7e9ee] px-3 py-2 shadow-[3px_3px_7px_#c5c7cc,-3px_-3px_7px_#ffffff]">
            <span className={`relative inline-flex h-2 w-2 rounded-full ${onlineDrivers > 0 ? "bg-[#ff6846]" : "bg-[#aeb1b7]"}`} />
            <span className="text-[10px] font-extrabold text-[#777a81]">
              {onlineDrivers} online
            </span>
          </div>
        </header>

        <section className="pt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ff6846]">
                Passenger Portal
              </p>
              <h2 className="mt-2 text-[29px] font-black leading-none tracking-[-0.045em]">
                Hi, {firstName}
              </h2>
              <p className="mt-2 text-[14px] font-medium text-[#7c7f86]">
                Where are you going today?
              </p>
            </div>

            <div className="relative shrink-0">
              <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-[30px] bg-[#e7e9ee] shadow-[8px_8px_18px_#c1c3c8,-8px_-8px_18px_#ffffff]">
                <div className="absolute -right-[3px] top-[18px] h-9 w-[5px] rounded-full bg-[#ff6846] shadow-[0_2px_5px_rgba(255,104,70,0.35)]" />
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#e7e9ee] p-[5px] shadow-[inset_5px_5px_10px_#c2c4c9,inset_-5px_-5px_10px_#ffffff]">
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-[#dfe1e6] shadow-[2px_2px_5px_rgba(80,82,88,0.16)]">
                    {photo ? (
                      <img src={photoPreviewUrl} alt="Selected profile" className="h-full w-full object-cover" />
                    ) : profileImageUrl ? (
                      <img
                        key={`${passenger?.profile_image}-${photoVersion}`}
                        src={`${profileImageUrl}${profileImageUrl.includes("?") ? "&" : "?"}v=${photoVersion}`}
                        alt={passenger?.full_name || "Passenger"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-[22px] font-black text-[#a0a3aa]">
                          {firstName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <label
                title="Change profile photo"
                className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-[13px] bg-[#ff6846] text-white shadow-[4px_4px_8px_#bfc1c6,-3px_-3px_7px_#ffffff] transition hover:scale-105 active:scale-90"
              >
                <CameraIcon />
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingPhoto}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhoto(file);
                    await uploadPhoto(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <a
            href="/bookings"
            className="group flex w-full items-center justify-between rounded-[21px] bg-[#e7e9ee] px-4 py-4 text-left shadow-[6px_6px_13px_#c3c5ca,-6px_-6px_13px_#ffffff] transition active:scale-[0.985]"
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#ff6846] text-white shadow-[3px_3px_7px_#c2c4c9,-3px_-3px_7px_#ffffff]">
                <LocationIcon />
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-black tracking-[-0.02em]">Book a ride</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#85888f]">
                  Enter your pickup and destination
                </p>
              </div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17191f] text-white">
              <ArrowRightIcon />
            </div>
          </a>

          <div className="mt-3 flex items-center gap-2 px-1">
            <span className={`h-2 w-2 rounded-full ${onlineDrivers > 0 ? "bg-[#ff6846]" : "bg-[#aeb1b7]"}`} />
            <span className="text-[10px] font-bold text-[#85888f]">
              {onlineDrivers > 0
                ? `${onlineDrivers} driver${onlineDrivers === 1 ? "" : "s"} available now`
                : "No drivers currently online"}
            </span>
          </div>
        </section>

        {waitingTrips.length > 0 && (
          <section className="mt-8">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#ff6846]">
              Looking for a driver
            </p>
            <h3 className="mt-1 text-[20px] font-black tracking-[-0.035em]">
              Your ride is waiting
            </h3>

            {waitingTrips.map((trip) => (
              <div key={trip.id} className="mt-4 rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#777a81]">
                    BK-{String(trip.id).padStart(4, "0")}
                  </span>
                  <span className="rounded-full bg-[#fff0eb] px-3 py-1.5 text-[9px] font-extrabold text-[#ff6846]">
                    Waiting
                  </span>
                </div>

                <div className="mt-4 rounded-[17px] bg-[#e7e9ee] px-4 py-3.5 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                  <RoutePoint type="pickup" label="Pickup" value={trip.pickup_address || "Pickup"} />
                  <div className="ml-[5px] h-4 border-l border-dashed border-[#b5b8be]" />
                  <RoutePoint type="destination" label="Destination" value={trip.dropoff_address || "Destination"} />
                </div>

                {availableDrivers.length > 0 && (
                  <p className="mt-3 text-[10px] font-bold text-[#85888f]">
                    {availableDrivers.length} nearby driver{availableDrivers.length === 1 ? "" : "s"} found
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => cancelBooking(trip.id)}
                  className="mt-4 w-full rounded-[14px] bg-[#e7e9ee] py-3 text-[10px] font-extrabold text-[#ff6846] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff]"
                >
                  Cancel booking
                </button>
              </div>
            ))}
          </section>
        )}

        {activeTrip && (
          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#ff6846]">
                  Active ride
                </p>
                <h3 className="mt-1 text-[20px] font-black tracking-[-0.035em]">
                  {normalizedStatus(activeTrip) === "in progress"
                    ? "Your trip is in progress"
                    : "Your driver is coming"}
                </h3>
              </div>
              <span className="rounded-full bg-[#17191f] px-3 py-1.5 text-[9px] font-extrabold text-white">
                {activeTrip.trip_status}
              </span>
            </div>

            <div className="mt-4 rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff]">
              <div className="flex items-center gap-3">
                <div className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9ee] p-[4px] shadow-[inset_3px_3px_7px_#c3c5ca,inset_-3px_-3px_7px_#ffffff]">
                  <div className="absolute inset-[4px] flex items-center justify-center rounded-full bg-[#dfe1e6]">
                    <span className="text-[13px] font-black text-[#ff6846]">
                      {activeTrip.driver_name?.charAt(0)?.toUpperCase() || "D"}
                    </span>
                  </div>
                  {activeTrip.driver_profile_image && (
                    <img
                      src={activeTrip.driver_profile_image.startsWith("http")
                        ? activeTrip.driver_profile_image
                        : `${API_URL}/uploads/${activeTrip.driver_profile_image}`}
                      alt=""
                      className="absolute inset-[4px] h-[40px] w-[40px] rounded-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black">{activeTrip.driver_name || "Your driver"}</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-[#777a81]">
                    {[activeTrip.vehicle_color, activeTrip.vehicle_type].filter(Boolean).join(" ") || "Vehicle assigned"}
                  </p>
                  <p className="mt-0.5 text-[9px] font-bold text-[#a0a3a9]">
                    {activeTrip.license_plate || ""}
                  </p>
                </div>

                {activeTrip.average_rating && (
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[12px] text-[#ff6846]">★</span>
                      <span className="text-[12px] font-black">
                        {Number(activeTrip.average_rating).toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-[#a0a3a9]">
                      Driver
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-[17px] bg-[#e7e9ee] px-4 py-3.5 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                <RoutePoint type="pickup" label="Pickup" value={activeTrip.pickup_address || "Pickup"} />
                <div className="ml-[5px] h-4 border-l border-dashed border-[#b5b8be]" />
                <RoutePoint type="destination" label="Destination" value={activeTrip.dropoff_address || "Destination"} />
              </div>

              <div className={`mt-4 grid ${activeTrip.driver_phone ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                {driverLocation &&
                  driverLocation.driver_lat &&
                  driverLocation.driver_lng &&
                  driverLocation.pickup_lat &&
                  driverLocation.pickup_lng && (
                    <button
                      type="button"
                      onClick={() => setShowLiveTrip((value) => !value)}
                      className="rounded-[14px] bg-[#17191f] py-3 text-[10px] font-extrabold text-white"
                    >
                      {showLiveTrip ? "Hide live trip" : "View live trip"}
                    </button>
                  )}

                {activeTrip.driver_phone && (
                  <a
                    href={`https://wa.me/27${String(activeTrip.driver_phone)
                      .replace(/\D/g, "")
                      .replace(/^0/, "")}?text=${encodeURIComponent(
                        `Hi, this is your RouteX passenger for booking BK-${String(activeTrip.id).padStart(4, "0")}.`
                      )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-[14px] bg-[#e7e9ee] py-3 text-[10px] font-extrabold text-[#ff6846] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff]"
                  >
                    Contact driver
                  </a>
                )}
              </div>

              {showLiveTrip &&
                driverLocation &&
                driverLocation.driver_lat &&
                driverLocation.driver_lng &&
                driverLocation.pickup_lat &&
                driverLocation.pickup_lng && (
                  <div className="mt-4 overflow-hidden rounded-[18px]">
                    <DriverMap
                      driverLat={Number(driverLocation.driver_lat)}
                      driverLng={Number(driverLocation.driver_lng)}
                      pickupLat={Number(driverLocation.pickup_lat)}
                      pickupLng={Number(driverLocation.pickup_lng)}
                      driverName={driverLocation.driver_name}
                    />
                  </div>
                )}
            </div>
          </section>
        )}

        {/* =====================================================
            SCHEDULED RIDE LIFECYCLE
        ===================================================== */}
        <section className="mt-8">
          {(() => {
         const liveScheduled = upcomingScheduledRides;

            return (
              <>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#ff6846]">
                      {liveScheduled.some((ride) =>
                        ["accepted", "in progress"].includes(
                          String(ride.trip_status || ride.booking_status || "").trim().toLowerCase()
                        )
                      )
                        ? "Active"
                        : "Upcoming"}
                    </p>
                    <h3 className="mt-1 text-[20px] font-black tracking-[-0.035em]">
                      {liveScheduled.some(
                        (ride) =>
                          String(ride.trip_status || ride.booking_status || "")
                            .trim()
                            .toLowerCase() === "in progress"
                      )
                        ? "Trip in progress"
                        : liveScheduled.some(
                            (ride) =>
                              String(ride.trip_status || ride.booking_status || "")
                                .trim()
                                .toLowerCase() === "accepted"
                          )
                        ? "Driver assigned"
                        : "Scheduled rides"}
                    </h3>
                  </div>

                  {liveScheduled.length > 0 && (
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#17191f] px-2 text-[9px] font-black text-white">
                      {liveScheduled.length}
                    </span>
                  )}
                </div>

                {scheduledLoading ? (
                  <div className="mt-4 rounded-[21px] bg-[#e7e9ee] px-4 py-5 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                    <p className="text-[10px] font-bold text-[#8d9097]">Loading ride...</p>
                  </div>
                ) : liveScheduled.length === 0 ? (
                  <div className="mt-4 rounded-[21px] bg-[#e7e9ee] px-4 py-5 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#17191f] text-[#ff6846]">
                        <ClockIcon />
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold">No active scheduled ride</p>
                        <p className="mt-0.5 text-[9px] font-medium text-[#92959b]">
                          Future bookings will appear here.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {liveScheduled.map((ride) => {
                      const state = String(
                        ride.trip_status || ride.booking_status || "Scheduled"
                      )
                        .trim()
                        .toLowerCase();

                      const isScheduled = state === "scheduled";
                      const isWaiting = state === "waiting";
                      const isAccepted = state === "accepted";
                      const isInProgress = state === "in progress";

                      const pickupDate = new Date(ride.scheduled_pickup_at);
                      const matchingDate = ride.matching_opens_at
                        ? new Date(ride.matching_opens_at)
                        : null;

                      const dateText = pickupDate.toLocaleDateString("en-ZA", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      });

                      const timeText = pickupDate.toLocaleTimeString("en-ZA", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });

                      const matchingText = matchingDate
                        ? matchingDate.toLocaleTimeString("en-ZA", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : null;

                      const statusLabel = isInProgress
                        ? "In Progress"
                        : isAccepted
                        ? "Driver assigned"
                        : isWaiting
                        ? "Finding driver"
                        : "Scheduled";

                      return (
                        <div
                          key={ride.id}
                          className="rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#ff6846] text-white shadow-[3px_3px_7px_#c2c4c9,-3px_-3px_7px_#ffffff]">
                                <ClockIcon />
                              </div>
                              <div>
                                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#96999f]">
                                  Pickup time
                                </p>
                                <p className="mt-1 text-[14px] font-black">
                                  {dateText} · {timeText}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1.5 text-[8px] font-extrabold text-white ${
                                isInProgress ? "bg-[#ff6846]" : "bg-[#17191f]"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-4 rounded-[17px] bg-[#e7e9ee] px-4 py-3.5 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                            <RoutePoint type="pickup" label="Pickup" value={ride.pickup_address} />
                            <div className="ml-[5px] h-4 border-l border-dashed border-[#b5b8be]" />
                            <RoutePoint
                              type="destination"
                              label="Destination"
                              value={ride.dropoff_address}
                            />
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#9a9da3]">
                                Fare
                              </p>
                              <p className="mt-0.5 text-[16px] font-black">
                                R{Number(ride.fare_amount || 0).toFixed(0)}
                              </p>
                            </div>

                            {(isScheduled || isWaiting) && (
                              <div className="max-w-[190px] text-right">
                                <p className="text-[9px] font-bold text-[#85888f]">
                                  {isWaiting
                                    ? "RouteX is finding your driver."
                                    : matchingText
                                    ? `Driver matching opens at ${matchingText}`
                                    : "Driver matching opens closer to pickup time."}
                                </p>
                              </div>
                            )}

                            {isInProgress && (
                              <p className="max-w-[190px] text-right text-[9px] font-bold text-[#ff6846]">
                                Your trip is underway.
                              </p>
                            )}
                          </div>

                          {(isAccepted || isInProgress) && ride.driver_name && (
                            <div className="mt-4 flex items-center gap-3 rounded-[17px] bg-[#17191f] p-3 text-white">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2a2d34]">
                                {ride.driver_profile_image ? (
                                  <img
                                    src={ride.driver_profile_image}
                                    alt={ride.driver_name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[15px] font-black text-[#ff6846]">
                                    {ride.driver_name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#ff6846]">
    {isInProgress ? "Your driver" : "Driver assigned"}
  </p>

  <p className="mt-0.5 truncate text-[12px] font-black">
    {ride.driver_name}
  </p>

  <p className="mt-0.5 truncate text-[9px] font-semibold text-white/65">
    {[ride.vehicle_color, ride.vehicle_type, ride.license_plate]
      .filter(Boolean)
      .join(" · ")}
  </p>

  {ride.driver_phone && (
    <a
      href={`tel:${ride.driver_phone}`}
      className="mt-2 inline-flex rounded-[10px] bg-[#ff6846] px-3 py-2 text-[9px] font-extrabold text-white"
    >
      Call driver
    </a>
  )}
</div>
                            </div>
                          )}
{isAccepted && !ride.pickup_location_confirmed_at && (
  <div className="mt-4 rounded-[17px] bg-[#e7e9ee] p-4 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
    <p className="text-[10px] font-extrabold text-[#17191f]">
      Confirm your pickup location
    </p>

    <p className="mt-1 text-[9px] font-medium leading-relaxed text-[#85888f]">
      When you are at your pickup point, confirm your location so your
      driver can navigate directly to you.
    </p>

    <button
      type="button"
      onClick={() => confirmScheduledPickupLocation(ride.id)}
      className="mt-3 w-full rounded-[14px] bg-[#ff6846] py-3 text-[10px] font-extrabold text-white transition active:scale-[0.98]"
    >
      Confirm pickup location
    </button>
  </div>
)}

{isAccepted && ride.pickup_location_confirmed_at && (
  <div className="mt-4 rounded-[17px] bg-[#e7e9ee] p-4 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
    <p className="text-[10px] font-extrabold text-[#17191f]">
      Pickup location confirmed
    </p>

    <p className="mt-1 text-[9px] font-medium text-[#85888f]">
      Your driver will use your confirmed location for navigation.
    </p>
  </div>
)}
                          {(isScheduled || isWaiting) && (
                            <button
                              type="button"
                              disabled={cancellingRideId === ride.id}
                              onClick={() => cancelScheduledRide(ride.id)}
                              className="mt-4 w-full rounded-[14px] bg-[#e7e9ee] py-3 text-[10px] font-extrabold text-[#ff6846] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] transition active:scale-[0.98] disabled:opacity-50"
                            >
                              {cancellingRideId === ride.id
                                ? "Cancelling..."
                                : "Cancel scheduled ride"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </section>


        {otherTrips.length > 0 && (
          <section className="mt-8">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8f9298]">
              Other rides
            </p>
            <div className="mt-3 space-y-3">
              {otherTrips.map((trip) => (
                <div key={trip.id} className="rounded-[18px] bg-[#e7e9ee] px-4 py-4 shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#96999f]">
                      BK-{String(trip.id).padStart(4, "0")}
                    </span>
                    <span className="text-[9px] font-extrabold text-[#777a81]">{trip.trip_status}</span>
                  </div>
                  <p className="mt-3 truncate text-[10px] font-bold">{trip.pickup_address}</p>
                  <p className="mt-2 truncate text-[10px] font-bold">{trip.dropoff_address}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-9">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8f9298]">
              Your rides
            </p>
            <h3 className="mt-1 text-[20px] font-black tracking-[-0.035em]">
              Ride history
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowCompletedTrips((current) => !current)}
            className="mt-4 flex w-full items-center justify-between rounded-[19px] bg-[#e7e9ee] px-4 py-4 text-left shadow-[5px_5px_11px_#c4c6ca,-5px_-5px_11px_#ffffff] transition active:scale-[0.985]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e7e9ee] text-[#ff6846] shadow-[inset_3px_3px_6px_#c4c6ca,inset_-3px_-3px_6px_#ffffff]">
                <HistoryIcon />
              </div>
              <div>
                <p className="text-[12px] font-extrabold">Completed trips</p>
                <p className="mt-0.5 text-[9px] font-medium text-[#92959b]">
                  View your previous RouteX rides
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff6846] px-2 text-[9px] font-black text-white">
                {completedTrips.length}
              </div>
              <div className={`transition-transform duration-200 ${showCompletedTrips ? "rotate-180" : ""}`}>
                <ChevronIcon />
              </div>
            </div>
          </button>

          {showCompletedTrips && (
            <div className="mt-4 space-y-3">
              {completedTrips.length === 0 ? (
                <div className="rounded-[18px] bg-[#e7e9ee] px-4 py-5 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                  <p className="text-[11px] font-bold text-[#85888f]">No completed trips yet.</p>
                </div>
              ) : (
                completedTrips.map((trip) => (
                  <div key={trip.id} className="rounded-[18px] bg-[#e7e9ee] px-4 py-4 shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[#96999f]">
                        {trip.travel_date ? new Date(trip.travel_date).toLocaleDateString() : `BK-${String(trip.id).padStart(4, "0")}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <CheckSmallIcon />
                        <span className="text-[8px] font-extrabold text-[#777a81]">Completed</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center">
                      <div className="mr-3 flex w-3 shrink-0 flex-col items-center">
                        <span className="h-2 w-2 rounded-full bg-[#17191f]" />
                        <span className="my-1 h-4 border-l border-dashed border-[#b9bbc0]" />
                        <span className="h-2 w-2 rounded-[2px] bg-[#ff6846]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-bold">{trip.pickup_address}</p>
                        <p className="mt-2 truncate text-[10px] font-bold">{trip.dropoff_address}</p>
                      </div>
                      <p className="ml-3 text-[11px] font-black">
                        R{Number(trip.passenger_amount ?? trip.fare_amount ?? 0).toFixed(2)}
                      </p>
                    </div>

                    {(trip.driver_name || trip.vehicle_type) && (
                      <div className="mt-4 border-t border-[#d5d7dc] pt-3">
                        <p className="text-[9px] font-extrabold text-[#777a81]">
                          {trip.driver_name || "Driver"}
                          {trip.vehicle_type ? ` • ${trip.vehicle_color || ""} ${trip.vehicle_type}` : ""}
                        </p>
                      </div>
                    )}

                    {!trip.has_reviewed && !reviewedTrips[trip.id] && (
                      <div className="mt-4 rounded-[15px] bg-[#e7e9ee] p-3 shadow-[inset_3px_3px_6px_#c7c9ce,inset_-3px_-3px_6px_#ffffff]">
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#ff6846]">
                          Rate your driver
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setReviewRatings((prev) => ({ ...prev, [trip.id]: star }))
                              }
                              className={`text-[25px] leading-none ${
                                (reviewRatings[trip.id] || 0) >= star
                                  ? "text-[#ff6846]"
                                  : "text-[#b9bbc0]"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewTexts[trip.id] || ""}
                          onChange={(e) =>
                            setReviewTexts((prev) => ({ ...prev, [trip.id]: e.target.value }))
                          }
                          placeholder="Tell us about your trip (optional)"
                          rows={2}
                          className="mt-3 w-full resize-none rounded-[12px] bg-[#e7e9ee] px-3 py-2.5 text-[10px] outline-none shadow-[inset_2px_2px_5px_#c7c9ce,inset_-2px_-2px_5px_#ffffff]"
                        />
                        <button
                          type="button"
                          disabled={submittingReview === trip.id || !reviewRatings[trip.id]}
                          onClick={() => submitDriverReview(trip)}
                          className="mt-3 w-full rounded-[12px] bg-[#ff6846] py-2.5 text-[9px] font-extrabold text-white disabled:opacity-40"
                        >
                          {submittingReview === trip.id ? "Submitting..." : "Submit review"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <section className="mt-9 border-t border-[#d2d4d9] pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold">Need help with a ride?</p>
              <p className="mt-1 text-[9px] font-medium text-[#92959b]">
                RouteX support is here to help.
              </p>
            </div>
            <a
              href="https://wa.me/27799132513"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[12px] bg-[#e7e9ee] px-4 py-2.5 text-[9px] font-extrabold text-[#ff6846] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff]"
            >
              Support
            </a>
          </div>
        </section>

        <footer className="mt-8 text-center">
          <p className="text-[9px] font-semibold text-[#a0a3a9]">
            RouteX • Getting Upington Moving
          </p>
        </footer>
      </div>
    </main>
  );
}


/* =========================================================
   ROUTE POINT
========================================================= */

function RoutePoint({
  type,
  label,
  value,
}: {
  type: "pickup" | "destination";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <span
        className={`h-[11px] w-[11px] shrink-0 ${
          type === "pickup"
            ? "rounded-full bg-[#17191f]"
            : "rounded-[3px] bg-[#ff6846]"
        }`}
      />

      <div className="min-w-0">
        <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#9a9da3]">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[11px] font-extrabold">
          {value}
        </p>
      </div>

    </div>
  );
}


function LocationIcon() {
  return (
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
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#85888f]"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ff6846"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}