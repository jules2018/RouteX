
"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { showNotification } from "../lib/notifications";
import { API_URL } from "../lib/api";

export default function DriverPortalPage() {

  const [status, setStatus] = useState<"available" | "offline">("available");
  const [driver, setDriver] = useState<any>(null);
  const [scheduledRides, setScheduledRides] = useState<any[]>([]);
  const [liveRequests, setLiveRequests] = useState<any[]>([]);
  const [acceptedTrips, setAcceptedTrips] = useState<any[]>([]);
  const [inProgressTrips, setInProgressTrips] = useState<any[]>([]);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [showRecentTrips, setShowRecentTrips] = useState(false);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
    tone: "info" | "success" | "error" = "info"
  ) => setAppPopup({ title, message, tone });

  const uploadDriverPhoto = async (file: File) => {
    if (!driver?.id || !file) return;

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("driverId", String(driver.id));

      const response = await fetch(`${API_URL}/driver/upload-photo`, {
        method: "POST",
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
      showAppPopup("RouteX", error?.message || "Could not upload driver photo.", "error");
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
            (ride: any) => Number(ride.assigned_driver_id) === Number(driverId)
          )
        );
      }

      if (inProgressResponse.ok) {
        setInProgressTrips(
          (Array.isArray(inProgressData) ? inProgressData : []).filter(
            (ride: any) => Number(ride.assigned_driver_id) === Number(driverId)
          )
        );
      }

      if (completedResponse.ok) {
        setCompletedTrips(
          (Array.isArray(completedData) ? completedData : [])
            .filter(
              (ride: any) => Number(ride.assigned_driver_id) === Number(driverId)
            )
            .slice(0, 5)
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

    if (!storedDriver) return;

    try {
      const parsedDriver = JSON.parse(storedDriver);
      setDriver(parsedDriver);

      loadDriverRides(Number(parsedDriver.id));
      loadDriverRating(Number(parsedDriver.id));
      loadDriverReviews(Number(parsedDriver.id));

      fetch(`${API_URL}/driver-list`)
        .then((res) => res.json())
        .then((data) => {
          const currentDriver = Array.isArray(data)
            ? data.find(
                (item: any) =>
                  Number(item.id) === Number(parsedDriver.id)
              )
            : null;

          setStatus(
            currentDriver?.status === "Available"
              ? "available"
              : "offline"
          );
        })
        .catch((error) =>
          console.error("DRIVER STATUS LOAD ERROR:", error)
        );

      const interval = setInterval(() => {
        loadDriverRides(Number(parsedDriver.id));
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
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await fetch(`${API_URL}/drivers/${driver.id}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
        console.error("DRIVER GPS WATCH ERROR:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driver?.id, status]);

  const toggleStatus = async () => {
    if (!driver?.id) return;

    const newStatus =
      status === "available" ? "Offline" : "Available";

    try {
      let latitude = null;
      let longitude = null;

      if (newStatus === "Available") {
        if (!navigator.geolocation) {
          showAppPopup(
            "Location required",
            "RouteX needs your location before you can go online.",
            "error"
          );
          return;
        }

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 10000,
              }
            );
          }
        );

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      const response = await fetch(
        `${API_URL}/drivers/${driver.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            current_lat: latitude,
            current_lng: longitude,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to update driver status.");
      }

      setStatus(
        newStatus === "Available" ? "available" : "offline"
      );
    } catch (error) {
      console.error("DRIVER STATUS ERROR:", error);
      showAppPopup(
        "Unable to change status",
        newStatus === "Available"
          ? "RouteX needs your location before you can go online."
          : "Unable to update your status.",
        "error"
      );
    }
  };

  const acceptRide = async (rideId: number) => {
    if (!driver?.id) return;

    try {
      setAcceptingId(rideId);

      const response = await fetch(`${API_URL}/trip-requests/${rideId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driver.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not accept this ride.");
      }

      showNotification(
        "Trip Accepted",
        "The ride has been added to your active trips."
      );
      await loadDriverRides(driver.id);
    } catch (error: any) {
      console.error("ACCEPT RIDE ERROR:", error);
      showAppPopup("RouteX", error?.message || "Could not accept this ride.", "error");
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

      const response = await fetch(`${API_URL}/trip-requests/${rideId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driver.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not start this ride.");
      }

      await loadDriverRides(driver.id);
    } catch (error: any) {
      console.error("START RIDE ERROR:", error);
      showAppPopup("RouteX", error?.message || "Could not start this ride.", "error");
    } finally {
      setStartingId(null);
    }
  };

  const completeRide = async (rideId: number) => {
    if (!driver?.id) return;

    try {
      setCompletingId(rideId);

      const response = await fetch(`${API_URL}/trip-requests/${rideId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driver.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not complete this ride.");
      }

      await loadDriverRides(driver.id);
    } catch (error: any) {
      console.error("COMPLETE RIDE ERROR:", error);
      showAppPopup("RouteX", error?.message || "Could not complete this ride.", "error");
    } finally {
      setCompletingId(null);
    }
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
    <main className="min-h-[100dvh] bg-[#e7e9ee] text-[#17191f]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-md px-5 pb-10">
        {/* HEADER */}
        <header className="flex items-center justify-between pt-6">
          <h1 className="text-[25px] font-black tracking-[-0.06em]">
            Route<span className="text-[#ff6846]">X</span>
          </h1>

        
        </header>

        {/* DRIVER */}
        <section className="mt-6 flex items-center gap-4">
          <div className="relative h-[82px] w-[82px] shrink-0">
            <label
              className={`relative flex h-[82px] w-[82px] cursor-pointer items-center justify-center rounded-[27px] bg-[#e7e9ee] shadow-[7px_7px_15px_#c4c6ca,-7px_-7px_15px_#ffffff] ${
                uploadingPhoto ? "pointer-events-none opacity-70" : ""
              }`}
              title="Change driver photo"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    uploadDriverPhoto(file);
                  }

                  event.currentTarget.value = "";
                }}
              />

              <div className="relative flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-[21px] bg-[#dfe1e6] text-[20px] font-black text-[#ff6846] shadow-[inset_3px_3px_7px_#c2c4c9,inset_-3px_-3px_7px_#ffffff]">
                {driver?.profile_image ? (
                  <img
                    src={driver.profile_image}
                    alt={driver?.full_name || "Driver"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  driver?.full_name?.charAt(0)?.toUpperCase() || "D"
                )}

                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                    Uploading
                  </div>
                )}
              </div>

              <span className="absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#ff6846] text-white shadow-[2px_2px_6px_rgba(0,0,0,0.2)]">
                <CameraIcon />
              </span>

              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-[4px] border-[#e7e9ee] ${
                  status === "available" ? "bg-[#35b86b]" : "bg-[#a2a5ab]"
                }`}
              />
            </label>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#ff6846]">
              Driver portal
            </p>
            <h2 className="mt-1 text-[26px] font-black tracking-[-0.045em]">
              Hi, {driver?.full_name?.split(" ")[0] || "Driver"}.
            </h2>
            <div className="mt-1 flex items-center gap-1.5">
              <StarIcon />
              <span className="text-[10px] font-extrabold">
                {driverRating.average_rating !== null
                  ? driverRating.average_rating.toFixed(1)
                  : "New"}
              </span>
              <span className="text-[9px] font-semibold text-[#92959b]">
                · RouteX Driver
              </span>
            </div>
          </div>
        </section>

        {/* ONLINE CONTROL */}
        <section className="mt-6 flex items-center justify-between rounded-[24px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c4c6ca,-6px_-6px_14px_#ffffff]">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-[15px] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff] ${
                status === "available" ? "text-[#35a967]" : "text-[#92959b]"
              }`}
            >
              <PowerIcon />
            </div>
            <div>
              <p className="text-[12px] font-black">
                {status === "available" ? "You're online" : "You're offline"}
              </p>
              <p className="mt-0.5 text-[9px] font-semibold text-[#92959b]">
                {status === "available"
                  ? "Ready to receive ride requests"
                  : "You won't receive new requests"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleStatus}
            className={`relative h-8 w-[55px] rounded-full transition-all duration-300 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.18),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] ${
              status === "available" ? "bg-[#ff6846]" : "bg-[#cfd1d6]"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                status === "available" ? "left-[27px]" : "left-1"
              }`}
            />
          </button>
        </section>

        {/* SCHEDULED RIDES */}
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                Coming up
              </p>
              <h3 className="mt-0.5 text-[17px] font-black tracking-[-0.035em]">
                Scheduled rides
              </h3>
            </div>

            {scheduledRides.length > 0 && (
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#17191f] px-2 text-[8px] font-black text-white">
                {scheduledRides.length}
              </span>
            )}
          </div>

          {loadingScheduled ? (
            <div className="rounded-[20px] bg-[#e7e9ee] p-4 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
              <p className="text-[9px] font-bold text-[#92959b]">Loading scheduled rides...</p>
            </div>
          ) : scheduledRides.length === 0 ? (
            <div className="rounded-[20px] bg-[#e7e9ee] p-4 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
              <p className="text-[9px] font-bold text-[#92959b]">No upcoming scheduled rides.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledRides.map((ride) => {
                const matchingActive =
                  ride.booking_status === "Waiting" ||
                  ride.trip_status === "Waiting";

                return (
                  <div key={ride.id} className="rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff]">
                    <PassengerInfo ride={ride} />

                    <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-3">
                      <div>
                        <p className="text-[8px] font-extrabold uppercase tracking-[0.11em] text-[#92959b]">Pickup</p>
                        <p className="mt-0.5 text-[19px] font-black tracking-[-0.04em]">
                          {formatRideDate(ride.scheduled_pickup_at)}
                        </p>
                      </div>

                      <div className="rounded-[14px] bg-[#17191f] px-3.5 py-2 text-center text-white">
                        <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-white/45">Time</p>
                        <p className="text-[15px] font-black">
                          {formatRideTime(ride.scheduled_pickup_at)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b]">Fare</p>
                        <p className="mt-0.5 text-[17px] font-black">
                          R{Number(ride.fare_amount || 0).toFixed(0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-[16px] bg-[#e7e9ee] px-3.5 py-3 shadow-[inset_2px_2px_5px_#c7c9ce,inset_-2px_-2px_5px_#ffffff]">
                      <div className="flex items-center gap-2.5">
                        <span className="h-[10px] w-[10px] shrink-0 rounded-full border-[3px] border-[#17191f]" />
                        <p className="min-w-0 flex-1 truncate text-[10px] font-black">
                          {ride.pickup_address}
                        </p>
                      </div>
                      <div className="ml-[4px] my-1 h-3 border-l border-dashed border-[#b6b9bf]" />
                      <div className="flex items-center gap-2.5">
                        <span className="h-[10px] w-[10px] shrink-0 rounded-[3px] bg-[#ff6846]" />
                        <p className="min-w-0 flex-1 truncate text-[10px] font-black">
                          {ride.dropoff_address}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[#ff6846] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]">
                        <ClockIcon />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black">
                          {matchingActive
                            ? "Driver matching is open"
                            : `Matching opens at ${formatRideTime(ride.matching_opens_at)}`}
                        </p>
                        <p className="mt-0.5 text-[8px] font-semibold leading-3.5 text-[#8b8e95]">
                          {matchingActive
                            ? "This scheduled ride is available to accept now."
                            : "Accept becomes available 30 min before pickup."}
                        </p>
                      </div>

                      <div className="rounded-[10px] bg-[#e7e9ee] px-2.5 py-2 text-center shadow-[inset_2px_2px_4px_#c7c9ce,inset_-2px_-2px_4px_#ffffff]">
                        <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-[#9a9da3]">Booking</p>
                        <p className="mt-0.5 text-[8px] font-black">
                          BK-{ride.id.toString().padStart(4, "0")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!matchingActive || status !== "available" || acceptingId === ride.id}
                      onClick={() => acceptRide(ride.id)}
                      className={`mt-3 w-full rounded-[14px] py-2.5 text-[9px] font-black transition active:scale-[0.985] ${
                        matchingActive && status === "available"
                          ? "bg-[#17191f] text-white shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff]"
                          : "cursor-not-allowed bg-[#d3d5da] text-[#8f9298] shadow-[inset_2px_2px_5px_#c2c4c9,inset_-2px_-2px_5px_#ffffff]"
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
        {acceptedTrips.filter((ride) => ride.ride_type !== "scheduled").length > 0 && (
          <section className="mt-7">
            <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
              Driver assigned
            </p>
            <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
              Accepted ride
            </h3>

            <div className="mt-4 space-y-4">
              {acceptedTrips
                .filter((ride) => ride.ride_type !== "scheduled")
                .map((ride) => (
                  <div
                    key={ride.id}
                    className="rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff]"
                  >
                    <div className="flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9ee] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]">
      {ride.passenger_profile_image ? (
        <img
          src={ride.passenger_profile_image}
          alt={ride.full_name || ride.passenger_name || "Passenger"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[15px] font-black text-[#ff6846]">
          {(ride.full_name || ride.passenger_name || "P")
            .charAt(0)
            .toUpperCase()}
        </span>
      )}
    </div>

    <div>
      <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
        Passenger
      </p>

      <p className="mt-1 text-[15px] font-black">
        {ride.full_name || ride.passenger_name || "Passenger"}
      </p>
      {(ride.passenger_phone || ride.phone) && (
        <p className="mt-0.5 text-[9px] font-bold text-[#8b8e95]">
          {ride.passenger_phone || ride.phone}
        </p>
      )}
    </div>
  </div>

  <span className="rounded-full bg-[#17191f] px-3 py-1.5 text-[8px] font-black text-white">
    Accepted
  </span>
</div>

                    <RouteBox
                      pickup={ride.pickup_address}
                      destination={ride.dropoff_address}
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b]">
                          Fare
                        </p>
                        <p className="mt-0.5 text-[17px] font-black">
                          R{Number(ride.fare_amount || 0).toFixed(0)}
                        </p>
                      </div>

                      <p className="text-[8px] font-black text-[#ff6846]">
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
                              "_blank"
                            );
                          }
                        }}
                        className="rounded-[14px] bg-[#17191f] py-3 text-[9px] font-black text-white transition active:scale-[0.985]"
                      >
                        Navigate to pickup
                      </button>

                      <button
                        type="button"
                        disabled={startingId === ride.id}
                        onClick={() => startRide(ride.id)}
                        className="rounded-[14px] bg-[#ff6846] py-3 text-[9px] font-black text-white transition active:scale-[0.985] disabled:opacity-50"
                      >
                        {startingId === ride.id ? "Starting..." : "Start ride"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* ACCEPTED SCHEDULED RIDES */}
        {acceptedTrips.filter((ride) => ride.ride_type === "scheduled").length > 0 && (
          <section className="mt-7">
            <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
              Your upcoming pickup
            </p>
            <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
              Accepted scheduled ride
            </h3>

            <div className="mt-4 space-y-4">
              {acceptedTrips
                .filter((ride) => ride.ride_type === "scheduled")
                .map((ride) => {
                  const pickupMs = new Date(ride.scheduled_pickup_at).getTime();
                  const navigateOpensMs = pickupMs - 15 * 60 * 1000;

                  const canNavigate =
                    Number.isFinite(pickupMs) && nowMs >= navigateOpensMs;

                  const canStart =
                    Number.isFinite(pickupMs) && nowMs >= pickupMs;

                  return (
                  <div key={ride.id} className="rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9ee] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]">
                          {ride.passenger_profile_image ? (
                            <img
                              src={ride.passenger_profile_image}
                              alt={ride.passenger_name || ride.full_name || "Passenger"}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-[15px] font-black text-[#ff6846]">
                              {(ride.passenger_name || ride.full_name || "P")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
                            Passenger
                          </p>
                          <p className="mt-1 truncate text-[15px] font-black">
                            {ride.passenger_name || ride.full_name || "Passenger"}
                          </p>
                          {ride.passenger_phone && (
                            <p className="mt-0.5 text-[9px] font-bold text-[#8b8e95]">
                              {ride.passenger_phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#17191f] px-3 py-1.5 text-[8px] font-black text-white">
                        Accepted
                      </span>
                    </div>

                    <div className="mt-4 rounded-[16px] bg-[#e7e9ee] px-4 py-3 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                      <p className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
                        Scheduled pickup
                      </p>
                      <p className="mt-1 text-[15px] font-black">
                        {formatRideDate(ride.scheduled_pickup_at)} · {formatRideTime(ride.scheduled_pickup_at)}
                      </p>
                    </div>

                    <RouteBox pickup={ride.pickup_address} destination={ride.dropoff_address} />

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b]">Fare</p>
                        <p className="mt-0.5 text-[17px] font-black">R{Number(ride.fare_amount || 0).toFixed(0)}</p>
                      </div>
                      <p className="text-[8px] font-black text-[#ff6846]">
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
                              "_blank"
                            );
                          }
                        }}
                        className={`rounded-[14px] py-3 text-[9px] font-black transition ${
                          canNavigate
                            ? "bg-[#17191f] text-white active:scale-[0.985]"
                            : "cursor-not-allowed bg-[#d3d5da] text-[#8f9298] shadow-[inset_2px_2px_5px_#c2c4c9,inset_-2px_-2px_5px_#ffffff]"
                        }`}
                      >
                        {canNavigate
                          ? "Navigate to pickup"
                          : `Navigate at ${formatRideTime(
                              new Date(navigateOpensMs).toISOString()
                            )}`}
                      </button>

                      <button
                        type="button"
                        disabled={!canStart || startingId === ride.id}
                        onClick={() => startRide(ride.id)}
                        className={`rounded-[14px] py-3 text-[9px] font-black transition ${
                          canStart && startingId !== ride.id
                            ? "bg-[#ff6846] text-white active:scale-[0.985]"
                            : "cursor-not-allowed bg-[#d3d5da] text-[#8f9298] shadow-[inset_2px_2px_5px_#c2c4c9,inset_-2px_-2px_5px_#ffffff]"
                        }`}
                      >
                        {startingId === ride.id
                          ? "Starting..."
                          : canStart
                          ? "Start ride"
                          : `Start at ${formatRideTime(ride.scheduled_pickup_at)}`}
                      </button>
                    </div>

                    <p className="mt-3 text-center text-[8px] font-semibold text-[#92959b]">
                      {!canNavigate
                        ? `Navigation unlocks 15 minutes before pickup at ${formatRideTime(
                            new Date(navigateOpensMs).toISOString()
                          )}.`
                        : !canStart
                        ? `Navigation is available. Start ride unlocks at ${formatRideTime(
                            ride.scheduled_pickup_at
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
            <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
              Trip in progress
            </h3>

            <div className="mt-4 space-y-4">
              {inProgressTrips.map((ride) => (
                <div
                  key={ride.id}
                  className="rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff]"
                >
                  <div className="flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9ee] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]">
      {ride.passenger_profile_image ? (
        <img
          src={ride.passenger_profile_image}
          alt={ride.full_name || ride.passenger_name || "Passenger"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[15px] font-black text-[#ff6846]">
          {(ride.full_name || ride.passenger_name || "P")
            .charAt(0)
            .toUpperCase()}
        </span>
      )}
    </div>

    <div>
      <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
        Passenger
      </p>

      <p className="mt-1 text-[15px] font-black">
        {ride.full_name || ride.passenger_name || "Passenger"}
      </p>
      {(ride.passenger_phone || ride.phone) && (
        <p className="mt-0.5 text-[9px] font-bold text-[#8b8e95]">
          {ride.passenger_phone || ride.phone}
        </p>
      )}
    </div>
  </div>

  <span className="rounded-full bg-[#ff6846] px-3 py-1.5 text-[8px] font-black text-white">
    In Progress
  </span>
</div>

                  <RouteBox
                    pickup={ride.pickup_address}
                    destination={ride.dropoff_address}
                  />

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b]">
                        Fare
                      </p>
                      <p className="mt-0.5 text-[17px] font-black">
                        R{Number(ride.fare_amount || 0).toFixed(0)}
                      </p>
                    </div>
                    <p className="text-[8px] font-black text-[#ff6846]">
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
                            "_blank"
                          );
                        }
                      }}
                      className="rounded-[14px] bg-[#17191f] py-3 text-[9px] font-black text-white"
                    >
                      Navigate to destination
                    </button>

                    <button
                      type="button"
                      disabled={completingId === ride.id}
                      onClick={() => completeRide(ride.id)}
                      className="rounded-[14px] bg-[#ff6846] py-3 text-[9px] font-black text-white disabled:opacity-50"
                    >
                      {completingId === ride.id ? "Completing..." : "Complete ride"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LIVE REQUEST AREA */}
        <section className="mt-7">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#92959b]">
            Live requests
          </p>
          <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
            Rides available now
          </h3>

          {liveRequests.filter((ride) => ride.ride_type !== "scheduled").length === 0 ? (
            <div className="mt-4 rounded-[24px] bg-[#e7e9ee] p-5 text-center shadow-[inset_4px_4px_9px_#c5c7cc,inset_-4px_-4px_9px_#ffffff]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[17px] text-[#ff6846]">
                <RadarIcon />
              </div>
              <p className="mt-3 text-[10px] font-black">
                {status === "available" ? "Looking for rides" : "You're offline"}
              </p>
              <p className="mt-1 text-[8px] font-semibold text-[#96999f]">
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
                  <div key={ride.id} className="rounded-[21px] bg-[#e7e9ee] p-4 shadow-[5px_5px_12px_#c4c6ca,-5px_-5px_12px_#ffffff]">
                    <PassengerInfo ride={ride} />

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[10px] font-black">Ride Now</p>
                      <p className="text-[15px] font-black">R{Number(ride.fare_amount || 0).toFixed(0)}</p>
                    </div>
                    <RouteBox pickup={ride.pickup_address} destination={ride.dropoff_address} />
                    <button
                      type="button"
                      disabled={status !== "available" || acceptingId === ride.id}
                      onClick={() => acceptRide(ride.id)}
                      className="mt-3 w-full rounded-[14px] bg-[#17191f] py-3 text-[9px] font-black text-white disabled:opacity-40"
                    >
                      {acceptingId === ride.id ? "Accepting..." : "Accept ride"}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* RECENT TRIPS */}
        <section className="mt-9">
          <button
            type="button"
            onClick={() => setShowRecentTrips((current) => !current)}
            className="flex w-full items-center justify-between rounded-[20px] bg-[#e7e9ee] px-4 py-4 text-left shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff] transition active:scale-[0.99]"
            aria-expanded={showRecentTrips}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[#ff6846] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]">
                <HistoryIcon />
              </div>

              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#92959b]">
                  Activity
                </p>
                <p className="mt-1 text-[12px] font-black">Recent trips</p>
                <p className="mt-0.5 text-[8px] font-semibold text-[#96999f]">
                  View your previous RouteX rides
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#ff6846] px-2 text-[10px] font-black text-white">
                {completedTrips.length}
              </span>

              <span
                className={`text-[#92959b] transition-transform duration-200 ${
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
                <div className="rounded-[18px] bg-[#e7e9ee] px-4 py-5 text-center shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff]">
                  <p className="text-[9px] font-semibold text-[#96999f]">
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

        {/* REVIEWS */}
        <section className="mt-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#92959b]">
                Feedback
              </p>
              <p className="mt-1 text-[12px] font-black">Passenger reviews</p>
            </div>
            <span className="text-[9px] font-bold text-[#92959b]">
              {driverRating.review_count} {driverRating.review_count === 1 ? "review" : "reviews"}
            </span>
          </div>

          {driverReviews.length === 0 ? (
            <div className="mt-4 rounded-[18px] bg-[#e7e9ee] px-4 py-4 text-center shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff]">
              <p className="text-[9px] font-semibold text-[#96999f]">
                No passenger reviews yet.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {driverReviews.slice(0, 5).map((review: any) => (
                <div
                  key={review.id}
                  className="rounded-[18px] bg-[#e7e9ee] px-4 py-4 shadow-[3px_3px_8px_#c5c7cc,-3px_-3px_8px_#ffffff]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black">
                      {review.passenger_name || "Passenger"}
                    </p>
                    <p className="text-[9px] font-black text-[#ff6846]">
                      {Number(review.rating || 0).toFixed(1)} ★
                    </p>
                  </div>
                  {review.review_text && (
                    <p className="mt-2 text-[9px] font-semibold leading-4 text-[#85888f]">
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
            <div className="w-full max-w-sm rounded-[26px] bg-[#e7e9ee] p-5 shadow-[10px_10px_28px_rgba(0,0,0,0.22),-6px_-6px_18px_rgba(255,255,255,0.75)]">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                    appPopup.tone === "error"
                      ? "bg-[#ff6846] text-white"
                      : "bg-[#17191f] text-white"
                  }`}
                >
                  <span className="text-[18px] font-black">!</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-black text-[#17191f]">
                    {appPopup.title}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold leading-5 text-[#7c7f86]">
                    {appPopup.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAppPopup(null)}
                className="mt-5 w-full rounded-[16px] bg-[#17191f] px-4 py-3.5 text-[11px] font-black text-white active:scale-[0.985]"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <footer className="pt-10 text-center">
          <p className="text-[9px] font-semibold text-[#a0a3a9]">
            RouteX • Driver Portal
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
    ride?.passenger_phone ||
    ride?.phone ||
    ride?.passenger_mobile ||
    "";

  const image =
    ride?.passenger_profile_image ||
    ride?.profile_image ||
    ride?.passenger_photo ||
    "";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7e9ee] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[15px] font-black text-[#ff6846]">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
          Passenger
        </p>
        <p className="mt-1 truncate text-[15px] font-black">
          {name}
        </p>
        {phone && (
          <p className="mt-0.5 text-[9px] font-bold text-[#8b8e95]">
            {phone}
          </p>
        )}
      </div>
    </div>
  );
}

function RouteBox({
  pickup,
  destination,
}: {
  pickup: string;
  destination: string;
}) {
  return (
    <div className="mt-5 rounded-[19px] bg-[#e7e9ee] px-4 py-4 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
      <RouteRow type="pickup" label="Pickup" value={pickup} />
      <div className="ml-[5px] h-5 border-l border-dashed border-[#b6b9bf]" />
      <RouteRow type="destination" label="Destination" value={destination} />
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
          type === "pickup"
            ? "border-[3px] border-[#17191f]"
            : "bg-[#ff6846]"
        }`}
      />
      <div className="min-w-0">
        <p className="text-[8px] font-extrabold uppercase tracking-[0.11em] text-[#9a9da3]">
          {label}
        </p>
        <p className="mt-1 text-[10px] font-black leading-4">
          {value || "Location unavailable"}
        </p>
      </div>
    </div>
  );
}

function HistoryRide({ trip }: { trip: any }) {
  return (
    <div className="flex items-center rounded-[18px] bg-[#e7e9ee] px-4 py-3.5 shadow-[3px_3px_8px_#c5c7cc,-3px_-3px_8px_#ffffff]">
      <div className="flex h-9 w-9 items-center justify-center rounded-[12px] text-[#ff6846] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]">
        <RideIcon />
      </div>
      <div className="ml-3 min-w-0 flex-1">
        <p className="truncate text-[10px] font-black">
          {trip.dropoff_address || "Completed ride"}
        </p>
        <p className="mt-0.5 text-[8px] font-semibold text-[#999ca2]">
          Completed · BK-{trip.id.toString().padStart(4, "0")}
        </p>
      </div>
      <p className="text-[11px] font-black">R{trip.fare_amount}</p>
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill="#ff6846" stroke="#ff6846" strokeWidth="2">
      <path d="m12 2 3 6 6.5.9-4.7 4.6 1.1 6.5-5.9-3.1L6.1 20l1.1-6.5-4.7-4.6L9 8Z" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <path d="M12 2v10" />
      <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
    </svg>
  );
}

function RideIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round">
      <path d="m5 17 1-7 2-4h8l2 4 1 7" />
      <path d="M3 13h18" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function NavigationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-8-8 18-2-8Z" />
    </svg>
  );
}


function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
