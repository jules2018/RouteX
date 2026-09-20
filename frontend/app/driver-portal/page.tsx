
"use client";

import { openNavigation } from "../lib/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { showNotification } from "../lib/notifications";
import { API_URL } from "../lib/api";

export default function DriverPortalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [acceptedTrips, setAcceptedTrips] = useState<any[]>([]);
  const [inProgressTrips, setInProgressTrips] = useState<any[]>([]);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [driverReviews, setDriverReviews] = useState<any[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [status, setStatus] = useState("offline");

  const [driverRating, setDriverRating] = useState<{
  average_rating: number | null;
  review_count: number;
}>({
  average_rating: null,
  review_count: 0,
});
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  const availableTrips = requests;

  const handleTouchStart = (e: React.TouchEvent) => {
  setTouchEnd(null);
  setTouchStart(e.targetTouches[0].clientX);
};

const handleTouchMove = (e: React.TouchEvent) => {
  setTouchEnd(e.targetTouches[0].clientX);
};

const handleTouchEnd = () => {
  if (touchStart === null || touchEnd === null) return;

  const distance = touchStart - touchEnd;

  // Require a reasonable swipe distance
  const minimumSwipeDistance = 60;

  // SWIPE LEFT
  if (distance > minimumSwipeDistance) {
    setActivePage((current) => Math.min(current + 1, 2));
  }

  // SWIPE RIGHT
  if (distance < -minimumSwipeDistance) {
    setActivePage((current) => Math.max(current - 1, 0));
  }

  setTouchStart(null);
  setTouchEnd(null);
};

  const loadTrips = () => {
    fetch(`${API_URL}/accepted-trips`)
      .then((res) => res.json())
      .then((data) => setAcceptedTrips(data));

    fetch(`${API_URL}/in-progress-trips`)
      .then((res) => res.json())
      .then((data) => setInProgressTrips(data));

    fetch(`${API_URL}/completed-trips`)
      .then((res) => res.json())
      .then((data) => setCompletedTrips(data));

  fetch(`${API_URL}/trip-requests`)
  .then((res) => res.json())
  .then((data) => setRequests(data));
};
  useEffect(() => {
    const storedDriver = localStorage.getItem("driver");

    if (storedDriver) {
      const parsedDriver = JSON.parse(storedDriver);
      setDriver(parsedDriver);

      loadDriverRating(Number(parsedDriver.id));
      loadDriverReviews(Number(parsedDriver.id));

      fetch(`${API_URL}/driver-list`)
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

  /* =========================
   LIVE DRIVER GPS TRACKING
========================= */

useEffect(() => {
  if (!driver?.id || status !== "available") {
    return;
  }

  if (!navigator.geolocation) {
    console.error("Geolocation is not supported");
    return;
  }

  console.log("STARTING LIVE DRIVER GPS");

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      console.log("DRIVER LIVE GPS:", {
        latitude,
        longitude,
        accuracy,
      });

      try {
        const response = await fetch(
          `${API_URL}/drivers/${driver.id}/location`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude,
              longitude,
            }),
          }
        );

        if (!response.ok) {
          console.error(
            "Unable to update driver live location:",
            response.status
          );
        }
      } catch (error) {
        console.error(
          "DRIVER LOCATION UPDATE ERROR:",
          error
        );
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

  return () => {
    console.log("STOPPING LIVE DRIVER GPS");
    navigator.geolocation.clearWatch(watchId);
  };
}, [driver?.id, status]);

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
      `${API_URL}/driver/upload-photo`,
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

const loadDriverRating = async (driverId: number) => {
  try {
    const response = await fetch(
      `${API_URL}/drivers/${driverId}/rating`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load driver rating: ${response.status}`
      );
    }

    const data = await response.json();

    setDriverRating({
      average_rating:
        data.average_rating !== null
          ? Number(data.average_rating)
          : null,
      review_count: Number(data.review_count) || 0,
    });

    console.log("DRIVER RATING:", data);

  } catch (error) {
    console.error("Error loading driver rating:", error);
  }
};

const loadDriverReviews = async (driverId: number) => {
  try {
    const response = await fetch(
      `${API_URL}/drivers/${driverId}/reviews`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load driver reviews: ${response.status}`
      );
    }

    const data = await response.json();

    setDriverReviews(data);

    console.log("DRIVER REVIEWS:", data);

  } catch (error) {
    console.error("Error loading driver reviews:", error);
  }
};

 const toggleStatus = async () => {
  const newStatus =
    status === "available"
      ? "Offline"
      : "Available";

  try {
    let latitude = null;
    let longitude = null;

    if (newStatus === "Available") {
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
      `${API_URL}/drivers/${driver?.id}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          current_lat: latitude,
          current_lng: longitude,
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

    alert(
      newStatus === "Available"
        ? "RouteX needs your location before you can go online."
        : "Unable to update your status."
    );
  }
};

  const acceptTrip = async (tripId: number) => {
    setLoadingAction(tripId);

    try {
      const response = await fetch(
        `${API_URL}/trip-requests/${tripId}/accept`,
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
        `${API_URL}/trip-requests/${tripId}/start`,
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
        `${API_URL}/trip-requests/${tripId}/complete`,
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
    <main className="min-h-[100dvh] bg-[#e7e9ee] text-[#17191f]">
      <div
        className="mx-auto min-h-[100dvh] w-full max-w-md px-5 pb-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* HEADER */}
        <header className="flex items-center justify-between pt-6">
          <h1 className="text-[25px] font-black tracking-[-0.06em]">
            Route<span className="text-[#ff6846]">X</span>
          </h1>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("driver");
              window.location.href = "/driver-login";
            }}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[#6f7279] shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff] active:scale-95"
            aria-label="Log out"
            title="Log out"
          >
            <MenuIcon />
          </button>
        </header>

        {/* DRIVER */}
        <section className="mt-8 flex items-center gap-4">
          {/* PROFILE PHOTO */}
          <div className="relative shrink-0">
            <div className="relative flex h-[82px] w-[82px] items-center justify-center rounded-[27px] bg-[#e7e9ee] shadow-[7px_7px_15px_#c4c6ca,-7px_-7px_15px_#ffffff]">
              <div className="relative flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-[21px] bg-[#dfe1e6] text-[20px] font-black text-[#ff6846] shadow-[inset_3px_3px_7px_#c2c4c9,inset_-3px_-3px_7px_#ffffff]">
                <span className="absolute inset-0 flex items-center justify-center">
                  {driver?.full_name?.charAt(0)?.toUpperCase() || "D"}
                </span>

                {driver?.profile_image && (
                  <img
                    src={
                      driver.profile_image.startsWith("http")
                        ? driver.profile_image
                        : `${API_URL}/uploads/${driver.profile_image}`
                    }
                    alt={driver?.full_name || "Driver"}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </div>

              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-[4px] border-[#e7e9ee] ${
                  status === "available" ? "bg-[#35b86b]" : "bg-[#a2a5ab]"
                }`}
              />
            </div>

            <label
              className="absolute -right-2 -top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-[11px] bg-[#ff6846] text-white shadow-[3px_3px_7px_#c1c3c8,-2px_-2px_6px_#ffffff] active:scale-95"
              title="Change profile photo"
            >
              <CameraIcon />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPhoto(file);
                }}
              />
            </label>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#ff6846]">
              Driver portal
            </p>

            <h2 className="mt-1 truncate text-[26px] font-black tracking-[-0.045em]">
              Hi, {driver?.full_name?.trim().split(/\s+/)[0] || "Driver"}.
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

        {/* SELECTED PHOTO */}
        {photo && (
          <section className="mt-4 flex items-center justify-between rounded-[18px] bg-[#e7e9ee] px-4 py-3 shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff]">
            <div className="min-w-0 pr-3">
              <p className="text-[10px] font-black">New profile photo</p>
              <p className="mt-0.5 truncate text-[8px] font-semibold text-[#92959b]">
                {photo.name}
              </p>
            </div>
            <button
              type="button"
              onClick={uploadPhoto}
              className="shrink-0 rounded-[12px] bg-[#17191f] px-4 py-2.5 text-[9px] font-black text-white active:scale-[0.98]"
            >
              Save photo
            </button>
          </section>
        )}

        {/* ONLINE CONTROL */}
        <section className="mt-7 flex items-center justify-between rounded-[24px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c4c6ca,-6px_-6px_14px_#ffffff]">
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
            aria-label={status === "available" ? "Go offline" : "Go online"}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                status === "available" ? "left-[27px]" : "left-1"
              }`}
            />
          </button>
        </section>

        {/* HOME / RIDES / REVIEWS */}
        <nav className="mt-7 grid grid-cols-3 gap-2 rounded-[18px] bg-[#e7e9ee] p-1.5 shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff]">
          {["Home", "Rides", "Reviews"].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setActivePage(index)}
              className={`rounded-[14px] py-3 text-[9px] font-black transition ${
                activePage === index
                  ? "bg-[#e7e9ee] text-[#17191f] shadow-[4px_4px_8px_#c5c7cc,-4px_-4px_8px_#ffffff]"
                  : "text-[#92959b]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* HOME */}
        {activePage === 0 && (
          <>

        {/* CURRENT / IN-PROGRESS RIDES */}
        {myInProgressTrips.map((trip) => (
          <section key={trip.id} className="mt-8">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
              Active trip
            </p>
            <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
              Passenger on board
            </h3>

            <div className="mt-4 rounded-[26px] bg-[#e7e9ee] p-5 shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#e7e9ee] text-[14px] font-black shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]">
                  {trip.full_name?.charAt(0)?.toUpperCase() || "P"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-black">
                    {trip.full_name || "Passenger"}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold text-[#91949a]">
                    {trip.phone}
                  </p>
                </div>

                <p className="text-[20px] font-black">R{trip.fare_amount}</p>
              </div>

              <RouteBox
                pickup={trip.pickup_address}
                destination={trip.dropoff_address}
              />

              <button
                type="button"
                onClick={() =>
                  openNavigation(trip.destination_lat, trip.destination_lng)
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#e7e9ee] py-3.5 text-[9px] font-black shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]"
              >
                <NavigationIcon />
                Navigate to destination
              </button>

              <button
                type="button"
                onClick={() => completeTrip(trip.id)}
                disabled={loadingAction === trip.id}
                className="mt-4 w-full rounded-[17px] bg-[#ff6846] py-4 text-[11px] font-black text-white shadow-[4px_4px_9px_#c1c3c8,-3px_-3px_8px_#ffffff] active:scale-[0.985] disabled:opacity-50"
              >
                {loadingAction === trip.id ? "Completing..." : "Complete trip"}
              </button>
            </div>
          </section>
        ))}

        {/* ACCEPTED RIDES */}
        {myAcceptedTrips.map((trip) => (
          <section key={trip.id} className="mt-8">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
              Active trip
            </p>
            <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
              Collect passenger
            </h3>

            <div className="mt-4 rounded-[26px] bg-[#e7e9ee] p-5 shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#e7e9ee] text-[14px] font-black shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]">
                  {trip.full_name?.charAt(0)?.toUpperCase() || "P"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-black">
                    {trip.full_name || "Passenger"}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold text-[#91949a]">
                    {trip.phone}
                  </p>
                </div>

                <p className="text-[20px] font-black">R{trip.fare_amount}</p>
              </div>

              <RouteBox
                pickup={trip.pickup_address}
                destination={trip.dropoff_address}
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openNavigation(trip.pickup_lat, trip.pickup_lng)}
                  className="flex items-center justify-center gap-2 rounded-[15px] bg-[#e7e9ee] py-3.5 text-[9px] font-black shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]"
                >
                  <NavigationIcon />
                  Navigate
                </button>

                <button
                  type="button"
                  onClick={() => startTrip(trip.id)}
                  disabled={loadingAction === trip.id}
                  className="rounded-[15px] bg-[#17191f] py-3.5 text-[10px] font-black text-white shadow-[4px_4px_9px_#c1c3c8,-3px_-3px_8px_#ffffff] active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingAction === trip.id ? "Starting..." : "Start trip"}
                </button>
              </div>
            </div>
          </section>
        ))}

        {/* NEW RIDE REQUESTS */}
        {status === "available" && availableTrips.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                  New request
                </p>
                <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
                  Ride available
                </h3>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6846] text-white shadow-[3px_3px_8px_#c3c5ca,-3px_-3px_8px_#ffffff]">
                <BellIcon />
              </div>
            </div>

            <div className="space-y-5">
              {availableTrips.map((request) => (
                <div
                  key={request.id}
                  className="overflow-hidden rounded-[26px] bg-[#e7e9ee] shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]"
                >
                  <div className="flex items-start justify-between px-5 pt-5">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#96999f]">
                        Trip fare
                      </p>
                      <p className="mt-1 text-[27px] font-black tracking-[-0.05em]">
                        R{request.fare_amount}
                      </p>
                    </div>

                    <div className="rounded-[12px] bg-[#e7e9ee] px-3 py-2 text-right shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]">
                      <p className="text-[10px] font-black">
                        BK-{request.id.toString().padStart(4, "0")}
                      </p>
                      <p className="mt-0.5 text-[8px] font-semibold text-[#92959b]">
                        Ride request
                      </p>
                    </div>
                  </div>

                  {Number(request.discount_amount || 0) > 0 && (
                    <div className="mx-5 mt-4 rounded-[15px] bg-[#e7e9ee] px-4 py-3 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#ff6846]">
                        RouteX Promo
                      </p>
                      <p className="mt-1 text-[10px] font-extrabold">
                        RouteX covers R{Number(request.discount_amount).toFixed(2)}
                      </p>
                      <p className="mt-1 text-[9px] font-semibold text-[#8d9096]">
                        Your full fare remains R
                        {Number(request.fare_amount).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="mx-5">
                    <RouteBox
                      pickup={request.pickup_address}
                      destination={request.dropoff_address}
                    />
                  </div>

                  <div className="mx-5 mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e7e9ee] text-[12px] font-black shadow-[4px_4px_8px_#c5c7cc,-4px_-4px_8px_#ffffff]">
                      {request.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-black">
                        {request.full_name || "Passenger"}
                      </p>
                      <p className="mt-0.5 text-[8px] font-semibold text-[#999ca2]">
                        {request.phone}
                      </p>
                    </div>

                    <span className="text-[9px] font-bold text-[#8c8f95]">
                      {new Date(request.travel_date).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  <div className="p-5">
                    <button
                      type="button"
                      onClick={() => acceptTrip(request.id)}
                      disabled={loadingAction === request.id}
                      className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#17191f] py-3.5 text-[10px] font-black text-white shadow-[4px_4px_9px_#c1c3c8,-3px_-3px_8px_#ffffff] active:scale-[0.98] disabled:opacity-50"
                    >
                      {loadingAction === request.id ? "Accepting..." : "Accept ride"}
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6846]">
                        <ArrowIcon />
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WAITING / OFFLINE */}
        {myAcceptedTrips.length === 0 &&
          myInProgressTrips.length === 0 &&
          availableTrips.length === 0 &&
          status === "available" && (
            <section className="mt-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[17px] text-[#ff6846] shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff]">
                <RadarIcon />
              </div>
              <p className="mt-3 text-[10px] font-black">Looking for rides</p>
              <p className="mt-1 text-[8px] font-semibold text-[#96999f]">
                We'll show your next request here.
              </p>
            </section>
          )}

        {status !== "available" && (
          <section className="mt-8 rounded-[24px] bg-[#e7e9ee] p-5 text-center shadow-[inset_4px_4px_9px_#c5c7cc,inset_-4px_-4px_9px_#ffffff]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] text-[#96999f]">
              <PowerIcon />
            </div>
            <p className="mt-2 text-[11px] font-black">You're offline</p>
            <p className="mx-auto mt-1 max-w-[230px] text-[8px] font-semibold leading-4 text-[#96999f]">
              Go online when you're ready to start receiving RouteX ride requests.
            </p>
          </section>
        )}

          </>
        )}

        {/* RIDES */}
        {activePage === 1 && (
          <>
            {/* ACTIVE / ACCEPTED RIDES */}
            {myInProgressTrips.length === 0 && myAcceptedTrips.length === 0 && (
              <section className="mt-8 rounded-[24px] bg-[#e7e9ee] p-5 text-center shadow-[inset_4px_4px_9px_#c5c7cc,inset_-4px_-4px_9px_#ffffff]">
                <p className="text-[11px] font-black">No active rides</p>
                <p className="mt-1 text-[8px] font-semibold text-[#96999f]">
                  Accepted and in-progress rides will appear here.
                </p>
              </section>
            )}

            {myAcceptedTrips.map((trip) => (
              <section key={`rides-accepted-${trip.id}`} className="mt-8">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                  Accepted
                </p>
                <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
                  Collect passenger
                </h3>
                <div className="mt-4 rounded-[26px] bg-[#e7e9ee] p-5 shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-black">{trip.full_name || "Passenger"}</p>
                      <p className="mt-1 text-[9px] font-semibold text-[#91949a]">{trip.phone}</p>
                    </div>
                    <p className="text-[20px] font-black">R{trip.fare_amount}</p>
                  </div>
                  <RouteBox pickup={trip.pickup_address} destination={trip.dropoff_address} />
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => openNavigation(trip.pickup_lat, trip.pickup_lng)}
                      className="flex items-center justify-center gap-2 rounded-[15px] bg-[#e7e9ee] py-3.5 text-[9px] font-black shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]"
                    >
                      <NavigationIcon /> Navigate
                    </button>
                    <button
                      type="button"
                      onClick={() => startTrip(trip.id)}
                      disabled={loadingAction === trip.id}
                      className="rounded-[15px] bg-[#17191f] py-3.5 text-[10px] font-black text-white disabled:opacity-50"
                    >
                      {loadingAction === trip.id ? "Starting..." : "Start trip"}
                    </button>
                  </div>
                </div>
              </section>
            ))}

            {myInProgressTrips.map((trip) => (
              <section key={`rides-progress-${trip.id}`} className="mt-8">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                  In progress
                </p>
                <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em]">
                  Current ride
                </h3>
                <div className="mt-4 rounded-[26px] bg-[#e7e9ee] p-5 shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-black">{trip.full_name || "Passenger"}</p>
                      <p className="mt-1 text-[9px] font-semibold text-[#91949a]">{trip.phone}</p>
                    </div>
                    <p className="text-[20px] font-black">R{trip.fare_amount}</p>
                  </div>
                  <RouteBox pickup={trip.pickup_address} destination={trip.dropoff_address} />
                  <button
                    type="button"
                    onClick={() => completeTrip(trip.id)}
                    disabled={loadingAction === trip.id}
                    className="mt-4 w-full rounded-[17px] bg-[#ff6846] py-4 text-[11px] font-black text-white disabled:opacity-50"
                  >
                    {loadingAction === trip.id ? "Completing..." : "Complete trip"}
                  </button>
                </div>
              </section>
            ))}

        {/* RECENT TRIPS */}
        <section className="mt-9">
          <div className="flex w-full items-center justify-between rounded-[20px] bg-[#e7e9ee] px-4 py-4 shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#92959b]">
                Activity
              </p>
              <p className="mt-1 text-[12px] font-black">Recent trips</p>
            </div>

            <span className="flex h-8 min-w-8 items-center justify-center rounded-[11px] px-2 text-[10px] font-black shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]">
              {myCompletedTrips.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {myCompletedTrips.length === 0 ? (
              <div className="rounded-[18px] bg-[#e7e9ee] px-4 py-4 text-center shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff]">
                <p className="text-[9px] font-semibold text-[#96999f]">
                  No completed rides yet.
                </p>
              </div>
            ) : (
              myCompletedTrips.slice(0, 5).map((trip) => (
                <HistoryRide key={trip.id} trip={trip} />
              ))
            )}
          </div>
        </section>

          </>
        )}

        {/* REVIEWS PAGE */}
        {activePage === 2 && (
          <>
            <section className="mt-8 rounded-[24px] bg-[#e7e9ee] p-5 shadow-[6px_6px_14px_#c4c6ca,-6px_-6px_14px_#ffffff]">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#ff6846]">
                Driver rating
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-[36px] font-black tracking-[-0.06em]">
                  {driverRating.average_rating !== null
                    ? driverRating.average_rating.toFixed(1)
                    : "—"}
                </span>
                <div className="mb-1.5 flex items-center gap-1">
                  <StarIcon />
                  <span className="text-[9px] font-bold text-[#92959b]">
                    {driverRating.review_count} review
                    {driverRating.review_count === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
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
              {driverRating.review_count} review
              {driverRating.review_count === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {driverReviews.length === 0 ? (
              <div className="rounded-[18px] bg-[#e7e9ee] px-4 py-4 text-center shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff]">
                <p className="text-[9px] font-semibold text-[#96999f]">
                  No passenger reviews yet.
                </p>
              </div>
            ) : (
              driverReviews.slice(0, 5).map((review: any, index: number) => (
                <div
                  key={review.id ?? index}
                  className="rounded-[18px] bg-[#e7e9ee] px-4 py-4 shadow-[3px_3px_8px_#c5c7cc,-3px_-3px_8px_#ffffff]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black">
                      {review.passenger_name || review.full_name || "Passenger"}
                    </p>
                    <div className="flex items-center gap-1">
                      <StarIcon />
                      <span className="text-[9px] font-black">
                        {Number(review.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="mt-2 text-[9px] font-semibold leading-4 text-[#777b82]">
                      {review.review_text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

          </>
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

function MenuIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <path d="M5 7h14M5 12h14M5 17h14" />
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
