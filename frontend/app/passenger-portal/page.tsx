"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

const DriverMap = dynamic(() => import("./DriverMap"), {
  ssr: false,
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
  return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

/** Keep the full geocoded address in the database for routing; display only its local street and suburb. */
function compactDeliveryAddress(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Address not provided";
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 3) return raw;
  const localityIndex = parts.findIndex((part) => /^upington$/i.test(part));
  if (localityIndex > 0) {
    const first = parts[0];
    const suburb = parts.slice(1, localityIndex).find((part) =>
      !/\b(?:ward|municipality|district|province)\b/i.test(part)
    );
    return [first, suburb, "Upington"].filter(Boolean).join(", ");
  }
  const genericAdministrative = /\b(?:ward|municipality|district|province|south africa)\b|^\d{4,5}$/i;
  const local = parts.filter((part) => !genericAdministrative.test(part)).slice(0, 3);
  return local.length ? local.join(", ") : parts.slice(0, 2).join(", ");
}

/* =========================================================
   PAGE
========================================================= */

export default function PassengerPortalPage() {
  const [passenger, setPassenger] = useState<any>(null);
  const [packageDeliveries, setPackageDeliveries] = useState<any[]>([]);
  const [packageError, setPackageError] = useState("");
  const [showPackageHistory, setShowPackageHistory] = useState(true);
  const [portalView, setPortalView] = useState<"dashboard" | "rides" | "deliveries">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portalDark, setPortalDark] = useState(false);
  const [packagePins, setPackagePins] = useState<Record<string, string>>({});
  const [resettingPinId, setResettingPinId] = useState<number | null>(null);
  const [appDialog, setAppDialog] = useState<{ message: string; kind: "confirm" | "notice" } | null>(null);
  const dialogResolve = useRef<((confirmed: boolean) => void) | null>(null);
  const showConfirm = (message: string): Promise<boolean> => new Promise((resolve) => {
    dialogResolve.current = resolve;
    setAppDialog({ message, kind: "confirm" });
  });
  const showNotice = (message: string) => {
    setAppDialog({ message, kind: "notice" });
  };
  const closeDialog = (confirmed = false) => {
    const resolve = dialogResolve.current;
    dialogResolve.current = null;
    setAppDialog(null);
    resolve?.(confirmed);
  };

  const [pinError, setPinError] = useState<Record<string, string>>({});
  const [trackingDeliveryId, setTrackingDeliveryId] = useState<number | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState(0);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);

  const [reviewRatings, setReviewRatings] = useState<Record<number, number>>(
    {},
  );
  const [reviewTexts, setReviewTexts] = useState<Record<number, string>>({});
  const [submittingReview, setSubmittingReview] = useState<number | null>(null);
  const [reviewedTrips, setReviewedTrips] = useState<Record<number, boolean>>(
    {},
  );

  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [showCompletedTrips, setShowCompletedTrips] = useState(false);
  const [showLiveTrip, setShowLiveTrip] = useState(false);

  const router = useRouter();
  useEffect(() => {
    const saved = localStorage.getItem("routex-theme");
    setPortalDark(saved === "dark" || (saved !== "light" && document.documentElement.classList.contains("dark")));
  }, []);
  const togglePortalTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("routex-theme", next ? "dark" : "light");
    setPortalDark(next);
  };
  const logoutPassenger = async () => {
    if (!await showConfirm("Are you sure you want to log out of RouteX?")) return;
    localStorage.removeItem("passenger");
    localStorage.removeItem("routex-package-pins");
    setPassenger(null);
    setPackagePins({});
    router.replace("/passenger-login");
  };

  const changePortalView = (view: "dashboard" | "rides" | "deliveries") => {
    setPortalView(view);
    setSidebarOpen(false);
    setShowCompletedTrips(view === "rides");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  type ScheduledRide = {
    id: number;
    pickup_address: string;
    dropoff_address: string;
    fare_amount: number | string;
    passenger_amount?: number | string | null;
    discount_amount?: number | string | null;
    promo_code?: string | null;

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
        { cache: "no-store" },
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
    if (!await showConfirm("Cancel this scheduled RouteX ride?")) return;
    try {
      setCancellingRideId(rideId);
      const response = await fetch(
        `${API_URL}/scheduled-bookings/${rideId}/cancel`,
        { method: "PATCH" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not cancel this ride.");
      }
      setScheduledRides((current) =>
        current.filter((ride) => ride.id !== rideId),
      );
    } catch (error: any) {
      console.error("CANCEL SCHEDULED RIDE ERROR:", error);
      showNotice(error?.message || "Could not cancel this ride.");
    } finally {
      setCancellingRideId(null);
    }
  };

  const confirmScheduledPickupLocation = async (rideId: number) => {
    if (!navigator.geolocation) {
      showNotice("Location services are not supported on this device.");
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
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data?.error || "Could not confirm your pickup location.",
            );
          }

          console.log("SCHEDULED PICKUP GPS CONFIRMED:", data);

          showNotice(
            "Pickup location confirmed. Your driver will use this location for navigation.",
          );

          if (passenger?.id) {
            await loadScheduledRides(passenger.id);
          }
        } catch (error: any) {
          console.error("SCHEDULED PICKUP LOCATION ERROR:", error);

          showNotice(
            error?.message || "Could not confirm your pickup location.",
          );
        }
      },

      (error) => {
        console.error("GPS ERROR:", error);

        if (error.code === error.PERMISSION_DENIED) {
          showNotice(
            "Location permission was denied. Please allow location access and try again.",
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          showNotice(
            "Your current location could not be determined. Please try again.",
          );
        } else if (error.code === error.TIMEOUT) {
          showNotice(
            "Getting your location took too long. Please try again.",
          );
        } else {
          showNotice("Could not get your current location.");
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookingWasScheduled, setBookingWasScheduled] = useState(false);

  useEffect(() => {
    const bookingResult = new URLSearchParams(window.location.search).get(
      "booking",
    );

    if (bookingResult === "scheduled" || bookingResult === "requested") {
      setBookingWasScheduled(bookingResult === "scheduled");
      setShowBookingSuccess(true);
    }
  }, []);

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

  const loadPackageDeliveries = async (passengerData: any) => {
    if (!passengerData?.token) {
      setPackageError("Please sign in again to view your package deliveries.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/passenger/package-deliveries`, {
        headers: { Authorization: `Bearer ${passengerData.token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to load deliveries.");
      setPackageDeliveries(Array.isArray(data) ? data : []);
      setPackageError("");
    } catch (error: any) {
      setPackageError(error?.message || "Unable to load deliveries.");
    }
  };

  // Requires the matching authenticated backend route before activation.
  const resetDeliveryPin = async (deliveryId: number) => {
    if (!passenger?.token || resettingPinId !== null) return;
    if (!await showConfirm("Generate a new handover PIN? The previous PIN will stop working.")) return;
    setResettingPinId(deliveryId);
    setPinError((current) => ({ ...current, [deliveryId]: "" }));
    try {
      const response = await fetch(`${API_URL}/passenger/package-deliveries/${deliveryId}/reset-pin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${passenger.token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate a replacement PIN.");
      const newPin = String(data.pin || "");
      if (!/^\d{6}$/.test(newPin)) throw new Error("The server did not return a valid six-digit PIN.");
      // Keep replacement PIN in memory only; never persist it in localStorage.
      setPackagePins((current) => ({ ...current, [deliveryId]: newPin }));
    } catch (error: any) {
      setPinError((current) => ({ ...current, [deliveryId]: error?.message || "Could not reset PIN." }));
    } finally {
      setResettingPinId(null);
    }
  };

  /* =======================================================
     LOAD PASSENGER TRIPS
  ======================================================= */
  const loadDriverLocation = async (passengerId: number, bookingId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/passenger-bookings/${passengerId}/${bookingId}/driver-location`,
      );

      if (!response.ok) {
        setDriverLocation(null);
        return;
      }

      const data = await response.json();

      console.log("DRIVER LOCATION:", data);

      setDriverLocation(data);
    } catch (error) {
      console.error("Error loading driver location:", error);

      setDriverLocation(null);
    }
  };

  const loadTrips = async (passengerId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/passenger-bookings/${passengerId}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to load trips: ${response.status}`);
      }

      const data = await response.json();
      const rides = Array.isArray(data) ? data : [];

      console.log("PASSENGER TRIPS REFRESH:", rides);

      setTrips(rides);

      // Find the passenger's current active ride.
      const activeTrip = rides.find((trip: any) => {
        const status = String(trip.trip_status ?? trip.booking_status ?? "")
          .trim()
          .toLowerCase()
          .replace(/-/g, "_")
          .replace(/\s+/g, "_");

        return (
          trip.assigned_driver_id &&
          (status === "accepted" || status === "in_progress")
        );
      });

      if (activeTrip) {
        console.log(
          "PASSENGER ACTIVE TRIP:",
          activeTrip.id,
          activeTrip.trip_status,
          activeTrip.booking_status,
        );

        loadDriverLocation(Number(passengerId), Number(activeTrip.id));
      } else {
        setDriverLocation(null);
      }

      // Find a ride that is still waiting for a driver.
      const waitingTrip = rides.find((trip: any) => {
        const status = String(trip.trip_status ?? trip.booking_status ?? "")
          .trim()
          .toLowerCase();

        return status === "waiting" && trip.pickup_lat && trip.pickup_lng;
      });

      if (waitingTrip) {
        loadAvailableDrivers(
          Number(waitingTrip.pickup_lat),
          Number(waitingTrip.pickup_lng),
        );
      } else {
        setAvailableDrivers([]);
      }
    } catch (error) {
      console.error("Error loading trips:", error);
    }
  };

  const cancelBooking = async (bookingId: number) => {
    const confirmed = await showConfirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        showNotice(data.error || "Could not cancel booking.");
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
            : trip,
        ),
      );
    } catch (error) {
      console.error("CANCEL BOOKING ERROR:", error);
      showNotice("Could not cancel booking.");
    }
  };

  const submitDriverReview = async (trip: any) => {
    const rating = reviewRatings[trip.id];

    if (!rating) {
      showNotice("Please select a star rating.");
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
        throw new Error(data.error || "Failed to submit review.");
      }

      setReviewedTrips((prev) => ({
        ...prev,
        [trip.id]: true,
      }));

      showNotice("Thank you for rating your driver.");
    } catch (error: any) {
      console.error("REVIEW ERROR:", error);
      showNotice(error.message || "Unable to submit review.");
    } finally {
      setSubmittingReview(null);
    }
  };
  /* =======================================================
     LOAD ONLINE DRIVERS
  ======================================================= */

  const loadOnlineDrivers = async () => {
    try {
      const response = await fetch(`${API_URL}/online-drivers`);

      if (!response.ok) {
        throw new Error(`Failed to load drivers: ${response.status}`);
      }

      const data = await response.json();

      setOnlineDrivers(Number(data.total) || 0);

      console.log("ONLINE DRIVERS:", data);
    } catch (error) {
      console.error("Error loading online drivers:", error);
    }
  };

  const loadAvailableDrivers = async (pickupLat: number, pickupLng: number) => {
    try {
      const response = await fetch(
        `${API_URL}/available-drivers?pickup_lat=${pickupLat}&pickup_lng=${pickupLng}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to load available drivers: ${response.status}`);
      }

      const data = await response.json();

      setAvailableDrivers(Array.isArray(data) ? data : []);

      console.log("AVAILABLE DRIVERS:", data);
    } catch (error) {
      console.error("Error loading available drivers:", error);

      setAvailableDrivers([]);
    }
  };

  /* =======================================================
     LOAD PASSENGER
  ======================================================= */

  useEffect(() => {
    const storedPassenger = localStorage.getItem("passenger");

    if (!storedPassenger) {
      console.log("No passenger found in localStorage.");
      return;
    }

    try {
      const passengerData = JSON.parse(storedPassenger);

      console.log("PASSENGER FROM LOCAL STORAGE:", passengerData);

      // Restore the last successfully uploaded photo for this passenger if
      // the login session was saved without its profile_image field.
      const cachedPhoto = localStorage.getItem(`routex-passenger-photo-${passengerData.id}`);
      const restoredPassenger = {
        ...passengerData,
        profile_image: passengerData.profile_image || cachedPhoto || "",
      };
      setPassenger(restoredPassenger);
      setPhotoFailed(false);

      loadTrips(passengerData.id);
      loadScheduledRides(passengerData.id);
      loadPackageDeliveries(passengerData);
      try {
        setPackagePins(JSON.parse(localStorage.getItem("routex-package-pins") || "{}"));
      } catch { setPackagePins({}); }
      loadOnlineDrivers();

      const interval = setInterval(() => {
        loadTrips(passengerData.id);
        loadScheduledRides(passengerData.id);
        loadPackageDeliveries(passengerData);
        loadOnlineDrivers();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    } catch (error) {
      console.error("Could not parse passenger data:", error);
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
      const response = await fetch(`${API_URL}/passenger/upload-photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("UPLOAD SERVER ERROR:", errorText);
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
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
        throw new Error("The server did not return the saved photo URL.");
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
      setPhotoFailed(false);
      localStorage.setItem(`routex-passenger-photo-${passenger.id}`, finalImageUrl);

      localStorage.setItem("passenger", JSON.stringify(updatedPassenger));

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

  const profileImageUrl = getProfileImageUrl(passenger?.profile_image);

  const normalizedStatus = (trip: any) =>
    String(trip?.trip_status || trip?.booking_status || "")
      .trim()
      .toLowerCase();

  const activeTrip =
    trips.find((trip) =>
      ["accepted", "in progress"].includes(normalizedStatus(trip)),
    ) || null;

  const waitingTrips = trips.filter(
    (trip) => normalizedStatus(trip) === "waiting",
  );

  const completedTrips = trips.filter(
    (trip) => normalizedStatus(trip) === "completed",
  );
  const upcomingScheduledRides = scheduledRides.filter((ride) => {
    const status = String(ride.trip_status || ride.booking_status || "")
      .trim()
      .toLowerCase();

    return ["scheduled", "waiting"].includes(status);
  });
  const activeScheduledRide = scheduledRides.find((ride) => {
    const status = String(ride.trip_status || ride.booking_status || "")
      .trim()
      .toLowerCase();

    return (
      ride.id === activeTrip?.id && ["accepted", "in progress"].includes(status)
    );
  });
  const otherTrips = trips.filter((trip) => {
    const status = normalizedStatus(trip);
    return (
      status &&
      ![
        "scheduled",
        "waiting",
        "accepted",
        "in progress",
        "completed",
        "cancelled",
      ].includes(status)
    );
  });

  const firstName =
    passenger?.full_name?.trim()?.split(/\s+/)?.[0] || "Passenger";
  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-[100dvh] bg-[#e9edf4] text-[#202631] dark:bg-[#262b34] dark:text-[#edf0f6]">
      {appDialog && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-[#101923]/65 p-5" role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="routex-dialog-title" aria-describedby="routex-dialog-description" className="w-full max-w-sm rounded-[26px] border border-white/90 bg-[#f7f9fc] p-6 text-[#202b3c] shadow-[12px_12px_35px_#10192340,-5px_-5px_20px_#ffffff60] dark:border-[#46505e] dark:bg-[#2b3340] dark:text-white">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#f26a46] shadow-[5px_5px_12px_#cbd0da,-5px_-5px_12px_#ffffff] dark:bg-[#364152] dark:shadow-none">
              <span className="text-2xl" aria-hidden="true">{appDialog.kind === "confirm" ? "?" : "✓"}</span>
            </div>
            <h2 id="routex-dialog-title" className="text-lg font-bold">{appDialog.kind === "confirm" ? "Please confirm" : "RouteX notification"}</h2>
            <p id="routex-dialog-description" className="mt-2 text-sm leading-6 text-[#566274] dark:text-[#d5dce7]">{appDialog.message}</p>
            <div className="mt-6 flex gap-3">
              {appDialog.kind === "confirm" && <button type="button" onClick={() => closeDialog(false)} className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#25364a] shadow-[3px_3px_9px_#d4d9e3,-3px_-3px_9px_#fff] dark:bg-[#424b59] dark:text-white dark:shadow-none">Cancel</button>}
              <button type="button" autoFocus onClick={() => closeDialog(true)} className="flex-1 rounded-xl bg-[#ef6849] px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_14px_#ef684950]">{appDialog.kind === "confirm" ? "Confirm" : "OK"}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rx-hero{background:linear-gradient(118deg,#172c42 0%,#253e57 48%,#d9674d 100%);border-radius:0 0 32px 32px;box-shadow:0 14px 30px rgba(30,39,53,.2);position:relative;overflow:hidden;color:white}
        .rx-hero:after{content:"";position:absolute;right:-100px;bottom:-170px;width:260px;height:260px;border:30px solid rgba(255,255,255,.055);border-radius:50%;pointer-events:none}
        .dark .rx-hero{background:linear-gradient(118deg,#101923 0%,#1c2c40 52%,#8d463d 100%)}
        .rx-surface{background:#e9edf4;box-shadow:9px 9px 20px #c7cbd4,-9px -9px 20px #fff;border:1px solid rgba(255,255,255,.8);border-radius:24px}
        .dark .rx-surface{background:#292e37;box-shadow:9px 9px 20px #161a21,-9px -9px 20px #3b424e;border-color:#383f4a}
        .rx-inset{background:#e9edf4;box-shadow:inset 5px 5px 11px #cdd1da,inset -5px -5px 11px #fff;border-radius:16px}
        .dark .rx-inset{background:#292e37;box-shadow:inset 5px 5px 11px #171b22,inset -5px -5px 11px #3c4350}
        .rx-switch{width:64px;height:34px;border-radius:25px;background:#e4e8ee;box-shadow:inset 3px 3px 6px #aab0bc,inset -3px -3px 6px #fff;position:relative;flex-shrink:0}
        .rx-thumb{position:absolute;top:4px;left:4px;width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:white;color:#f28c3f;box-shadow:2px 3px 7px #1c25364a;transition:transform .25s}
        .dark .rx-switch{background:#333a46;box-shadow:inset 3px 3px 6px #12151c,inset -3px -3px 6px #555c68}
        .dark .rx-thumb{transform:translateX(30px);background:#d9e0ec;color:#35435b}
        .rx-action{transition:transform .18s}.rx-action:active{transform:scale(.985)}
        .rx-menu{background:#e9edf4;box-shadow:10px 0 30px #1115}.dark .rx-menu{background:#292e37}
        .rx-menu-link{width:100%;display:flex;align-items:center;gap:13px;padding:12px 12px;border-radius:18px;text-align:left;font-size:14px;font-weight:500;line-height:1.45;color:#465160;transition:color .15s,box-shadow .15s}
        .rx-menu-link svg{width:23px;height:23px;flex-shrink:0;stroke-width:1.8}
        .rx-menu-link:hover,.rx-menu-link[aria-current="page"]{box-shadow:inset 5px 5px 10px #cdd1da,inset -5px -5px 10px #fff;color:#f15b3e}
        .dark .rx-menu-link{color:#d5dce7}
        .dark .rx-menu-link:hover,.dark .rx-menu-link[aria-current="page"]{box-shadow:inset 4px 4px 9px #171b22,inset -4px -4px 9px #3c4350;color:#ff8064}
      `}</style>
      {sidebarOpen && <div className="fixed inset-0 z-[9998] bg-[#101923]/65" onClick={() => setSidebarOpen(false)}>
        <aside className="rx-menu h-full w-[min(300px,78vw)] px-3 py-5 text-[#202631] dark:text-[#edf0f6]" onClick={(event) => event.stopPropagation()} aria-label="Passenger navigation">
          <div className="mb-7 flex items-center justify-between">
            <span className="text-[25px] font-bold tracking-[.12em]">ROUTE<span className="text-[#ff6846]">X</span></span>
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="rounded-xl p-2 text-[#17191f] dark:text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
            </button>
          </div>
          <nav className="space-y-1" aria-label="Passenger portal sections">
            <button type="button" className="rx-menu-link" aria-current={portalView === "dashboard" ? "page" : undefined} onClick={() => changePortalView("dashboard")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-9h6v9"/></svg><span>Dashboard</span>
            </button>
            <button type="button" className="rx-menu-link" aria-current={portalView === "rides" ? "page" : undefined} onClick={() => changePortalView("rides")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.7-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg><span>Completed rides</span>
            </button>
            <button type="button" className="rx-menu-link" aria-current={portalView === "deliveries" ? "page" : undefined} onClick={() => changePortalView("deliveries")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 4 9-4M12 11v10M7.5 5l9 4"/></svg><span>Completed deliveries</span>
            </button>
            <button type="button" className="rx-menu-link" onClick={() => {setSidebarOpen(false);document.getElementById("routex-profile-photo")?.click();}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg><span>My profile</span>
            </button>
            <a className="rx-menu-link" href="https://wa.me/27799132513" target="_blank" rel="noopener noreferrer" onClick={() => setSidebarOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg><span>Support</span>
            </a>
          </nav>
        </aside>
      </div>}
      {trackingDeliveryId !== null && (() => {
        const delivery = packageDeliveries.find((item) => Number(item.id) === trackingDeliveryId);
        const lat = delivery?.driver_lat == null ? NaN : Number(delivery.driver_lat);
        const lng = delivery?.driver_lng == null ? NaN : Number(delivery.driver_lng);
        const pickupLat = delivery?.pickup_lat == null ? NaN : Number(delivery.pickup_lat);
        const pickupLng = delivery?.pickup_lng == null ? NaN : Number(delivery.pickup_lng);
        const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
        const hasPickup = Number.isFinite(pickupLat) && Number.isFinite(pickupLng) && Math.abs(pickupLat) <= 90 && Math.abs(pickupLng) <= 180;
        return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101923]/75 p-4" role="dialog" aria-modal="true" aria-label="Track package delivery">
          <div className="rx-surface max-h-[90dvh] w-full max-w-[650px] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-[#ff6846]">Package PX-{String(trackingDeliveryId).padStart(4, "0")}</p><h2 className="mt-1 text-xl font-semibold">Track your delivery</h2><p className="mt-1 text-sm text-[#7e8ba0] dark:text-[#a7b0bd]">{delivery?.driver_name || "Assigned RouteX driver"} · {String(delivery?.status || "Assigned").replace(/_/g, " ")}</p></div>
              <button type="button" onClick={() => setTrackingDeliveryId(null)} aria-label="Close tracking" className="rx-inset rounded-xl px-3 py-2 text-lg">×</button>
            </div>
            {hasLocation && hasPickup ? <div className="mt-5 overflow-hidden rounded-2xl"><DriverMap driverLat={lat} driverLng={lng} pickupLat={pickupLat} pickupLng={pickupLng} driverName={delivery?.driver_name || "RouteX driver"}/></div> : <div className="rx-inset mt-5 p-6 text-sm text-[#748198] dark:text-[#c2c5d0]">{hasLocation ? "The driver's position is available, but collection coordinates are missing for the route map." : "Waiting for the driver's live GPS position. Keep this window open; it updates as new location data arrives."}</div>}
            <div className="mt-4 space-y-2 text-sm"><p><span className="text-[#748198] dark:text-[#b1bccb]">Collection:</span> {compactDeliveryAddress(delivery?.pickup_address)}</p><p><span className="text-[#748198] dark:text-[#b1bccb]">Destination:</span> {compactDeliveryAddress(delivery?.dropoff_address)}</p></div>
            {hasLocation && <a className="mt-4 inline-flex rounded-xl bg-[#17191f] px-4 py-3 text-xs font-semibold text-white" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`} target="_blank" rel="noopener noreferrer">Open driver position in Google Maps</a>}
            <p className="mt-3 text-xs text-[#748198] dark:text-[#b1bccb]">Location refreshes approximately every 5 seconds while the Driver Portal sends GPS updates.</p>
          </div>
        </div>;
      })()}
      {showBookingSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-5 backdrop-blur-[3px]">
          <div className="w-full max-w-[350px] rounded-[28px] bg-[#e7e9ee] p-6 text-[#17191f] shadow-[10px_10px_30px_rgba(0,0,0,0.25),-6px_-6px_18px_rgba(255,255,255,0.8)] dark:bg-[#17191e] dark:text-[#f5f5f7] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6846] text-white">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>
            </div>
            <div className="mt-5 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#ff6846]">
                RouteX
              </p>
              <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.045em]">
                {bookingWasScheduled ? "Ride scheduled" : "Ride requested"}
              </h2>
              <p className="mx-auto mt-2 max-w-[260px] text-[11px] font-semibold leading-5 text-[#85888f] dark:text-[#aeb1bd]">
                {bookingWasScheduled
                  ? "Your ride is booked. RouteX will start matching you with a driver closer to your pickup time."
                  : "Your request has been sent. Nearby RouteX drivers can now accept your ride."}
              </p>
            </div>
            {bookingWasScheduled && (
              <div className="mt-5 rounded-[18px] bg-[#e7e9ee] px-4 py-3 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#17191f] text-[#ff6846] dark:bg-[#292c35]">
                    <ClockIcon />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold">Scheduled</p>
                    <p className="mt-0.5 text-[8px] font-semibold text-[#8d9097] dark:text-[#aeb1bd]">
                      Driver matching opens closer to pickup time.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={closeBookingSuccess}
              className="mt-6 flex w-full items-center justify-center rounded-[16px] bg-[#17191f] px-5 py-4 text-[12px] font-semibold text-white dark:bg-[#292c35]"
            >
              Done
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-[790px] pb-10">
        <header className="rx-hero px-5 pb-4 pt-3 sm:px-7">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex flex-col items-start gap-2 pt-1">
              <span className="text-[17px] font-bold tracking-[.15em]">ROUTE<span className="text-[#ff987f]">X</span></span>
              <button type="button" aria-label="Open menu" onClick={() => setSidebarOpen(true)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/10 shadow-[3px_3px_9px_#1115,inset_1px_1px_2px_#fff4]">
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              </button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button type="button" className="rx-switch" onClick={togglePortalTheme} aria-label="Switch between light and dark mode" aria-pressed={portalDark} title="Day / night mode">
                <span className="absolute left-[9px] top-[7px] text-sm text-[#f59a40]">☀</span><span className="absolute right-[9px] top-[7px] text-sm text-[#657084]">☾</span><span className="rx-thumb">{portalDark ? "☾" : "☀"}</span>
              </button>
              <div className="relative flex flex-col items-center">
                <label title="Change profile photo" className="relative block h-[88px] w-[88px] cursor-pointer overflow-hidden rounded-full border-4 border-white bg-[#e9edf4] p-0.5 shadow-[5px_5px_14px_#1118,-3px_-3px_10px_#fff7]">
                  <span className="block h-full w-full overflow-hidden rounded-full bg-[#e9edf4]">
                    {photo ? <img src={photoPreviewUrl} alt="Selected profile" className="h-full w-full object-cover"/> : !photoFailed && profileImageUrl ? <img onError={() => setPhotoFailed(true)} key={`${passenger?.profile_image}-${photoVersion}`} src={`${profileImageUrl}${profileImageUrl.includes("?") ? "&" : "?"}v=${photoVersion}`} alt={passenger?.full_name || "Passenger"} className="h-full w-full object-cover"/> : <span className="grid h-full w-full place-items-center text-2xl font-semibold text-[#d9674d]">{firstName.charAt(0).toUpperCase()}</span>}
                  </span>
                  <input id="routex-profile-photo" type="file" accept="image/*" disabled={uploadingPhoto} className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setPhoto(file); await uploadPhoto(file); e.target.value = ""; }}/>
                </label>
                <span className="mt-1 text-xs text-white/85">{uploadingPhoto ? "Uploading…" : "Profile"}</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-1">
            <h1 className="text-[25px] font-semibold leading-tight tracking-[-.045em] sm:text-[33px]">Hi, {firstName}</h1>
            <p className="mt-1 text-[12px] text-white/85">Where would you like to go today?</p>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={logoutPassenger}
                className="rounded-[15px] border border-white/30 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white shadow-[3px_3px_9px_#1113] transition hover:bg-white/20"
              >
                Log out
              </button>
            </div>
          </div>
        </header>
        <div className="px-4 pb-8 pt-6 sm:px-6">
          {!profileImageUrl && !photo && passenger?.id && (
            <div className="mb-5 flex items-center gap-3 rounded-[18px] border border-[#f2c8b9] bg-[#fff3ed] px-4 py-3 text-[#263448] shadow-[3px_4px_12px_rgba(30,48,74,.07)] dark:border-[#785044] dark:bg-[#382d2c] dark:text-white">
              <span aria-hidden="true" className="text-xl">📷</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">Help your driver recognise you</p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#657184] dark:text-[#d0c4c0]">Add a clear profile photo so your driver can identify you at pickup.</p>
              </div>
              <button type="button" disabled={uploadingPhoto} onClick={() => document.getElementById("routex-profile-photo")?.click()} className="shrink-0 rounded-xl bg-[#ef6849] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50">Add photo</button>
            </div>
          )}
          {portalView === "dashboard" && <>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.14em] text-[#8793a4] dark:text-[#a7b0bd]">Your services</p>
          <div className="grid grid-cols-1 gap-4">
            <a href="/bookings" className="rx-action rx-surface flex items-center gap-4 px-5 py-4">
              <span className="rx-surface grid h-14 w-14 shrink-0 place-items-center text-[#ff6846]"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11 7 5h10l2 6M4 11h16v7H4zM7 18v2m10-2v2"/><path d="M7 14h.01M17 14h.01"/></svg></span>
              <span className="min-w-0 flex-1"><strong className="block text-[16px] font-semibold">Book a ride</strong><small className="mt-1 block text-xs text-[#7c8797] dark:text-[#a7b0bd]">Travel anywhere in Upington</small></span><span className="text-[#9aa5b3]">→</span>
            </a>
            <a href="/package-delivery" className="rx-action rx-surface flex items-center gap-4 px-5 py-4">
              <span className="rx-surface grid h-14 w-14 shrink-0 place-items-center text-[#ff6846]"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 4 9-4M12 11v10M7.5 5l9 4"/></svg></span>
              <span className="min-w-0 flex-1"><strong className="block text-[16px] font-semibold">Send a package</strong><small className="mt-1 block text-xs text-[#7c8797] dark:text-[#a7b0bd]">Collection and local delivery</small></span><span className="text-[#9aa5b3]">→</span>
            </a>
          </div>
          {/* PACKAGE DELIVERIES — independent of passenger rides */}
          <section className="mt-8">
            <button type="button" onClick={() => setShowPackageHistory(!showPackageHistory)}
              className="flex w-full items-center justify-between text-left">
              <span className="text-[21px] font-semibold tracking-[-0.035em]">Active deliveries</span>
              <span className="text-xs font-medium text-[#8492a6] dark:text-[#b1bccb]">{packageDeliveries.filter((d) => !["cancelled", "delivered"].includes(String(d.status || "").toLowerCase())).length} request{packageDeliveries.filter((d) => !["cancelled", "delivered"].includes(String(d.status || "").toLowerCase())).length === 1 ? "" : "s"} · {showPackageHistory ? "Hide" : "Show"}</span>
            </button>
            {showPackageHistory && (
              <div className="mt-4 space-y-4">
                {packageError && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{packageError}</p>}
                {!packageError && packageDeliveries.length === 0 && (
                  <p className="text-sm text-[#85888f] dark:text-[#aeb1bd]">No package deliveries yet.</p>
                )}
                {packageDeliveries.filter((delivery) => !["cancelled", "delivered"].includes(String(delivery.status || "").toLowerCase())).map((delivery) => {
                  const status = String(delivery.status || "pending");
                  const statusText: Record<string, string> = {
                    pending: "Waiting for driver", accepted: "Driver assigned",
                    collected: "Parcel collected", in_transit: "In transit", delivered: "Delivered",
                    cancelled: "Cancelled",
                  };
                  const phone = String(delivery.driver_phone || "").replace(/\D/g, "");
                  const whatsappPhone = phone.startsWith("0") ? `27${phone.slice(1)}` : phone;
                  const pin = packagePins[String(delivery.id)];
                  return (
                    <article key={delivery.id} className="rounded-[24px] border border-white/80 bg-[#e9edf4] p-5 text-[#202b3c] shadow-[9px_9px_22px_rgba(30,48,74,.10),-8px_-8px_22px_rgba(255,255,255,.90)] dark:border-[#343b46] dark:bg-[#292e37] dark:text-white sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-[.12em] text-[#788397] dark:text-[#aeb8c7]">Package delivery</p>
                          <h3 className="mt-1 text-[23px] font-semibold tracking-tight">PX-{String(delivery.id).padStart(4, "0")}</h3>
                          <p className="mt-1 text-[13px] text-[#718096] dark:text-[#bbc3cf]">{delivery.parcel_size ? `${delivery.parcel_size} parcel` : "Package"}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block rounded-full bg-[#f4fff8] px-3 py-2 text-[11px] font-semibold text-[#19834b] shadow-[3px_3px_8px_rgba(30,48,74,.10),-3px_-3px_8px_#fff] dark:bg-[#283b34] dark:text-[#8be2af]">{statusText[status] || status}</span>
                          <p className="mt-2 text-[23px] font-semibold">R{Number(delivery.fare_amount || 0).toFixed(0)}</p>
                        </div>
                      </div>
                      <div className="my-5 border-t border-[#e1e5ec] dark:border-[#424a56]" />
                      {delivery.scheduled_pickup_at && (
                        <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] bg-white px-4 py-4 shadow-[inset_4px_4px_10px_rgba(32,48,70,.08),inset_-4px_-4px_10px_#fff] dark:bg-[#252b35] dark:shadow-[inset_4px_4px_10px_#191e26,inset_-4px_-4px_10px_#303744]">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff6846] shadow-[4px_4px_10px_rgba(30,48,74,.13),-4px_-4px_10px_#fff] dark:bg-[#303744] dark:shadow-none"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h3"/></svg></span>
                            <div className="min-w-0"><p className="text-xs text-[#748198] dark:text-[#b1bccb]">Scheduled collection</p><p className="mt-1 text-[14px] font-semibold">{new Date(delivery.scheduled_pickup_at).toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg", weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
                          </div>
                          <div className="shrink-0 text-right"><p className="text-xs text-[#748198] dark:text-[#b1bccb]">Time</p><p className="mt-1 text-[19px] font-semibold text-[#ff6846]">{new Date(delivery.scheduled_pickup_at).toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false })}</p></div>
                        </div>
                      )}
                      <div className="rounded-[22px] bg-white px-5 py-5 shadow-[inset_4px_4px_11px_rgba(32,48,70,.08),inset_-4px_-4px_11px_#fff] dark:bg-[#252b35] dark:shadow-[inset_4px_4px_11px_#191e26,inset_-4px_-4px_11px_#303744]">
                        <div className="flex gap-4"><span className="mt-1 text-[#40516a]">◉</span><div className="min-w-0"><p className="text-[11px] uppercase tracking-[.06em] text-[#748198] dark:text-[#b1bccb]">Collection</p><p className="mt-1 break-words text-[15px] font-medium">{compactDeliveryAddress(delivery.pickup_address)}</p></div></div>
                        <div className="ml-[7px] my-2 h-7 border-l border-dashed border-[#cbd4e0]" />
                        <div className="flex gap-4"><span className="mt-1 text-[#ff6846]">◎</span><div className="min-w-0"><p className="text-[11px] uppercase tracking-[.06em] text-[#748198] dark:text-[#b1bccb]">Destination</p><p className="mt-1 break-words text-[15px] font-medium">{compactDeliveryAddress(delivery.dropoff_address)}</p></div></div>
                      </div>
                      {status !== "delivered" && (
                        <div className="mt-4 rounded-[22px] bg-white p-5 shadow-[inset_4px_4px_11px_rgba(32,48,70,.08),inset_-4px_-4px_11px_#fff] dark:bg-[#252b35] dark:shadow-[inset_4px_4px_11px_#191e26,inset_-4px_-4px_11px_#303744]">
                          <p className="text-[15px] font-semibold">Delivery handover PIN</p>
                          {pin ? <><p className="mt-3 text-[24px] font-semibold tracking-[.25em] text-[#ff6846]">{pin}</p><p className="mt-2 text-xs text-[#748198] dark:text-[#bbc3cf]">Share this PIN only with the recipient. The driver needs it to complete delivery.</p></> : <p className="mt-2 text-[13px] leading-relaxed text-[#748198] dark:text-[#bbc3cf]">Your original PIN was shown when you booked. Request a replacement if you no longer have it.</p>}
                          <button type="button" disabled={resettingPinId !== null} onClick={() => resetDeliveryPin(Number(delivery.id))} className="mt-4 rounded-[15px] bg-[#202d40] px-5 py-3 text-[12px] font-semibold text-white shadow-[4px_5px_10px_rgba(30,48,74,.18)] disabled:opacity-50">{resettingPinId === Number(delivery.id) ? "Generating PIN…" : "Reset handover PIN"}</button>
                          {pinError[String(delivery.id)] && <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">{pinError[String(delivery.id)]}</p>}
                        </div>
                      )}
                      {delivery.driver_id && (
                        <div className="mt-4 rounded-[22px] bg-white p-5 shadow-[inset_4px_4px_11px_rgba(32,48,70,.08),inset_-4px_-4px_11px_#fff] dark:bg-[#252b35] dark:shadow-[inset_4px_4px_11px_#191e26,inset_-4px_-4px_11px_#303744]">
                          <p className="mb-4 text-[15px] font-semibold">Assigned RouteX driver</p>
                          <div className="flex items-center gap-3">
                            {delivery.driver_profile_image ? <img src={getProfileImageUrl(delivery.driver_profile_image)} alt="Driver" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#40516a] font-semibold text-white">{String(delivery.driver_name || "D").charAt(0)}</div>}
                            <div className="min-w-0"><p className="text-[15px] font-semibold">{delivery.driver_name || "RouteX driver"}</p><p className="mt-1 text-xs text-[#748198] dark:text-[#bbc3cf]">{[delivery.vehicle_color, delivery.vehicle_type, delivery.license_plate].filter(Boolean).join(" · ")}</p></div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            {whatsappPhone && <a className="rounded-[14px] bg-[#202d40] px-5 py-3 text-xs font-semibold text-white shadow-[4px_5px_10px_rgba(30,48,74,.16)]" href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noopener noreferrer">Contact driver</a>}
                            <button type="button" className="rounded-[14px] bg-[#ff6846] px-5 py-3 text-xs font-semibold text-white shadow-[4px_5px_10px_rgba(255,104,70,.20)]" onClick={() => setTrackingDeliveryId(Number(delivery.id))}>View driver location</button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

        </>}
        {portalView === "dashboard" && <>
        {waitingTrips.length > 0 && (
          <section className="mt-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#ff6846]">
              Looking for a driver
            </p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.035em]">
              Your ride is waiting
            </h3>

            {waitingTrips.map((trip) => (
              <div
                key={trip.id}
                className="mt-4 rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#777a81] dark:text-[#aeb1bd]">
                    BK-{String(trip.id).padStart(4, "0")}
                  </span>
                  <span className="rounded-full bg-[#fff0eb] px-3 py-1.5 text-[9px] font-semibold text-[#ff6846] dark:bg-[#39251f]">
                    Waiting
                  </span>
                </div>

                <div className="mt-4 rounded-[17px] bg-[#e7e9ee] px-4 py-3.5 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                  <RoutePoint
                    type="pickup"
                    label="Pickup"
                    value={trip.pickup_address || "Pickup"}
                  />
                  <div className="ml-[5px] h-4 border-l border-dashed border-[#b5b8be] dark:border-[#525662]" />
                  <RoutePoint
                    type="destination"
                    label="Destination"
                    value={trip.dropoff_address || "Destination"}
                  />
                </div>

                <div className="mt-4 rounded-[15px] bg-white px-4 py-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_#ffffff] dark:bg-[#22252e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />

                      <span className="text-[10px] font-semibold text-black/60 dark:text-[#f5f5f7] dark:text-white/70">
                        Drivers online
                      </span>
                    </div>

                    <span className="text-[13px] font-semibold text-black dark:text-[#f5f5f7]">
                      {onlineDrivers}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[9px] font-medium text-black/40 dark:text-[#f5f5f7] dark:text-white/55">
                    {availableDrivers.length > 0
                      ? `${availableDrivers.length} nearby driver${
                          availableDrivers.length === 1 ? "" : "s"
                        } available for your request`
                      : onlineDrivers > 0
                        ? "Your request is still being sent to available drivers"
                        : "No drivers are currently online"}
                  </p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a9da3] dark:text-[#aeb1bd]">
                      Your fare
                    </p>

                    <p className="mt-0.5 text-[18px] font-semibold">
                      R
                      {Number(
                        trip.passenger_amount ?? trip.fare_amount ?? 0,
                      ).toFixed(0)}
                    </p>
                  </div>

                  {Number(trip.discount_amount || 0) > 0 && (
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-[#ff6846]">
                        {trip.promo_code || "Promo"}: -R
                        {Number(trip.discount_amount).toFixed(0)}
                      </p>

                      <p className="mt-0.5 text-[8px] font-semibold text-[#9a9da3] dark:text-[#aeb1bd]">
                        Original fare R
                        {Number(trip.fare_amount || 0).toFixed(0)}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => cancelBooking(trip.id)}
                  className="mt-4 w-full rounded-[14px] bg-[#e7e9ee] py-3 text-[10px] font-semibold text-[#ff6846] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
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
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#ff6846]">
                  Active ride
                </p>
                <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.035em]">
                  {normalizedStatus(activeTrip) === "in progress"
                    ? "Your trip is in progress"
                    : "Your driver is coming"}
                </h3>
              </div>
              <span className="rounded-full bg-[#17191f] px-3 py-1.5 text-[9px] font-semibold text-white dark:bg-[#292c35]">
                {activeTrip.trip_status}
              </span>
            </div>

            <div className="mt-4 rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]">
              <div className="flex items-center gap-3">
                <div className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9ee] p-[4px] shadow-[inset_3px_3px_7px_#c3c5ca,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                  <div className="absolute inset-[4px] flex items-center justify-center rounded-full bg-[#dfe1e6] dark:bg-[#292c35]">
                    <span className="text-[13px] font-semibold text-[#ff6846]">
                      {activeTrip.driver_name?.charAt(0)?.toUpperCase() || "D"}
                    </span>
                  </div>
                  {activeTrip.driver_profile_image && (
                    <img
                      src={
                        activeTrip.driver_profile_image.startsWith("http")
                          ? activeTrip.driver_profile_image
                          : `${API_URL}/uploads/${activeTrip.driver_profile_image}`
                      }
                      alt=""
                      className="absolute inset-[4px] h-[40px] w-[40px] rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">
                    {activeTrip.driver_name || "Your driver"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-[#777a81] dark:text-[#aeb1bd]">
                    {[activeTrip.vehicle_color, activeTrip.vehicle_type]
                      .filter(Boolean)
                      .join(" ") || "Vehicle assigned"}
                  </p>
                  <p className="mt-0.5 text-[9px] font-bold text-[#a0a3a9] dark:text-[#aeb1bd]">
                    {activeTrip.license_plate || ""}
                  </p>
                </div>

                {activeTrip.average_rating && (
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[12px] text-[#ff6846]">★</span>
                      <span className="text-[12px] font-semibold">
                        {Number(activeTrip.average_rating).toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-[#a0a3a9] dark:text-[#aeb1bd]">
                      Driver
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-[17px] bg-[#e7e9ee] px-4 py-3.5 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                <RoutePoint
                  type="pickup"
                  label="Pickup"
                  value={activeTrip.pickup_address || "Pickup"}
                />
                <div className="ml-[5px] h-4 border-l border-dashed border-[#b5b8be] dark:border-[#525662]" />
                <RoutePoint
                  type="destination"
                  label="Destination"
                  value={activeTrip.dropoff_address || "Destination"}
                />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a9da3] dark:text-[#aeb1bd]">
                    Your fare
                  </p>

                  <p className="mt-0.5 text-[18px] font-semibold">
                    R
                    {Number(
                      activeTrip.passenger_amount ??
                        activeTrip.fare_amount ??
                        0,
                    ).toFixed(0)}
                  </p>
                </div>

                {Number(activeTrip.discount_amount || 0) > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-[#ff6846]">
                      {activeTrip.promo_code || "Promo"}: -R
                      {Number(activeTrip.discount_amount).toFixed(0)}
                    </p>

                    <p className="mt-0.5 text-[8px] font-semibold text-[#9a9da3] dark:text-[#aeb1bd]">
                      Original fare R
                      {Number(activeTrip.fare_amount || 0).toFixed(0)}
                    </p>
                  </div>
                )}
              </div>
              <div
                className={`mt-4 grid ${activeTrip.driver_phone ? "grid-cols-2" : "grid-cols-1"} gap-3`}
              >
                {driverLocation &&
                  driverLocation.driver_lat &&
                  driverLocation.driver_lng &&
                  driverLocation.pickup_lat &&
                  driverLocation.pickup_lng && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/passenger?booking=${activeTrip.id}`)
                      }
                      className="rounded-[14px] bg-[#17191f] py-3 text-[10px] font-semibold text-white transition active:scale-[0.98] dark:bg-[#292c35]"
                    >
                      Track driver
                    </button>
                  )}

                {activeTrip.driver_phone && (
                  <a
                    href={`https://wa.me/27${String(activeTrip.driver_phone)
                      .replace(/\D/g, "")
                      .replace(/^0/, "")}?text=${encodeURIComponent(
                      `Hi, this is your RouteX passenger for booking BK-${String(activeTrip.id).padStart(4, "0")}.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-[14px] bg-[#e7e9ee] py-3 text-[10px] font-semibold text-[#ff6846] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
                  >
                    Contact driver
                  </a>
                )}
              </div>

              {/* SCHEDULED RIDE PICKUP CONFIRMATION */}
              {activeScheduledRide && (
                <>
                  {!activeScheduledRide.pickup_location_confirmed_at ? (
                    <div className="mt-4 rounded-[17px] bg-white p-4 shadow-[5px_5px_12px_rgba(0,0,0,0.08),-5px_-5px_12px_rgba(255,255,255,1)] dark:bg-[#22252e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]">
                      <p className="text-[11px] font-semibold text-[#17191f] dark:text-[#f5f5f7]">
                        Confirm your pickup location
                      </p>

                      <p className="mt-1 text-[9px] font-medium leading-relaxed text-[#85888f] dark:text-[#aeb1bd]">
                        When you are at your pickup point, confirm your location
                        so your driver can navigate directly to you.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          confirmScheduledPickupLocation(activeScheduledRide.id)
                        }
                        className="mt-3 w-full rounded-[14px] bg-[#ff6846] py-3 text-[10px] font-semibold text-white transition active:scale-[0.98]"
                      >
                        Confirm pickup location
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[17px] bg-white p-4 text-center shadow-[inset_3px_3px_7px_rgba(0,0,0,0.06),inset_-3px_-3px_7px_rgba(255,255,255,1)] dark:bg-[#22252e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                      <p className="text-[11px] font-semibold text-[#17191f] dark:text-[#f5f5f7]">
                        ✓ Pickup location confirmed
                      </p>

                      <p className="mt-1 text-[9px] font-medium text-[#85888f] dark:text-[#aeb1bd]">
                        Your driver will use this location for navigation.
                      </p>
                    </div>
                  )}
                </>
              )}
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
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#ff6846]">
                      {liveScheduled.some((ride) =>
                        ["accepted", "in progress"].includes(
                          String(ride.trip_status || ride.booking_status || "")
                            .trim()
                            .toLowerCase(),
                        ),
                      )
                        ? "Active"
                        : "Upcoming"}
                    </p>
                    <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.035em]">
                      {liveScheduled.some(
                        (ride) =>
                          String(ride.trip_status || ride.booking_status || "")
                            .trim()
                            .toLowerCase() === "in progress",
                      )
                        ? "Trip in progress"
                        : liveScheduled.some(
                              (ride) =>
                                String(
                                  ride.trip_status || ride.booking_status || "",
                                )
                                  .trim()
                                  .toLowerCase() === "accepted",
                            )
                          ? "Driver assigned"
                          : "Upcoming rides"}
                    </h3>
                  </div>

                  {liveScheduled.length > 0 && (
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#17191f] px-2 text-[9px] font-semibold text-white dark:bg-[#292c35]">
                      {liveScheduled.length}
                    </span>
                  )}
                </div>

                {scheduledLoading ? (
                  <div className="mt-4 rounded-[21px] bg-[#e7e9ee] px-4 py-5 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                    <p className="text-[10px] font-bold text-[#8d9097] dark:text-[#aeb1bd]">
                      Loading ride...
                    </p>
                  </div>
                ) : liveScheduled.length === 0 ? (
                  <div className="rx-surface mt-4 p-5">
                    <p className="text-[14px] font-semibold">No upcoming rides</p>
                    <p className="mt-2 text-[13px] text-[#7e8ba0] dark:text-[#a7b0bd]">Scheduled rides will appear here when booked.</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {liveScheduled.map((ride) => {
                      const state = String(
                        ride.trip_status || ride.booking_status || "Scheduled",
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
                          className="rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#ff6846] text-white shadow-[3px_3px_7px_#c2c4c9,-3px_-3px_7px_#ffffff] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]">
                                <ClockIcon />
                              </div>
                              <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#96999f] dark:text-[#aeb1bd]">
                                  Pickup time
                                </p>
                                <p className="mt-1 text-[14px] font-semibold">
                                  {dateText} · {timeText}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1.5 text-[8px] font-semibold text-white ${
                                isInProgress ? "bg-[#ff6846]" : "bg-[#17191f]"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-4 rounded-[17px] bg-[#e7e9ee] px-4 py-3.5 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                            <RoutePoint
                              type="pickup"
                              label="Pickup"
                              value={ride.pickup_address}
                            />
                            <div className="ml-[5px] h-4 border-l border-dashed border-[#b5b8be] dark:border-[#525662]" />
                            <RoutePoint
                              type="destination"
                              label="Destination"
                              value={ride.dropoff_address}
                            />
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a9da3] dark:text-[#aeb1bd]">
                                Fare
                              </p>
                              <p className="mt-0.5 text-[16px] font-semibold">
                                R
                                {Number(
                                  ride.passenger_amount ??
                                    ride.fare_amount ??
                                    0,
                                ).toFixed(0)}
                              </p>

                              {Number(ride.discount_amount || 0) > 0 && (
                                <div className="mt-1">
                                  <p className="text-[9px] font-bold text-[#ff6846]">
                                    {ride.promo_code || "Promo"}: -R
                                    {Number(ride.discount_amount).toFixed(0)}
                                  </p>

                                  <p className="text-[8px] font-semibold text-[#9a9da3] dark:text-[#aeb1bd]">
                                    Original fare R
                                    {Number(ride.fare_amount || 0).toFixed(0)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {(isScheduled || isWaiting) && (
                              <div className="max-w-[190px] text-right">
                                <p className="text-[9px] font-bold text-[#85888f] dark:text-[#aeb1bd]">
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
                            <div className="mt-4 flex items-center gap-3 rounded-[17px] bg-[#17191f] p-3 text-white dark:bg-[#292c35]">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2a2d34] dark:bg-[#30343f]">
                                {ride.driver_profile_image ? (
                                  <img
                                    src={ride.driver_profile_image}
                                    alt={ride.driver_name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[15px] font-semibold text-[#ff6846]">
                                    {ride.driver_name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#ff6846]">
                                  {isInProgress
                                    ? "Your driver"
                                    : "Driver assigned"}
                                </p>

                                <p className="mt-0.5 truncate text-[12px] font-semibold">
                                  {ride.driver_name}
                                </p>

                                <p className="mt-0.5 truncate text-[9px] font-semibold text-white/65">
                                  {[
                                    ride.vehicle_color,
                                    ride.vehicle_type,
                                    ride.license_plate,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>

                                {ride.driver_phone && (
                                  <a
                                    href={`tel:${ride.driver_phone}`}
                                    className="mt-2 inline-flex rounded-[10px] bg-[#ff6846] px-3 py-2 text-[9px] font-semibold text-white"
                                  >
                                    Call driver
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {isAccepted && !ride.pickup_location_confirmed_at && (
                            <div className="mt-4 rounded-[17px] bg-[#e7e9ee] p-4 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                              <p className="text-[10px] font-semibold text-[#17191f] dark:text-[#f5f5f7]">
                                Confirm your pickup location
                              </p>

                              <p className="mt-1 text-[9px] font-medium leading-relaxed text-[#85888f] dark:text-[#aeb1bd]">
                                When you are at your pickup point, confirm your
                                location so your driver can navigate directly to
                                you.
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  confirmScheduledPickupLocation(ride.id)
                                }
                                className="mt-3 w-full rounded-[14px] bg-[#ff6846] py-3 text-[10px] font-semibold text-white transition active:scale-[0.98]"
                              >
                                Confirm pickup location
                              </button>
                            </div>
                          )}

                          {isAccepted && ride.pickup_location_confirmed_at && (
                            <div className="mt-4 rounded-[17px] bg-[#e7e9ee] p-4 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                              <p className="text-[10px] font-semibold text-[#17191f] dark:text-[#f5f5f7]">
                                Pickup location confirmed
                              </p>

                              <p className="mt-1 text-[9px] font-medium text-[#85888f] dark:text-[#aeb1bd]">
                                Your driver will use your confirmed location for
                                navigation.
                              </p>
                            </div>
                          )}
                          {(isScheduled || isWaiting) && (
                            <button
                              type="button"
                              disabled={cancellingRideId === ride.id}
                              onClick={() => cancelScheduledRide(ride.id)}
                              className="mt-4 w-full rounded-[14px] bg-[#e7e9ee] py-3 text-[10px] font-semibold text-[#ff6846] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] transition active:scale-[0.98] disabled:opacity-50 dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
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
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8f9298] dark:text-[#aeb1bd]">
              Other rides
            </p>
            <div className="mt-3 space-y-3">
              {otherTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-[18px] bg-[#e7e9ee] px-4 py-4 shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#96999f] dark:text-[#aeb1bd]">
                      BK-{String(trip.id).padStart(4, "0")}
                    </span>
                    <span className="text-[9px] font-semibold text-[#777a81] dark:text-[#aeb1bd]">
                      {trip.trip_status}
                    </span>
                  </div>
                  <p className="mt-3 truncate text-[10px] font-bold">
                    {trip.pickup_address}
                  </p>
                  <p className="mt-2 truncate text-[10px] font-bold">
                    {trip.dropoff_address}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        </>}
        {portalView === "rides" && <>
        <section className="mt-9">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8f9298] dark:text-[#aeb1bd]">
              Your rides
            </p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.035em]">
              Ride history
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowCompletedTrips((current) => !current)}
            className="mt-4 flex w-full items-center justify-between rounded-[19px] bg-[#e7e9ee] px-4 py-4 text-left shadow-[5px_5px_11px_#c4c6ca,-5px_-5px_11px_#ffffff] transition active:scale-[0.985] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e7e9ee] text-[#ff6846] shadow-[inset_3px_3px_6px_#c4c6ca,inset_-3px_-3px_6px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                <HistoryIcon />
              </div>
              <div>
                <p className="text-[12px] font-semibold">Completed trips</p>
                <p className="mt-0.5 text-[9px] font-medium text-[#92959b] dark:text-[#aeb1bd]">
                  View your previous RouteX rides
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff6846] px-2 text-[9px] font-semibold text-white">
                {completedTrips.length}
              </div>
              <div
                className={`transition-transform duration-200 ${showCompletedTrips ? "rotate-180" : ""}`}
              >
                <ChevronIcon />
              </div>
            </div>
          </button>

          {showCompletedTrips && (
            <div className="mt-4 space-y-3">
              {completedTrips.length === 0 ? (
                <div className="rounded-[18px] bg-[#e7e9ee] px-4 py-5 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                  <p className="text-[11px] font-bold text-[#85888f] dark:text-[#aeb1bd]">
                    No completed trips yet.
                  </p>
                </div>
              ) : (
                completedTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="rounded-[18px] bg-[#e7e9ee] px-4 py-4 shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[#96999f] dark:text-[#aeb1bd]">
                        {trip.travel_date
                          ? new Date(trip.travel_date).toLocaleDateString()
                          : `BK-${String(trip.id).padStart(4, "0")}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <CheckSmallIcon />
                        <span className="text-[8px] font-semibold text-[#777a81] dark:text-[#aeb1bd]">
                          Completed
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center">
                      <div className="mr-3 flex w-3 shrink-0 flex-col items-center">
                        <span className="h-2 w-2 rounded-full bg-[#17191f] dark:bg-[#292c35]" />
                        <span className="my-1 h-4 border-l border-dashed border-[#b9bbc0]" />
                        <span className="h-2 w-2 rounded-[2px] bg-[#ff6846]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-bold">
                          {trip.pickup_address}
                        </p>
                        <p className="mt-2 truncate text-[10px] font-bold">
                          {trip.dropoff_address}
                        </p>
                      </div>
                      <p className="ml-3 text-[11px] font-semibold">
                        R
                        {Number(
                          trip.passenger_amount ?? trip.fare_amount ?? 0,
                        ).toFixed(2)}
                      </p>
                    </div>

                    {(trip.driver_name || trip.vehicle_type) && (
                      <div className="mt-4 border-t border-[#d5d7dc] pt-3">
                        <p className="text-[9px] font-semibold text-[#777a81] dark:text-[#aeb1bd]">
                          {trip.driver_name || "Driver"}
                          {trip.vehicle_type
                            ? ` • ${trip.vehicle_color || ""} ${trip.vehicle_type}`
                            : ""}
                        </p>
                      </div>
                    )}

                    {!trip.has_reviewed && !reviewedTrips[trip.id] && (
                      <div className="mt-4 rounded-[15px] bg-[#e7e9ee] p-3 shadow-[inset_3px_3px_6px_#c7c9ce,inset_-3px_-3px_6px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#ff6846]">
                          Rate your driver
                        </p>
                        <div className="mt-2 flex items-center gap-1">
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
                            setReviewTexts((prev) => ({
                              ...prev,
                              [trip.id]: e.target.value,
                            }))
                          }
                          placeholder="Tell us about your trip (optional)"
                          rows={2}
                          className="mt-3 w-full resize-none rounded-[12px] bg-[#e7e9ee] px-3 py-2.5 text-[10px] outline-none shadow-[inset_2px_2px_5px_#c7c9ce,inset_-2px_-2px_5px_#ffffff] dark:bg-[#17191e] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.035)]"
                        />
                        <button
                          type="button"
                          disabled={
                            submittingReview === trip.id ||
                            !reviewRatings[trip.id]
                          }
                          onClick={() => submitDriverReview(trip)}
                          className="mt-3 w-full rounded-[12px] bg-[#ff6846] py-2.5 text-[9px] font-semibold text-white disabled:opacity-40"
                        >
                          {submittingReview === trip.id
                            ? "Submitting..."
                            : "Submit review"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        </>}
        {portalView === "deliveries" && <section className="mt-4">
          <h2 className="mb-5 text-xl font-semibold">Completed deliveries</h2>
          {packageDeliveries.filter((d) => String(d.status || "").toLowerCase() === "delivered").length === 0 ? <div className="rx-inset p-5 text-sm text-[#7c8797] dark:text-[#a7b0bd]">No completed deliveries yet.</div> : packageDeliveries.filter((d) => String(d.status || "").toLowerCase() === "delivered").map((delivery) => <article key={delivery.id} className="rx-surface mb-4 p-5"><p className="font-semibold">Package #{delivery.id}</p><p className="mt-3 text-sm">{compactDeliveryAddress(delivery.pickup_address)} → {compactDeliveryAddress(delivery.dropoff_address)}</p><p className="mt-2 text-xs text-[#7c8797] dark:text-[#a7b0bd]">Delivered · R{Number(delivery.fare_amount || 0).toFixed(2)}</p></article>)}
        </section>}
        <section className="mt-9 border-t border-[#d2d4d9] pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold">
                Need help with a ride?
              </p>
              <p className="mt-1 text-[9px] font-medium text-[#92959b] dark:text-[#aeb1bd]">
                RouteX support is here to help.
              </p>
            </div>
            <a
              href="https://wa.me/27799132513"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[12px] bg-[#e7e9ee] px-4 py-2.5 text-[9px] font-semibold text-[#ff6846] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] dark:bg-[#17191e] dark:shadow-[6px_6px_14px_rgba(0,0,0,0.48),-5px_-5px_12px_rgba(255,255,255,0.035)]"
            >
              Support
            </a>
          </div>
        </section>

        <footer className="mt-8 text-center">
          <p className="text-[9px] font-semibold text-[#a0a3a9] dark:text-[#aeb1bd]">
            RouteX • Getting Upington Moving
          </p>
        </footer>
        </div>
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
        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a9da3] dark:text-[#aeb1bd]">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[11px] font-semibold">{value}</p>
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
      className="text-[#85888f] dark:text-[#aeb1bd]"
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
