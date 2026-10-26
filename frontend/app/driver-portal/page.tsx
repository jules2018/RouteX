"use client";

import { useEffect, useState } from "react";

import AuthGuard from "../components/AuthGuard";
import LogoutButton from "../components/LogoutButton";
import { showNotification } from "../lib/notifications";
import { API_URL } from "../lib/api";

export default function DriverPortalPage() {
  const [status, setStatus] = useState<"available" | "offline">("available");
  const [driver, setDriver] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<any[]>([]);
  const [deliveryBusyId, setDeliveryBusyId] = useState<number | null>(null);
  const [deliveryPins, setDeliveryPins] = useState<Record<number, string>>({});
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [scheduledRides, setScheduledRides] = useState<any[]>([]);
  const [liveRequests, setLiveRequests] = useState<any[]>([]);
  const [acceptedTrips, setAcceptedTrips] = useState<any[]>([]);
  const [inProgressTrips, setInProgressTrips] = useState<any[]>([]);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [earningsMonths, setEarningsMonths] = useState<Array<{
    month: string; trips: number; gross_fares: string;
    passenger_portion: string; promo_portion: string;
  }>>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [earningsError, setEarningsError] = useState(false);
  const [showEarningsHistory, setShowEarningsHistory] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [showRecentTrips, setShowRecentTrips] = useState(false);
  const [driverSidebar, setDriverSidebar] = useState<"dashboard" | "earnings" | "trips" | "deliveries" | "profile" | null>(null);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [portalDark, setPortalDark] = useState(false);
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
  const [driverRating, setDriverRating] = useState<{
    average_rating: number | null;
    review_count: number;
  }>({
    average_rating: null,
    review_count: 0,
  });
  const [driverReviews, setDriverReviews] = useState<any[]>([]);
  const [appPopup, setAppPopup] = useState<{
    title: string;
    message: string;
    tone?: "info" | "success" | "error";
  } | null>(null);

  const showAppPopup = (
    title: string,
    message: string,
    tone: "info" | "success" | "error" = "info",
  ) => setAppPopup({ title, message, tone });

  const uploadDriverPhoto = async (file: File) => {
    if (!driver?.id || !file) return;

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("driverId", String(driver.id));

      const token = sessionStorage.getItem("driverToken");

const response = await fetch(`${API_URL}/driver/upload-photo`, {
  method: "POST",
  headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: formData,
});
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not upload driver photo.");
      }

      const imageUrl = data?.image || data?.driver?.profile_image;

      if (!imageUrl) {
        throw new Error("The photo uploaded, but no image URL was returned.");
      }

      const updatedDriver = {
        ...driver,
        profile_image: imageUrl,
      };

      setDriver(updatedDriver);
      localStorage.setItem("driver", JSON.stringify(updatedDriver));
    } catch (error: any) {
      console.error("DRIVER PHOTO UPLOAD ERROR:", error);
      showAppPopup(
        "RouteX",
        error?.message || "Could not upload driver photo.",
        "error",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const loadDriverRating = async (driverId: number) => {
    try {
      const response = await fetch(`${API_URL}/drivers/${driverId}/rating`);
      if (!response.ok) return;

      const data = await response.json();
      setDriverRating({
        average_rating:
          data.average_rating !== null ? Number(data.average_rating) : null,
        review_count: Number(data.review_count) || 0,
      });
    } catch (error) {
      console.error("DRIVER RATING ERROR:", error);
    }
  };

  const loadDriverReviews = async (driverId: number) => {
    try {
      const response = await fetch(`${API_URL}/drivers/${driverId}/reviews`);
      if (!response.ok) return;

      const data = await response.json();
      setDriverReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("DRIVER REVIEWS ERROR:", error);
    }
  };

  const loadDriverEarnings = async () => {
    try {
      const token = sessionStorage.getItem("driverToken");
      if (!token) throw new Error("Driver login required");
      const response = await fetch(`${API_URL}/drivers/me/earnings`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Earnings unavailable");
      const data = await response.json();
      setEarningsMonths(Array.isArray(data.months) ? data.months : []);
      setEarningsError(false);
    } catch (error) {
      console.error("DRIVER EARNINGS LOAD ERROR:", error);
      setEarningsError(true);
    } finally {
      setEarningsLoading(false);
    }
  };

  const loadPackageDeliveries = async () => {
    const token = sessionStorage.getItem("driverToken");
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [availableResponse, mineResponse] = await Promise.all([
        fetch(`${API_URL}/driver/package-deliveries/available`, { headers, cache: "no-store" }),
        fetch(`${API_URL}/driver/package-deliveries/mine`, { headers, cache: "no-store" }),
      ]);
      if (!availableResponse.ok || !mineResponse.ok) {
        throw new Error("Unable to load package deliveries.");
      }
      const [available, mine] = await Promise.all([
        availableResponse.json(), mineResponse.json(),
      ]);
      setAvailableDeliveries(Array.isArray(available) ? available : []);
      setMyDeliveries(Array.isArray(mine) ? mine : []);
    } catch (error) {
      console.error("PACKAGE DELIVERY LOAD ERROR:", error);
    } finally {
      setDeliveryLoading(false);
    }
  };

  const changeDeliveryStatus = async (
    deliveryId: number,
    action: "accept" | "collect" | "in-transit" | "complete",
  ) => {
    const token = sessionStorage.getItem("driverToken");
    if (!token) {
      showAppPopup("Sign in required", "Please sign in again.", "error");
      return;
    }
    try {
      setDeliveryBusyId(deliveryId);
      const response = await fetch(`${API_URL}/driver/package-deliveries/${deliveryId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(action === "complete" ? { delivery_pin: deliveryPins[deliveryId] || "" } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Unable to update delivery.");
      if (action === "complete") {
        setDeliveryPins((previous) => ({ ...previous, [deliveryId]: "" }));
      }
      await loadPackageDeliveries();
      await loadDriverRides(Number(driver?.id));
      showAppPopup("Package delivery", action === "complete" ? "Delivery completed. PIN verified." : "Delivery updated successfully.", "success");
    } catch (error: any) {
      showAppPopup("Package delivery", error?.message || "Unable to update delivery.", "error");
    } finally {
      setDeliveryBusyId(null);
    }
  };

  const navigateDelivery = (delivery: any, destination: "pickup" | "dropoff") => {
    const lat = Number(destination === "pickup" ? delivery.pickup_lat : delivery.dropoff_lat);
    const lng = Number(destination === "pickup" ? delivery.pickup_lng : delivery.dropoff_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180 ||
        (lat === 0 && lng === 0)) {
      showAppPopup("Navigation unavailable", "This delivery has no valid GPS coordinates.", "error");
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank", "noopener,noreferrer");
  };

  const loadDriverRides = async (driverId: number) => {
    try {
      const [
        scheduledResponse,
        requestsResponse,
        acceptedResponse,
        inProgressResponse,
        completedResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/scheduled-rides`, { cache: "no-store" }),
        fetch(`${API_URL}/trip-requests`, { cache: "no-store" }),
        fetch(`${API_URL}/accepted-trips`, { cache: "no-store" }),
        fetch(`${API_URL}/in-progress-trips`, { cache: "no-store" }),
        fetch(`${API_URL}/completed-trips`, { cache: "no-store" }),
      ]);

      const [
        scheduledData,
        requestsData,
        acceptedData,
        inProgressData,
        completedData,
      ] = await Promise.all([
        scheduledResponse.json(),
        requestsResponse.json(),
        acceptedResponse.json(),
        inProgressResponse.json(),
        completedResponse.json(),
      ]);

      if (scheduledResponse.ok) {
        setScheduledRides(Array.isArray(scheduledData) ? scheduledData : []);
      }

      if (requestsResponse.ok) {
        setLiveRequests(Array.isArray(requestsData) ? requestsData : []);
      }

      if (acceptedResponse.ok) {
        setAcceptedTrips(
          (Array.isArray(acceptedData) ? acceptedData : []).filter(
            (ride: any) => Number(ride.assigned_driver_id) === Number(driverId),
          ),
        );
      }

      if (inProgressResponse.ok) {
        setInProgressTrips(
          (Array.isArray(inProgressData) ? inProgressData : []).filter(
            (ride: any) => Number(ride.assigned_driver_id) === Number(driverId),
          ),
        );
      }

      if (completedResponse.ok) {
        setCompletedTrips(
          (Array.isArray(completedData) ? completedData : [])
            .filter(
              (ride: any) =>
                Number(ride.assigned_driver_id) === Number(driverId),
            )
            .slice(0, 5),
        );
      }
    } catch (error) {
      console.error("DRIVER RIDES LOAD ERROR:", error);
    } finally {
      setLoadingScheduled(false);
    }
  };

 useEffect(() => {
    const storedDriver = localStorage.getItem("driver");
    const driverToken = sessionStorage.getItem("driverToken");

    if (!storedDriver || !driverToken) {
      localStorage.removeItem("driver");
      sessionStorage.removeItem("driverToken");
      window.location.replace("/driver-login");
      return;
    }

    try {
      const parsedDriver = JSON.parse(storedDriver);
      setDriver(parsedDriver);

      loadDriverRides(Number(parsedDriver.id));
      void loadPackageDeliveries();
      void loadDriverEarnings();
      loadDriverRating(Number(parsedDriver.id));
      loadDriverReviews(Number(parsedDriver.id));

      fetch(`${API_URL}/driver-list`)
        .then((res) => res.json())
        .then((data) => {
          const currentDriver = Array.isArray(data)
            ? data.find(
                (item: any) => Number(item.id) === Number(parsedDriver.id),
              )
            : null;

          setStatus(
            currentDriver?.status === "Available" ? "available" : "offline",
          );
        })
        .catch((error) => console.error("DRIVER STATUS LOAD ERROR:", error));

      const interval = setInterval(() => {
        loadDriverRides(Number(parsedDriver.id));
        void loadPackageDeliveries();
      }, 5000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("DRIVER STORAGE ERROR:", error);
    }
  }, []);

  /* =========================
     LIVE DRIVER GPS TRACKING
  ========================= */

  useEffect(() => {
    if (!driver?.id || status !== "available") return;

    const sendHeartbeat = async () => {
      try {
        const token = sessionStorage.getItem("driverToken");

await fetch(`${API_URL}/drivers/${driver.id}/heartbeat`, {
  method: "POST",
  headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});
      } catch (error) {
        console.error("DRIVER HEARTBEAT ERROR:", error);
      }
    };

    sendHeartbeat();

    const interval = window.setInterval(sendHeartbeat, 30000);

    return () => window.clearInterval(interval);
  }, [driver?.id, status]);

  useEffect(() => {
    if (!driver?.id || status !== "available") return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        setDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        try {
          const token = sessionStorage.getItem("driverToken");

await fetch(`${API_URL}/drivers/${driver.id}/location`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  }),
});
        } catch (error) {
          console.error("DRIVER LOCATION UPDATE ERROR:", error);
        }
      },

      (error) => {
        console.error("DRIVER GPS WATCH ERROR:", {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT,
        });
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driver?.id, status]);

  const toggleStatus = async () => {
    if (!driver?.id) return;

    const newStatus = status === "available" ? "Offline" : "Available";

    try {
      let latitude = null;
      let longitude = null;

      if (newStatus === "Available") {
        if (!navigator.geolocation) {
          showAppPopup(
            "Location required",
            "RouteX needs your location before you can go online.",
            "error",
          );
          return;
        }

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          },
        );

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

   const token = sessionStorage.getItem("driverToken");

const response = await fetch(`${API_URL}/drivers/${driver.id}/status`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({
    status: newStatus,
    current_lat: latitude,
    current_lng: longitude,
  }),
});

      if (!response.ok) {
        throw new Error("Unable to update driver status.");
      }

      setStatus(newStatus === "Available" ? "available" : "offline");
    } catch (error) {
      console.error("DRIVER STATUS ERROR:", error);
      showAppPopup(
        "Unable to change status",
        newStatus === "Available"
          ? "RouteX needs your location before you can go online."
          : "Unable to update your status.",
        "error",
      );
    }
  };

  const acceptRide = async (rideId: number) => {
    if (!driver?.id) return;

    try {
      setAcceptingId(rideId);

      const token = sessionStorage.getItem("driverToken");

const response = await fetch(
  `${API_URL}/trip-requests/${rideId}/accept`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ driverId: driver.id }),
  },
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not accept this ride.");
      }

      showNotification(
        "Trip Accepted",
        "The ride has been added to your active trips.",
      );
      await loadDriverRides(driver.id);
    } catch (error: any) {
      console.error("ACCEPT RIDE ERROR:", error);
      showAppPopup(
        "RouteX",
        error?.message || "Could not accept this ride.",
        "error",
      );
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    const clock = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(clock);
  }, []);

  const startRide = async (rideId: number) => {
    if (!driver?.id) return;

    try {
      setStartingId(rideId);

      const token = sessionStorage.getItem("driverToken");

const response = await fetch(`${API_URL}/trip-requests/${rideId}/start`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ driverId: driver.id }),
});

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not start this ride.");
      }

      await loadDriverRides(driver.id);
    } catch (error: any) {
      console.error("START RIDE ERROR:", error);
      showAppPopup(
        "RouteX",
        error?.message || "Could not start this ride.",
        "error",
      );
    } finally {
      setStartingId(null);
    }
  };

  const completeRide = async (rideId: number) => {
    if (!driver?.id) return;

    try {
      setCompletingId(rideId);

      const token = sessionStorage.getItem("driverToken");

const response = await fetch(
  `${API_URL}/trip-requests/${rideId}/complete`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ driverId: driver.id }),
  },
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not complete this ride.");
      }

      await loadDriverRides(driver.id);
      await loadDriverEarnings();
    } catch (error: any) {
      console.error("COMPLETE RIDE ERROR:", error);
      showAppPopup(
        "RouteX",
        error?.message || "Could not complete this ride.",
        "error",
      );
    } finally {
      setCompletingId(null);
    }
  };

  // Compact display only; original addresses remain unchanged for GPS/navigation.
  const shortDeliveryAddress = (value: unknown) => {
    const parts = String(value || "Address unavailable").split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length <= 3) return parts.join(", ");
    const upington = parts.findIndex((part) => /^Upington$/i.test(part));
    if (upington >= 0) return parts.slice(0, upington + 1).join(", ");
    return parts.slice(0, 3).join(", ");
  };

  const formatRideDate = (value: string) =>
    new Date(value).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
    });

  const formatRideTime = (value: string) =>
    new Date(value).toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  return (
    <AuthGuard>
      <main className="min-h-[100dvh] bg-[#e9edf4] dark:bg-[#262b34] text-[#17191f] dark:text-[#f5f6f8]">
        <div className="mx-auto min-h-[100dvh] w-full max-w-[790px] px-5 pb-10">
          {/* FULL-WIDTH DRIVER HERO — matches passenger portal */}
          <header className="relative -mx-5 overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#172c42] via-[#253e57] to-[#d9674d] px-5 pb-5 pt-4 text-white shadow-[0_14px_30px_rgba(30,39,53,0.20)]">
            <div className="relative z-10 flex items-center justify-between gap-2">
              <button type="button" aria-label="Open driver menu" onClick={() => setDriverSidebar("dashboard")} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/10 shadow-[3px_3px_9px_#1115,inset_1px_1px_2px_#fff4]">
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              </button>
              <span className="text-[15px] font-semibold tracking-[.15em]">ROUTE<span className="text-[#ff987f]">X</span></span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={togglePortalTheme} aria-label="Switch between light and dark mode" aria-pressed={portalDark} className="relative h-[34px] w-[64px] shrink-0 rounded-full bg-[#e4e8ee] shadow-[inset_3px_3px_6px_#aab0bc,inset_-3px_-3px_6px_#fff]">
                  <span className="absolute left-[9px] top-[7px] text-sm text-[#f59a40]">☀</span><span className="absolute right-[9px] top-[7px] text-sm text-[#657084]">☾</span>
                  <span className={`absolute top-1 left-1 grid h-[26px] w-[26px] place-items-center rounded-full bg-white text-[#f28c3f] shadow-md transition-transform ${portalDark ? "translate-x-[30px]" : ""}`}>{portalDark ? "☾" : "☀"}</span>
                </button>
                <div className="flex flex-col items-center">
                  <div className="relative h-[108px] w-[108px]">
                    <label htmlFor="routex-driver-photo" className="absolute inset-0 block cursor-pointer rounded-full border-[4px] border-white bg-[#e9edf4] p-1 shadow-[6px_7px_16px_rgba(9,21,37,.48),-3px_-3px_10px_rgba(255,255,255,.24)]" title="Change driver profile photo">
                      <span className="block h-full w-full overflow-hidden rounded-full bg-[#e9edf4] shadow-[inset_3px_3px_7px_#bbc2cf,inset_-3px_-3px_7px_#ffffff]">
                        {driver?.profile_image ? <img src={driver.profile_image} alt={driver?.full_name || "Driver"} className="h-full w-full object-cover"/> : <span className="grid h-full w-full place-items-center text-2xl font-semibold text-[#d9674d]">{driver?.full_name?.charAt(0)?.toUpperCase() || "D"}</span>}
                      </span>
                    </label>
                    <input id="routex-driver-photo" type="file" accept="image/*" disabled={uploadingPhoto} className="sr-only" onChange={(event) => {const file=event.target.files?.[0];if(file) void uploadDriverPhoto(file);event.currentTarget.value="";}}/>
                    <span title={status === "available" ? "Online" : "Offline"} className={`absolute bottom-1 right-1 z-10 h-3 w-3 rounded-full border-2 border-white shadow-[1px_2px_5px_rgba(0,0,0,.25)] ${status === "available" ? "bg-[#31bf78]" : "bg-[#9ca5b4]"}`} />
                  </div>
                  <span className="mt-1 text-xs text-white/85">{uploadingPhoto ? "Uploading…" : "Profile"}</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-2">
              <h1 className="text-[35px] font-semibold leading-tight tracking-[-.045em] sm:text-[39px]">Hi, {driver?.full_name?.trim()?.split(/\s+/)?.[0] || "Driver"}</h1>
              <p className="mt-1.5 flex items-center gap-2 text-xs text-white/85"><span className="text-[#ffb39b]">★</span>{driverRating.average_rating !== null ? driverRating.average_rating.toFixed(1) : "New driver"}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-3 rounded-[19px] border border-white/25 bg-white/[.12] px-3.5 py-2.5 shadow-[5px_6px_12px_rgba(14,28,45,.26),-2px_-2px_6px_rgba(255,255,255,.12),inset_1px_1px_1px_rgba(255,255,255,.17)]">
                  <span className={`h-2 w-2 rounded-full ${status === "available" ? "bg-[#60e6a0]" : "bg-[#d1d6df]"}`} />
                  <span className="min-w-[40px] text-[12px] font-medium">{status === "available" ? "Online" : "Offline"}</span>
                  <button type="button" role="switch" aria-checked={status === "available"} aria-label="Toggle driver availability" onClick={toggleStatus} className={`relative h-[30px] w-[52px] rounded-full border border-white/20 shadow-[inset_3px_3px_6px_rgba(0,0,0,.26),inset_-2px_-2px_4px_rgba(255,255,255,.15)] transition-colors ${status === "available" ? "bg-[#ff6846]" : "bg-[#a7b0be]/75"}`}><span className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[2px_3px_5px_rgba(0,0,0,.26),inset_1px_1px_2px_#fff] transition-all ${status === "available" ? "left-[26px]" : "left-[3px]"}`} /></button>
                </div>
                <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-[12px] font-medium text-white [&_button]:text-white [&_a]:text-white"><LogoutButton /></div>
              </div>

            </div>
          </header>

          {/* PACKAGE DELIVERIES — separate from passenger rides */}
          <section className="mt-7">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">Extra earning opportunity</p>
            <h3 className="mt-1 text-[19px] font-semibold">Package deliveries</h3>
            <p className="mt-1 text-[10px] text-[#777b83] dark:text-[#b1b5c0]">Collect parcels, navigate to recipients and confirm delivery with their six-digit PIN.</p>
            {deliveryLoading && <p className="mt-3 text-[10px]">Loading deliveries...</p>}
            {myDeliveries.filter((d) => d.status !== "delivered" && d.status !== "cancelled").map((delivery) => (
              <article key={`mine-${delivery.id}`} className="mt-4 space-y-4 text-[#17191f] dark:text-white">
                <div className="flex items-start justify-between gap-3 rounded-[22px] bg-white p-5 shadow-[7px_7px_18px_rgba(30,48,74,.12),-6px_-6px_18px_rgba(255,255,255,.9)] dark:bg-[#252b35]">
                  <div>
                    <p className="text-[10px] uppercase text-[#666] dark:text-[#bec6d0]">Package delivery</p>
                    <h4 className="mt-1 text-[20px] font-semibold">PX-{String(delivery.id).padStart(4, "0")}</h4>
                    <p className="mt-1 text-[12px] text-[#666] dark:text-[#bec6d0]">{delivery.parcel_description || delivery.parcel_size || "Parcel"}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-[#eaf8ef] shadow-[3px_3px_7px_rgba(30,48,74,.1),-3px_-3px_7px_#ffffff] px-2.5 py-1 text-[12px] font-medium capitalize text-[#168745] dark:bg-[#214938] dark:text-[#8ce6af]">{String(delivery.status).replace(/_/g, " ")}</span>
                    <p className="mt-1 text-[20px] font-semibold">R{Number(delivery.fare_amount || 0).toFixed(0)}</p>
                  </div>
                </div>
                {delivery.delivery_type === "scheduled" && delivery.scheduled_pickup_at && (
                  <div className="mt-4 flex items-center gap-3 rounded-[19px] bg-white p-3 shadow-[inset_4px_4px_10px_rgba(30,48,74,.08),inset_-4px_-4px_10px_#ffffff]">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white text-[#ff6846] shadow-[4px_4px_10px_rgba(30,48,74,.14),-4px_-4px_10px_#ffffff] dark:bg-[#343b46] dark:text-[#d5d9df]">
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2"/></svg>
                    </span>
                    <div className="min-w-0 flex-1"><p className="text-[12px] text-[#666] dark:text-[#bec6d0]">Scheduled collection</p><p className="mt-1 text-[16px] font-semibold">{new Date(delivery.scheduled_pickup_at).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
                    <div className="shrink-0 text-right"><p className="text-[12px] text-[#666] dark:text-[#bec6d0]">Time</p><p className="mt-1 text-[19px] font-semibold text-[#ff6846] dark:text-white">{new Date(delivery.scheduled_pickup_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false })}</p></div>
                  </div>
                )}
                <div className="mt-4 rounded-[19px] bg-white px-4 py-3 shadow-[inset_4px_4px_10px_rgba(30,48,74,.09),inset_-4px_-4px_10px_#ffffff] dark:bg-[#343b46]">
                  <div className="flex items-start gap-3"><span className="mt-0.5 text-[20px] leading-none text-[#666] dark:text-[#d0d5dd]" aria-hidden="true">◉</span><div className="min-w-0"><p className="text-[11px] uppercase text-[#666] dark:text-[#bec6d0]">Collection</p><p className="mt-1 text-[15px] font-medium leading-5">{shortDeliveryAddress(delivery.pickup_address)}</p></div></div>
                  <div className="ml-[7px] my-2 h-5 border-l border-dashed border-[#d6d6d6] dark:border-[#697384]" />
                  <div className="flex items-start gap-3"><svg className="mt-0.5 shrink-0 text-[#ff4d42]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><div className="min-w-0"><p className="text-[11px] uppercase text-[#666] dark:text-[#bec6d0]">Destination</p><p className="mt-1 text-[15px] font-medium leading-5">{shortDeliveryAddress(delivery.dropoff_address)}</p></div></div>
                </div>
                {(delivery.recipient_name || delivery.recipient_phone) && (
                  <div className="mt-3 rounded-[19px] bg-white px-4 py-3 shadow-[inset_4px_4px_10px_rgba(30,48,74,.09),inset_-4px_-4px_10px_#ffffff] dark:bg-[#343b46]">
                    <div className="flex items-center gap-2"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg><h5 className="text-[15px] font-medium">Recipient details</h5></div>
                    <div className="mt-3 flex items-end justify-between gap-3"><div className="min-w-0"><p className="text-[16px] font-medium">{delivery.recipient_name || "Name unavailable"}</p>{delivery.recipient_phone && <p className="mt-1 text-[14px] text-[#777] dark:text-[#bec6d0]">{delivery.recipient_phone}</p>}</div>
                    {delivery.recipient_phone && <a href={`tel:${delivery.recipient_phone}`} aria-label="Call recipient" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#08a452] hover:bg-[#dff4e8] dark:hover:bg-[#29483b]"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 5.18 2 2 0 0 1 5.08 3h3a2 2 0 0 1 2 1.72l.4 2.81a2 2 0 0 1-.57 1.7L8.2 10.94a16 16 0 0 0 4.86 4.86l1.71-1.71a2 2 0 0 1 1.7-.57l2.81.4A2 2 0 0 1 22 16.92Z"/></svg></a>}</div>
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(delivery.status === "accepted" || delivery.status === "collected" || delivery.status === "in_transit") && <button type="button" onClick={() => navigateDelivery(delivery, delivery.status === "accepted" ? "pickup" : "dropoff")} className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-[18px] bg-[#202d40] shadow-[4px_6px_12px_rgba(30,48,74,.23)] px-2 py-3 text-[12px] font-semibold text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m21 3-8 18-2.5-7.5L3 11z"/></svg>{delivery.status === "accepted" ? "Navigate to collection" : "Navigate to recipient"}</button>}
                  {delivery.status === "accepted" && <button type="button" disabled={deliveryBusyId !== null} onClick={() => void changeDeliveryStatus(delivery.id, "collect")} className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-[18px] bg-[#ff6846] shadow-[4px_6px_12px_rgba(255,104,70,.23)] px-2 py-3 text-[12px] font-semibold text-white disabled:opacity-50"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 7 9-4 9 4-9 4-9-4ZM3 7v10l9 4 9-4V7M12 11v10M7 5l9 4"/></svg>{deliveryBusyId === delivery.id ? "Updating…" : "Confirm collected"}</button>}
                  {delivery.status === "collected" && <button type="button" disabled={deliveryBusyId !== null} onClick={() => void changeDeliveryStatus(delivery.id, "in-transit")} className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-[18px] bg-[#ff6846] shadow-[4px_6px_12px_rgba(255,104,70,.23)] px-2 py-3 text-[12px] font-semibold text-white disabled:opacity-50">{deliveryBusyId === delivery.id ? "Updating…" : "Start delivery"}</button>}
                </div>
                {(delivery.status === "collected" || delivery.status === "in_transit") && <div className="mt-3 rounded-[16px] bg-white p-4 shadow-[inset_4px_4px_10px_rgba(30,48,74,.09),inset_-4px_-4px_10px_#ffffff] dark:bg-[#343b46]">
                  <h5 className="text-[15px] font-semibold">Complete package delivery</h5><p className="mt-1 text-[12px] leading-5 text-[#666] dark:text-[#bec6d0]">Ask the recipient for the six-digit delivery PIN.</p>
                  <label className="mt-3 block text-[12px] font-medium" htmlFor={`delivery-pin-${delivery.id}`}>Recipient's delivery PIN</label>
                  <input id={`delivery-pin-${delivery.id}`} type="text" inputMode="numeric" autoComplete="off" maxLength={6} value={deliveryPins[delivery.id] || ""} onChange={(event) => setDeliveryPins((previous) => ({ ...previous, [delivery.id]: event.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="Enter six-digit PIN" className="mt-2 w-full rounded-[13px] border border-[#c7cdd7] bg-white px-4 py-3 text-[18px] tracking-[.25em] text-[#1c2533]" />
                  <button type="button" disabled={deliveryBusyId !== null || !/^\d{6}$/.test(deliveryPins[delivery.id] || "")} onClick={() => void changeDeliveryStatus(delivery.id, "complete")} className="mt-3 w-full rounded-[14px] bg-[#ff6846] shadow-[4px_6px_12px_rgba(255,104,70,.23)] px-2 py-3 text-[12px] font-semibold text-white disabled:opacity-50">{deliveryBusyId === delivery.id ? "Verifying…" : "Verify PIN & complete delivery"}</button>
                </div>}
              </article>
            ))}
            <h4 className="mt-5 text-[13px] font-semibold">Available package requests ({availableDeliveries.length})</h4>
            {!deliveryLoading && availableDeliveries.length === 0 && <p className="mt-3 rounded-[16px] p-4 text-center text-[10px] text-[#777b83] dark:text-[#b1b5c0]">No package deliveries available right now.</p>}
            {availableDeliveries.map((delivery) => (
              <div key={`available-${delivery.id}`} className="mt-3 rounded-[20px] bg-[#e9edf4] p-4 shadow-[5px_5px_12px_#c4c6ca,-5px_-5px_12px_#ffffff] dark:bg-[#1c1e24] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]">
                <div className="flex items-center justify-between gap-2"><p className="text-[12px] font-semibold">{delivery.delivery_type === "scheduled" ? "Scheduled delivery" : "Deliver now"}</p><p className="text-[16px] font-semibold text-[#ff6846]">R{Number(delivery.fare_amount || 0).toFixed(0)}</p></div>
                <p className="mt-2 text-[12px] text-[#515d70] dark:text-[#c7cfdb]">{delivery.parcel_size || "Parcel"} · {delivery.parcel_description || "Package"}</p>
                <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-white/60 bg-[#e9edf4] p-3 dark:border-white/10 dark:bg-[#292e38]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dce2eb] text-lg font-semibold text-[#ff6846] dark:bg-[#343d4b]">
                    {(delivery.passenger_profile_image || delivery.customer_profile_image || delivery.sender_profile_image || delivery.profile_image) ? <img src={String(delivery.passenger_profile_image || delivery.customer_profile_image || delivery.sender_profile_image || delivery.profile_image)} alt="Customer" className="h-full w-full object-cover" /> : String(delivery.passenger_name || delivery.customer_name || delivery.sender_name || "C").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-[#748198] dark:text-[#abb4c3]">Customer</p>
                    <p className="truncate text-[13px] font-semibold">{delivery.passenger_name || delivery.customer_name || delivery.sender_name || delivery.sender_full_name || "Customer details unavailable"}</p>
                    {(delivery.passenger_phone || delivery.customer_phone || delivery.sender_phone) && <a href={`tel:${delivery.passenger_phone || delivery.customer_phone || delivery.sender_phone}`} className="mt-1 inline-block text-[11px] text-[#ed684b]">{delivery.passenger_phone || delivery.customer_phone || delivery.sender_phone}</a>}
                  </div>
                </div>
                <RouteBox pickup={delivery.pickup_address} destination={delivery.dropoff_address} />
                {delivery.scheduled_pickup_at && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-white/70 bg-[#e9edf4] px-4 py-3 dark:border-white/10 dark:bg-[#303743]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0e5ee] text-[#e56548] dark:bg-[#3c4554]" aria-hidden="true">
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
                    </div>
                    <div className="min-w-[130px] flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#69758a] dark:text-[#c3cad7]">Collection date</p>
                      <p className="mt-0.5 text-[15px] font-semibold">{new Date(delivery.scheduled_pickup_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="rounded-xl bg-[#e1e5ee] px-4 py-2 dark:bg-[#3c4554]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#69758a] dark:text-[#c3cad7]">Time</p>
                      <p className="text-[17px] font-semibold text-[#d85e44] dark:text-[#ff987f]">{new Date(delivery.scheduled_pickup_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false })}</p>
                    </div>
                  </div>
                )}
                <button type="button" disabled={status !== "available" || deliveryBusyId !== null} onClick={() => void changeDeliveryStatus(delivery.id, "accept")} className="mt-4 w-full rounded-[13px] bg-[#ff6846] px-3 py-3.5 text-[13px] font-semibold text-white disabled:opacity-50">{status === "available" ? "Accept package delivery" : "Go online to accept"}</button>
              </div>
            ))}
          </section>

          {/* SCHEDULED RIDES */}
          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                  Coming up
                </p>
                <h3 className="mt-0.5 text-[17px] font-semibold tracking-[-0.035em]">
                  Scheduled rides
                </h3>
              </div>

              {scheduledRides.length > 0 && (
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#17191f] dark:bg-[#30333d] px-2 text-[8px] font-semibold text-white">
                  {scheduledRides.length}
                </span>
              )}
            </div>

            {loadingScheduled ? (
              <div className="rounded-[20px] bg-[#e9edf4] dark:bg-[#1c1e24] p-4 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                <p className="text-[9px] font-bold text-[#92959b] dark:text-[#a9acb6]">
                  Loading scheduled rides...
                </p>
              </div>
            ) : scheduledRides.length === 0 ? (
              <div className="rounded-[20px] bg-[#e9edf4] dark:bg-[#1c1e24] p-4 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                <p className="text-[9px] font-bold text-[#92959b] dark:text-[#a9acb6]">
                  No upcoming scheduled rides.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledRides.map((ride) => {
                  const matchingActive =
                    ride.booking_status === "Waiting" ||
                    ride.trip_status === "Waiting";

                  return (
                    <div
                      key={ride.id}
                      className="rounded-[23px] bg-[#e9edf4] dark:bg-[#1c1e24] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]"
                    >
                      <PassengerInfo ride={ride} />

                      <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-3">
                        <div>
                          <p className="text-[8px] font-extrabold uppercase tracking-[0.11em] text-[#92959b] dark:text-[#a9acb6]">
                            Pickup
                          </p>
                          <p className="mt-0.5 text-[19px] font-semibold tracking-[-0.04em]">
                            {formatRideDate(ride.scheduled_pickup_at)}
                          </p>
                        </div>

                        <div className="rounded-[14px] bg-[#17191f] dark:bg-[#30333d] px-3.5 py-2 text-center text-white">
                          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-white/45">
                            Time
                          </p>
                          <p className="text-[15px] font-semibold">
                            {formatRideTime(ride.scheduled_pickup_at)}
                          </p>
                        </div>

                        <div className="mt-4 flex items-start justify-between gap-4">
                          <p className="text-[10px] font-semibold">Ride Now</p>

                          <div className="text-right">
                            <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b] dark:text-[#a9acb6]">
                              Full fare
                            </p>

                            <p className="mt-0.5 text-[17px] font-semibold">
                              R{Number(ride.fare_amount || 0).toFixed(0)}
                            </p>

                            {Number(ride.discount_amount || 0) > 0 && (
                              <div className="mt-1">
                                <p className="text-[9px] font-semibold text-[#ff6846]">
                                  Passenger pays R
                                  {Number(
                                    ride.passenger_amount ??
                                      ride.fare_amount ??
                                      0,
                                  ).toFixed(0)}
                                </p>

                                <p className="mt-0.5 text-[8px] font-semibold text-[#92959b] dark:text-[#a9acb6]">
                                  RouteX promo R
                                  {Number(ride.discount_amount).toFixed(0)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-[16px] bg-[#e9edf4] dark:bg-[#1c1e24] px-3.5 py-3 shadow-[inset_2px_2px_5px_#c7c9ce,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                        <div className="flex items-center gap-2.5">
                          <span className="h-[10px] w-[10px] shrink-0 rounded-full border-[3px] border-[#17191f] dark:border-[#f0f1f5]" />
                          <p className="min-w-0 flex-1 truncate text-[10px] font-semibold">
                            {ride.pickup_address}
                          </p>
                        </div>
                        <div className="ml-[4px] my-1 h-3 border-l border-dashed border-[#b6b9bf] dark:border-[#50545f]" />
                        <div className="flex items-center gap-2.5">
                          <span className="h-[10px] w-[10px] shrink-0 rounded-[3px] bg-[#ff6846]" />
                          <p className="min-w-0 flex-1 truncate text-[10px] font-semibold">
                            {ride.dropoff_address}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[#ff6846] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                          <ClockIcon />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-semibold">
                            {matchingActive
                              ? "Driver matching is open"
                              : `Matching opens at ${formatRideTime(ride.matching_opens_at)}`}
                          </p>
                          <p className="mt-0.5 text-[8px] font-semibold leading-3.5 text-[#8b8e95] dark:text-[#a9acb6]">
                            {matchingActive
                              ? "This scheduled ride is available to accept now."
                              : "Accept becomes available 30 min before pickup."}
                          </p>
                        </div>

                        <div className="rounded-[10px] bg-[#e9edf4] dark:bg-[#1c1e24] px-2.5 py-2 text-center shadow-[inset_2px_2px_4px_#c7c9ce,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                          <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-[#9a9da3] dark:text-[#a9acb6]">
                            Booking
                          </p>
                          <p className="mt-0.5 text-[8px] font-semibold">
                            BK-{ride.id.toString().padStart(4, "0")}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          !matchingActive ||
                          status !== "available" ||
                          acceptingId === ride.id
                        }
                        onClick={() => acceptRide(ride.id)}
                        className={`mt-3 w-full rounded-[14px] py-2.5 text-[9px] font-semibold transition active:scale-[0.985] ${
                          matchingActive && status === "available"
                            ? "bg-[#17191f] dark:bg-[#30333d] text-white shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]"
                            : "cursor-not-allowed bg-[#d3d5da] dark:bg-[#30333d] text-[#8f9298] dark:text-[#a9acb6] shadow-[inset_2px_2px_5px_#c2c4c9,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]"
                        }`}
                      >
                        {acceptingId === ride.id
                          ? "Accepting..."
                          : status !== "available"
                            ? "Go online to accept"
                            : matchingActive
                              ? "Accept scheduled ride"
                              : `Available to accept at ${formatRideTime(ride.matching_opens_at)}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ACCEPTED RIDE NOW */}
          {acceptedTrips.filter((ride) => ride.ride_type !== "scheduled")
            .length > 0 && (
            <section className="mt-7">
              <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                Driver assigned
              </p>
              <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.035em]">
                Accepted ride
              </h3>

              <div className="mt-4 space-y-4">
                {acceptedTrips
                  .filter((ride) => ride.ride_type !== "scheduled")
                  .map((ride) => (
                    <div
                      key={ride.id}
                      className="rounded-[23px] bg-[#e9edf4] dark:bg-[#1c1e24] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e9edf4] dark:bg-[#1c1e24] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                            {ride.passenger_profile_image ? (
                              <img
                                src={ride.passenger_profile_image}
                                alt={
                                  ride.full_name ||
                                  ride.passenger_name ||
                                  "Passenger"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-[15px] font-semibold text-[#ff6846]">
                                {(ride.full_name || ride.passenger_name || "P")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#92959b] dark:text-[#a9acb6]">
                              Passenger
                            </p>

                            <p className="mt-1 text-[15px] font-semibold">
                              {ride.full_name ||
                                ride.passenger_name ||
                                "Passenger"}
                            </p>
                            {(ride.passenger_phone || ride.phone) && (
                              <p className="mt-0.5 text-[9px] font-bold text-[#8b8e95] dark:text-[#a9acb6]">
                                {ride.passenger_phone || ride.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="rounded-full bg-[#17191f] dark:bg-[#30333d] px-3 py-1.5 text-[8px] font-semibold text-white">
                          Accepted
                        </span>
                      </div>

                      <RouteBox
                        pickup={ride.pickup_address}
                        destination={ride.dropoff_address}
                      />

                      <div className="mt-4 flex items-start justify-between">
                        <div>
                          <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b] dark:text-[#a9acb6]">
                            Full fare
                          </p>

                          <p className="mt-0.5 text-[17px] font-semibold">
                            R{Number(ride.fare_amount || 0).toFixed(0)}
                          </p>

                          {Number(ride.discount_amount || 0) > 0 && (
                            <div className="mt-1">
                              <p className="text-[9px] font-semibold text-[#ff6846]">
                                Passenger pays R
                                {Number(
                                  ride.passenger_amount ??
                                    ride.fare_amount ??
                                    0,
                                ).toFixed(0)}
                              </p>

                              <p className="mt-0.5 text-[8px] font-semibold text-[#92959b] dark:text-[#a9acb6]">
                                RouteX promo R
                                {Number(ride.discount_amount).toFixed(0)}
                              </p>
                            </div>
                          )}
                        </div>

                        <p className="text-[8px] font-semibold text-[#ff6846]">
                          BK-{ride.id.toString().padStart(4, "0")}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (ride.pickup_lat && ride.pickup_lng) {
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${ride.pickup_lat},${ride.pickup_lng}`,
                                "_blank",
                              );
                            }
                          }}
                          className="rounded-[14px] bg-[#17191f] dark:bg-[#30333d] py-3 text-[9px] font-semibold text-white transition active:scale-[0.985]"
                        >
                          Navigate to pickup
                        </button>

                        <button
                          type="button"
                          disabled={startingId === ride.id}
                          onClick={() => startRide(ride.id)}
                          className="rounded-[14px] bg-[#ff6846] py-3 text-[9px] font-semibold text-white transition active:scale-[0.985] disabled:opacity-50"
                        >
                          {startingId === ride.id
                            ? "Starting..."
                            : "Start ride"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* ACCEPTED SCHEDULED RIDES */}
          {acceptedTrips.filter((ride) => ride.ride_type === "scheduled")
            .length > 0 && (
            <section className="mt-7">
              <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                Your upcoming pickup
              </p>
              <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.035em]">
                Accepted scheduled ride
              </h3>

              <div className="mt-4 space-y-4">
                {acceptedTrips
                  .filter((ride) => ride.ride_type === "scheduled")
                  .map((ride) => {
                    const pickupMs = new Date(
                      ride.scheduled_pickup_at,
                    ).getTime();
                    const navigateOpensMs = pickupMs - 15 * 60 * 1000;

                    const canNavigate =
                      Number.isFinite(pickupMs) && nowMs >= navigateOpensMs;

                    const canStart =
                      Number.isFinite(pickupMs) && nowMs >= pickupMs;

                    return (
                      <div
                        key={ride.id}
                        className="rounded-[23px] bg-[#e9edf4] dark:bg-[#1c1e24] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e9edf4] dark:bg-[#1c1e24] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                              {ride.passenger_profile_image ? (
                                <img
                                  src={ride.passenger_profile_image}
                                  alt={
                                    ride.passenger_name ||
                                    ride.full_name ||
                                    "Passenger"
                                  }
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-[15px] font-semibold text-[#ff6846]">
                                  {(
                                    ride.passenger_name ||
                                    ride.full_name ||
                                    "P"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#92959b] dark:text-[#a9acb6]">
                                Passenger
                              </p>
                              <p className="mt-1 truncate text-[15px] font-semibold">
                                {ride.passenger_name ||
                                  ride.full_name ||
                                  "Passenger"}
                              </p>
                              {ride.passenger_phone && (
                                <div className="mt-1 flex items-center gap-2">
                                  <p className="text-[9px] font-bold text-[#8b8e95] dark:text-[#a9acb6]">
                                    {ride.passenger_phone}
                                  </p>

                                  <a
                                    href={`tel:${ride.passenger_phone}`}
                                    className="rounded-full bg-[#17191f] dark:bg-[#30333d] px-2.5 py-1 text-[8px] font-semibold text-white"
                                  >
                                    Call
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="shrink-0 rounded-full bg-[#17191f] dark:bg-[#30333d] px-3 py-1.5 text-[8px] font-semibold text-white">
                            Accepted
                          </span>
                        </div>

                        <div className="mt-4 rounded-[16px] bg-[#e9edf4] dark:bg-[#1c1e24] px-4 py-3 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                          <p className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-[#92959b] dark:text-[#a9acb6]">
                            Scheduled pickup
                          </p>
                          <p className="mt-1 text-[15px] font-semibold">
                            {formatRideDate(ride.scheduled_pickup_at)} ·{" "}
                            {formatRideTime(ride.scheduled_pickup_at)}
                          </p>
                        </div>

                        <RouteBox
                          pickup={ride.pickup_address}
                          destination={ride.dropoff_address}
                        />

                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b] dark:text-[#a9acb6]">
                              Fare
                            </p>
                            <p className="mt-0.5 text-[17px] font-semibold">
                              R{Number(ride.fare_amount || 0).toFixed(0)}
                            </p>
                          </div>
                          <p className="text-[8px] font-semibold text-[#ff6846]">
                            BK-{ride.id.toString().padStart(4, "0")}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            disabled={!canNavigate}
                            onClick={() => {
                              if (!canNavigate) return;

                              if (ride.pickup_lat && ride.pickup_lng) {
                                window.open(
                                  `https://www.google.com/maps/dir/?api=1&destination=${ride.pickup_lat},${ride.pickup_lng}`,
                                  "_blank",
                                );
                              }
                            }}
                            className={`rounded-[14px] py-3 text-[9px] font-semibold transition ${
                              canNavigate
                                ? "bg-[#17191f] dark:bg-[#30333d] text-white active:scale-[0.985]"
                                : "cursor-not-allowed bg-[#d3d5da] dark:bg-[#30333d] text-[#8f9298] dark:text-[#a9acb6] shadow-[inset_2px_2px_5px_#c2c4c9,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]"
                            }`}
                          >
                            {canNavigate
                              ? "Navigate to pickup"
                              : `Navigate at ${formatRideTime(
                                  new Date(navigateOpensMs).toISOString(),
                                )}`}
                          </button>

                          <button
                            type="button"
                            disabled={!canStart || startingId === ride.id}
                            onClick={() => startRide(ride.id)}
                            className={`rounded-[14px] py-3 text-[9px] font-semibold transition ${
                              canStart && startingId !== ride.id
                                ? "bg-[#ff6846] text-white active:scale-[0.985]"
                                : "cursor-not-allowed bg-[#d3d5da] dark:bg-[#30333d] text-[#8f9298] dark:text-[#a9acb6] shadow-[inset_2px_2px_5px_#c2c4c9,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]"
                            }`}
                          >
                            {startingId === ride.id
                              ? "Starting..."
                              : canStart
                                ? "Start ride"
                                : `Start at ${formatRideTime(ride.scheduled_pickup_at)}`}
                          </button>
                        </div>

                        <p className="mt-3 text-center text-[8px] font-semibold text-[#92959b] dark:text-[#a9acb6]">
                          {!canNavigate
                            ? `Navigation unlocks 15 minutes before pickup at ${formatRideTime(
                                new Date(navigateOpensMs).toISOString(),
                              )}.`
                            : !canStart
                              ? `Navigation is available. Start ride unlocks at ${formatRideTime(
                                  ride.scheduled_pickup_at,
                                )}.`
                              : "Passenger pickup time has arrived. You can start the ride."}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* IN PROGRESS RIDES */}
          {inProgressTrips.length > 0 && (
            <section className="mt-7">
              <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                Active trip
              </p>
              <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.035em]">
                Trip in progress
              </h3>

              <div className="mt-4 space-y-4">
                {inProgressTrips.map((ride) => (
                  <div
                    key={ride.id}
                    className="rounded-[23px] bg-[#e9edf4] dark:bg-[#1c1e24] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e9edf4] dark:bg-[#1c1e24] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                          {ride.passenger_profile_image ? (
                            <img
                              src={ride.passenger_profile_image}
                              alt={
                                ride.full_name ||
                                ride.passenger_name ||
                                "Passenger"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[15px] font-semibold text-[#ff6846]">
                              {(ride.full_name || ride.passenger_name || "P")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#92959b] dark:text-[#a9acb6]">
                            Passenger
                          </p>

                          <p className="mt-1 text-[15px] font-semibold">
                            {ride.full_name ||
                              ride.passenger_name ||
                              "Passenger"}
                          </p>
                          {(ride.passenger_phone || ride.phone) && (
                            <p className="mt-0.5 text-[9px] font-bold text-[#8b8e95] dark:text-[#a9acb6]">
                              {ride.passenger_phone || ride.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="rounded-full bg-[#ff6846] px-3 py-1.5 text-[8px] font-semibold text-white">
                        In Progress
                      </span>
                    </div>

                    <RouteBox
                      pickup={ride.pickup_address}
                      destination={ride.dropoff_address}
                    />

                    <div className="mt-4 flex items-start justify-between">
                      <div>
                        <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b] dark:text-[#a9acb6]">
                          Full fare
                        </p>

                        <p className="mt-0.5 text-[17px] font-semibold">
                          R{Number(ride.fare_amount || 0).toFixed(0)}
                        </p>

                        {Number(ride.discount_amount || 0) > 0 && (
                          <div className="mt-1">
                            <p className="text-[9px] font-semibold text-[#ff6846]">
                              Passenger pays R
                              {Number(
                                ride.passenger_amount ?? ride.fare_amount ?? 0,
                              ).toFixed(0)}
                            </p>

                            <p className="mt-0.5 text-[8px] font-semibold text-[#92959b] dark:text-[#a9acb6]">
                              RouteX promo R
                              {Number(ride.discount_amount).toFixed(0)}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-[8px] font-semibold text-[#ff6846]">
                        BK-{ride.id.toString().padStart(4, "0")}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (ride.destination_lat && ride.destination_lng) {
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${ride.destination_lat},${ride.destination_lng}`,
                              "_blank",
                            );
                          }
                        }}
                        className="rounded-[14px] bg-[#17191f] dark:bg-[#30333d] py-3 text-[9px] font-semibold text-white"
                      >
                        Navigate to destination
                      </button>

                      <button
                        type="button"
                        disabled={completingId === ride.id}
                        onClick={() => completeRide(ride.id)}
                        className="rounded-[14px] bg-[#ff6846] py-3 text-[9px] font-semibold text-white disabled:opacity-50"
                      >
                        {completingId === ride.id
                          ? "Completing..."
                          : "Complete ride"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* LIVE REQUEST AREA */}
          <section className="mt-7">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#92959b] dark:text-[#a9acb6]">
              Live requests
            </p>
            <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.035em]">
              Rides available now
            </h3>

            {liveRequests.filter((ride) => ride.ride_type !== "scheduled")
              .length === 0 ? (
              <div className="mt-4 rounded-[24px] bg-[#e9edf4] dark:bg-[#1c1e24] p-5 text-center shadow-[inset_4px_4px_9px_#c5c7cc,inset_-4px_-4px_9px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[17px] text-[#ff6846]">
                  <RadarIcon />
                </div>
                <p className="mt-3 text-[10px] font-semibold">
                  {status === "available"
                    ? "Looking for rides"
                    : "You're offline"}
                </p>
                <p className="mt-1 text-[8px] font-semibold text-[#96999f] dark:text-[#a9acb6]">
                  {status === "available"
                    ? "New Ride Now requests will appear here."
                    : "Go online when you're ready to receive live requests."}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {liveRequests
                  .filter((ride) => ride.ride_type !== "scheduled")
                  .map((ride) => (
                    <div
                      key={ride.id}
                      className="rounded-[21px] bg-[#e9edf4] dark:bg-[#1c1e24] p-4 shadow-[5px_5px_12px_#c4c6ca,-5px_-5px_12px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]"
                    >
                      <PassengerInfo ride={ride} />

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <p className="text-[10px] font-semibold">Ride Now</p>

                        <div className="text-right">
                          <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b] dark:text-[#a9acb6]">
                            Full fare
                          </p>

                          <p className="mt-0.5 text-[17px] font-semibold">
                            R{Number(ride.fare_amount || 0).toFixed(0)}
                          </p>

                          {Number(ride.discount_amount || 0) > 0 && (
                            <div className="mt-1">
                              <p className="text-[9px] font-semibold text-[#ff6846]">
                                Passenger pays R
                                {Number(
                                  ride.passenger_amount ??
                                    ride.fare_amount ??
                                    0,
                                ).toFixed(0)}
                              </p>

                              <p className="mt-0.5 text-[8px] font-semibold text-[#92959b] dark:text-[#a9acb6]">
                                RouteX promo R
                                {Number(ride.discount_amount).toFixed(0)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <RouteBox
                        pickup={ride.pickup_address}
                        destination={ride.dropoff_address}
                      />
                      <button
                        type="button"
                        disabled={
                          status !== "available" || acceptingId === ride.id
                        }
                        onClick={() => acceptRide(ride.id)}
                        className="mt-3 w-full rounded-[14px] bg-[#17191f] dark:bg-[#30333d] py-3 text-[9px] font-semibold text-white disabled:opacity-40"
                      >
                        {acceptingId === ride.id
                          ? "Accepting..."
                          : "Accept ride"}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* REVIEWS */}
          <section className="mt-9">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#92959b] dark:text-[#a9acb6]">
                  Feedback
                </p>
                <p className="mt-1 text-[12px] font-semibold">Passenger reviews</p>
              </div>
              <span className="text-[9px] font-bold text-[#92959b] dark:text-[#a9acb6]">
                {driverRating.review_count}{" "}
                {driverRating.review_count === 1 ? "review" : "reviews"}
              </span>
            </div>

            {driverReviews.length === 0 ? (
              <div className="mt-4 rounded-[18px] bg-[#e9edf4] dark:bg-[#1c1e24] px-4 py-4 text-center shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                <p className="text-[9px] font-semibold text-[#96999f] dark:text-[#a9acb6]">
                  No passenger reviews yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {driverReviews.slice(0, 5).map((review: any) => (
                  <div
                    key={review.id}
                    className="rounded-[18px] bg-[#e9edf4] dark:bg-[#1c1e24] px-4 py-4 shadow-[3px_3px_8px_#c5c7cc,-3px_-3px_8px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold">
                        {review.passenger_name || "Passenger"}
                      </p>
                      <p className="text-[9px] font-semibold text-[#ff6846]">
                        {Number(review.rating || 0).toFixed(1)} ★
                      </p>
                    </div>
                    {review.review_text && (
                      <p className="mt-2 text-[9px] font-semibold leading-4 text-[#85888f] dark:text-[#b2b5bf]">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {appPopup && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 px-5 pb-6 sm:items-center sm:pb-0">
              <div className="w-full max-w-sm rounded-[26px] bg-[#e9edf4] dark:bg-[#1c1e24] p-5 shadow-[10px_10px_28px_rgba(0,0,0,0.22),-6px_-6px_18px_rgba(255,255,255,0.75)]">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                      appPopup.tone === "error"
                        ? "bg-[#ff6846] text-white"
                        : "bg-[#17191f] dark:bg-[#30333d] text-white"
                    }`}
                  >
                    <span className="text-[18px] font-semibold">!</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-[#17191f] dark:text-[#f5f6f8]">
                      {appPopup.title}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold leading-5 text-[#7c7f86] dark:text-[#b2b5bf]">
                      {appPopup.message}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAppPopup(null)}
                  className="mt-5 w-full rounded-[16px] bg-[#17191f] dark:bg-[#30333d] px-4 py-3.5 text-[11px] font-semibold text-white active:scale-[0.985]"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {driverSidebar !== null && (
            <div className="fixed inset-0 z-[90]">
              <button type="button" aria-label="Close sidebar" onClick={() => setDriverSidebar(null)} className="absolute inset-0 w-full bg-black/45" />
              <aside role="dialog" aria-modal="true" aria-label="Driver navigation" className="absolute left-0 top-0 h-full w-[78vw] max-w-[300px] overflow-y-auto bg-[#e9edf4] dark:bg-[#1c1e24] px-5 pb-10 pt-6 shadow-[10px_0_30px_rgba(0,0,0,0.25)] animate-[slideIn_220ms_ease-out]">
                <div className="flex items-center justify-between"><span className="text-xl font-semibold tracking-widest">ROUTE<span className="text-[#ff6846]">X</span></span><button type="button" onClick={() => setDriverSidebar(null)} aria-label="Close menu" className="rounded-xl p-2 text-xl">✕</button></div>
                <nav className="mt-8 space-y-2" aria-label="Driver menu">
                  {([ ["dashboard", "Dashboard", "⌂"], ["earnings", "My earnings", "◷"], ["trips", "Completed rides", "↶"], ["deliveries", "Completed deliveries", "▣"], ["profile", "My profile", "♙"] ] as const).map(([key,label,symbol]) => (
                    <button key={key} type="button" onClick={() => {setDriverSidebar(key);if(key==="trips")setShowRecentTrips(true);}} aria-current={driverSidebar===key?"page":undefined} className={`flex w-full items-center gap-4 rounded-[17px] px-4 py-4 text-left text-[14px] font-medium ${driverSidebar===key?"text-[#ed684b] shadow-[inset_4px_4px_9px_#cdd1da,inset_-4px_-4px_9px_#fff] dark:shadow-[inset_4px_4px_9px_#171b22,inset_-4px_-4px_9px_#3c4350]":"text-[#344152] dark:text-[#e8ecf2]"}`}><span aria-hidden="true" className="w-7 text-center text-[22px] font-normal">{symbol}</span>{label}</button>
                  ))}
                </nav>
                <a href="/driver-portal/monthly-transport" onClick={() => setDriverSidebar(null)} className="mt-3 flex w-full items-center gap-4 rounded-[17px] px-4 py-4 text-left text-[14px] font-medium text-[#344152] dark:text-[#e8ecf2]"><span aria-hidden="true" className="w-7 text-center text-[21px]">▤</span>Monthly shared transport</a>
                <a href="https://wa.me/27799132513" target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-4 rounded-[17px] px-4 py-4 text-left text-[14px] font-medium text-[#344152] dark:text-[#e8ecf2]"><span aria-hidden="true" className="w-7 text-center text-[21px]">✉</span>Support</a>
                {driverSidebar === "dashboard" && <p className="mt-8 text-sm text-[#748198] dark:text-[#b1bccb]">Close the menu to view your driver dashboard.</p>}
                {driverSidebar === "profile" && <div className="mt-7 space-y-3 text-sm"><h3 className="font-semibold">My profile</h3><p>{driver?.full_name || "Driver"}</p><p>{driver?.phone || ""}</p><button type="button" className="rounded-xl bg-[#ff6846] px-4 py-3 text-white" onClick={() => {setDriverSidebar(null);document.getElementById("routex-driver-photo")?.click();}}>Change profile photo</button></div>}
                {driverSidebar === "deliveries" && <div className="mt-7 space-y-4"><h3 className="text-base font-semibold">Completed deliveries</h3>{myDeliveries.filter(d=>d.status==="delivered").length===0?<p className="text-sm text-[#748198]">No completed deliveries yet.</p>:myDeliveries.filter(d=>d.status==="delivered").map(d=><div key={d.id} className="rounded-2xl p-4 shadow-[4px_4px_10px_#c4c6ca,-4px_-4px_10px_#fff] dark:shadow-none"><p className="font-semibold">Delivery PX-{String(d.id).padStart(4,"0")}</p><RouteBox pickup={d.pickup_address} destination={d.dropoff_address}/><p className="mt-2 text-[#ff6846]">R{Number(d.fare_amount||0).toFixed(0)}</p></div>)}</div>}
          {driverSidebar === "earnings" && (<>
          {/* MONTHLY EARNINGS */}
          <section className="mt-9 rounded-[24px] bg-[#e9edf4] dark:bg-[#1c1e24] p-5 shadow-[6px_6px_14px_#c4c6ca,-6px_-6px_14px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#ff6846]">My earnings</p>
            <h3 className="mt-1 text-[17px] font-semibold">Monthly RouteX earnings</h3>
            {earningsLoading ? (
              <p className="mt-4 text-[11px]">Loading earnings...</p>
            ) : earningsError ? (
              <button type="button" onClick={() => void loadDriverEarnings()} className="mt-4 text-[11px] font-bold text-[#ff6846]">Unable to load earnings. Tap to retry.</button>
            ) : (() => {
              const thisMonth = new Intl.DateTimeFormat("sv-SE", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
              const current = earningsMonths.find((item) => item.month === thisMonth);
              const money = (value: string | number) => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              return (
                <>
                  <p className="mt-4 text-[9px] font-bold text-[#92959b] dark:text-[#a9acb6]">This month · {thisMonth}</p>
                  <p className="mt-1 text-[30px] font-semibold text-[#ff6846]">{money(current?.gross_fares || 0)}</p>
                  <p className="mt-1 text-[10px] font-semibold">{current?.trips || 0} completed trips</p>
                  <p className="mt-2 text-[9px] leading-4 text-[#92959b] dark:text-[#a9acb6]">Gross trip fares, including RouteX-funded promotions. This is not a confirmation of payment received.</p>
                  <button type="button" onClick={() => setShowEarningsHistory((value) => !value)} aria-expanded={showEarningsHistory} className="mt-4 w-full rounded-[14px] bg-[#17191f] dark:bg-[#30333d] px-4 py-3 text-[11px] font-bold text-white">
                    {showEarningsHistory ? "Hide monthly history" : "View monthly history"}
                  </button>
                  {showEarningsHistory && (
                    <div className="mt-3 space-y-2">
                      {earningsMonths.length === 0 ? <p className="text-[10px]">No completed trips recorded yet.</p> : earningsMonths.map((item) => (
                        <div key={item.month} className="flex items-center justify-between rounded-[12px] border border-black/10 dark:border-white/10 p-3">
                          <div><p className="text-[11px] font-bold">{item.month}</p><p className="text-[9px] text-[#92959b] dark:text-[#a9acb6]">{item.trips} trips</p></div>
                          <p className="text-[12px] font-semibold">{money(item.gross_fares)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </section>

          </>)}
          {driverSidebar === "trips" && (<>
          {/* RECENT TRIPS */}
          <section className="mt-9">
            <button
              type="button"
              onClick={() => setShowRecentTrips((current) => !current)}
              className="flex w-full items-center justify-between rounded-[20px] bg-[#e9edf4] dark:bg-[#1c1e24] px-4 py-4 text-left shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d] transition active:scale-[0.99]"
              aria-expanded={showRecentTrips}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[#ff6846] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                  <HistoryIcon />
                </div>

                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#92959b] dark:text-[#a9acb6]">
                    Activity
                  </p>
                  <p className="mt-1 text-[12px] font-semibold">Recent trips</p>
                  <p className="mt-0.5 text-[8px] font-semibold text-[#96999f] dark:text-[#a9acb6]">
                    View your previous RouteX rides
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#ff6846] px-2 text-[10px] font-semibold text-white">
                  {completedTrips.length}
                </span>

                <span
                  className={`text-[#92959b] dark:text-[#a9acb6] transition-transform duration-200 ${
                    showRecentTrips ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDownIcon />
                </span>
              </div>
            </button>

            {showRecentTrips && (
              <div className="mt-4 space-y-3">
                {completedTrips.length === 0 ? (
                  <div className="rounded-[18px] bg-[#e9edf4] dark:bg-[#1c1e24] px-4 py-5 text-center shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
                    <p className="text-[9px] font-semibold text-[#96999f] dark:text-[#a9acb6]">
                      No completed trips yet.
                    </p>
                  </div>
                ) : (
                  completedTrips.map((trip) => (
                    <HistoryRide key={`recent-${trip.id}`} trip={trip} />
                  ))
                )}
              </div>
            )}
          </section>

          </>)}
              </aside>
            </div>
          )}

          <footer className="pt-10 text-center">
            <p className="text-[9px] font-semibold text-[#a0a3a9] dark:text-[#a9acb6]">
              RouteX · Driver Portal
            </p>
          </footer>
        </div>
      </main>
    </AuthGuard>
  );
}

/* =====================================================
   UI COMPONENTS
===================================================== */

function PassengerInfo({ ride }: { ride: any }) {
  const name =
    ride?.passenger_name ||
    ride?.full_name ||
    ride?.passenger_full_name ||
    "Passenger";

  const phone =
    ride?.passenger_phone || ride?.phone || ride?.passenger_mobile || "";

  const image =
    ride?.passenger_profile_image ||
    ride?.profile_image ||
    ride?.passenger_photo ||
    "";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e9edf4] dark:bg-[#1c1e24] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[15px] font-semibold text-[#ff6846]">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#92959b] dark:text-[#a9acb6]">
          Passenger
        </p>
        <p className="mt-1 truncate text-[15px] font-semibold">{name}</p>
        {phone && (
          <p className="mt-0.5 text-[9px] font-bold text-[#8b8e95] dark:text-[#a9acb6]">{phone}</p>
        )}
      </div>
    </div>
  );
}

function compactDriverAddress(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Address not provided";
  const parts = raw.split(",").map(part => part.trim()).filter(Boolean);
  const upingtonIndex = parts.findIndex(part => /^Upington$/i.test(part));
  if (upingtonIndex > 0) return [...parts.slice(0, Math.min(2, upingtonIndex)), "Upington"].join(", ");
  return parts.filter(part => !/municipality|district|province|south africa|ward|^\d{4,5}$/i.test(part)).slice(0, 3).join(", ") || raw;
}

function RouteBox({
  pickup,
  destination,
}: {
  pickup: string;
  destination: string;
}) {
  return (
    <div className="mt-5 rounded-[19px] bg-[#e9edf4] dark:bg-[#1c1e24] px-4 py-4 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
      <RouteRow type="pickup" label="Pickup" value={compactDriverAddress(pickup)} />
      <div className="ml-[5px] h-5 border-l border-dashed border-[#b6b9bf] dark:border-[#50545f]" />
      <RouteRow type="destination" label="Destination" value={compactDriverAddress(destination)} />
    </div>
  );
}

function RouteRow({
  type,
  label,
  value,
}: {
  type: "pickup" | "destination";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${
          type === "pickup" ? "border-[3px] border-[#17191f] dark:border-[#f0f1f5]" : "bg-[#ff6846]"
        }`}
      />
      <div className="min-w-0">
        <p className="text-[8px] font-extrabold uppercase tracking-[0.11em] text-[#9a9da3] dark:text-[#a9acb6]">
          {label}
        </p>
        <p className="mt-1 text-[10px] font-semibold leading-4">
          {value || "Location unavailable"}
        </p>
      </div>
    </div>
  );
}

function HistoryRide({ trip }: { trip: any }) {
  return (
    <div className="flex items-center rounded-[18px] bg-[#e9edf4] dark:bg-[#1c1e24] px-4 py-3.5 shadow-[3px_3px_8px_#c5c7cc,-3px_-3px_8px_#ffffff] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]">
      <div className="flex h-9 w-9 items-center justify-center rounded-[12px] text-[#ff6846] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_3px_3px_8px_#101116,inset_-3px_-3px_8px_#30333d]">
        <RideIcon />
      </div>
      <div className="ml-3 min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold">
          {trip.dropoff_address || "Completed ride"}
        </p>
        <p className="mt-0.5 text-[8px] font-semibold text-[#999ca2] dark:text-[#a9acb6]">
          Completed · BK-{trip.id.toString().padStart(4, "0")}
        </p>
      </div>
      <p className="text-[11px] font-semibold">R{trip.fare_amount}</p>
    </div>
  );
}

/* =====================================================
   ICONS
===================================================== */

function HistoryIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12a9 9 0 1 0 3-6.7L3 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3v5h5M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="#ff6846"
      stroke="#ff6846"
      strokeWidth="2"
    >
      <path d="m12 2 3 6 6.5.9-4.7 4.6 1.1 6.5-5.9-3.1L6.1 20l1.1-6.5-4.7-4.6L9 8Z" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
    >
      <path d="M12 2v10" />
      <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
    </svg>
  );
}

function RideIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 17 1-7 2-4h8l2 4 1 7" />
      <path d="M3 13h18" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function NavigationIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 11 18-8-8 18-2-8Z" />
    </svg>
  );
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="2" />
      <path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
