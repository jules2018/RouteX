
"use client";

import { useEffect, useState } from "react";
import { showNotification } from "../lib/notifications";

export default function BookRidePage() {
  const [loading, setLoading] = useState(false);
  const [passenger, setPassenger] = useState<any>(null);

  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);

  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [dropoffResults, setDropoffResults] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const API_BASE_URL = "https://routex-1-z1hf.onrender.com";

  const [fare, setFare] = useState("");

  const [form, setForm] = useState({
    pickup_area: "",
    dropoff_area: "",
    pickup_town: "",
    pickup_address: "",
    dropoff_town: "",
    dropoff_address: "",
    travel_date: new Date().toISOString().split("T")[0],
  });

  /* =========================
     LOAD PASSENGER
  ========================= */

  useEffect(() => {
    const storedPassenger = localStorage.getItem("passenger");

    if (storedPassenger) {
      setPassenger(JSON.parse(storedPassenger));
    }
  }, []);

  /* =========================
     LOAD AREAS
  ========================= */

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const response = await fetch(
          "https://routex-1-z1hf.onrender.com/areas"
        );

        const text = await response.text();
console.log(text);

       // setAreas(data);
      } catch (error) {
        console.error("Failed to load areas", error);
      }
    };

    loadAreas();
  }, []);

  /* =========================
     ADDRESS SEARCH
  ========================= */

  const searchAddress = async (
    query: string,
    type: "pickup" | "dropoff"
  ) => {
    if (!query) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=jsonv2`
      );

      const data = await response.json();

      if (type === "pickup") {
        setPickupResults(data);
      } else {
        setDropoffResults(data);
      }
    } catch (error) {
      console.error("Address search failed", error);
    }
  };

  /* =========================
     FARE CALCULATION
  ========================= */

  useEffect(() => {
    if (form.pickup_area && form.dropoff_area) {
      calculateFare(
        form.pickup_area,
        form.dropoff_area
      );
    }
  }, [
    form.pickup_area,
    form.dropoff_area,
  ]);

  const calculateFare = async (
    pickupArea: string,
    dropoffArea: string
  ) => {
    if (!pickupArea || !dropoffArea) return;

    try {
      const response = await fetch(
        `https://routex-1-z1hf.onrender.com/calculate-fare?pickup_area=${encodeURIComponent(
          pickupArea
        )}&dropoff_area=${encodeURIComponent(
          dropoffArea
        )}`
      );

      const data = await response.json();

      console.log("Fare data:", data);

      const calculatedFare = Number(data.fare);

      setFare(data.fare);

      console.log("Base Fare:", calculatedFare);
      console.log("Discount:", 0);
      console.log("Final Fare:", calculatedFare);

    } catch (error) {
      console.error(
        "Fare calculation failed",
        error
      );
    }
  };

  /* =========================
     BOOK RIDE
  ========================= */

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (
      !form.pickup_area ||
      !form.pickup_address ||
      !form.dropoff_area ||
      !form.dropoff_address ||
      !form.travel_date
    ) {
      alert("Please complete all fields");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        "https://routex-1-z1hf.onrender.com/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  passenger_id: passenger?.id,
  pickup_area: form.pickup_area,
  dropoff_area: form.dropoff_area,
  pickup_address: form.pickup_address,
  dropoff_address: form.dropoff_address,
  travel_date: form.travel_date,
  fare_amount: fare,
  promo_code: promoCode,
}),
        }
      );

      const data = await response.json();
      

      if (!response.ok) {
        alert(
          data.message ||
            data.error ||
            "Booking failed"
        );

        setLoading(false);
        return;
      }

      alert("Booking created successfully");

      showNotification(
        "✅ Booking Confirmed",
        "Your RouteX trip has been booked successfully."
      );
      setPromoCode("");

      setForm({
        pickup_area: "",
        dropoff_area: "",
        pickup_town: "",
        pickup_address: "",
        dropoff_town: "",
        dropoff_address: "",
        travel_date: "",
      });

      setFare("");
    } catch (error) {
      console.error("Booking failed", error);
      alert("Unable to create booking. Please try again.");
    }

    setLoading(false);
  };

  /* =========================
     AREAS
  ========================= */

  const areaOptions = [
    "Bellvue",
    "Blydeville",
    "Die Rand",
    "Flora Park",
    "Keidebees",
    "Klippunt",
    "Laboria",
    "Lemoendraai",
    "Louisvale",
    "Louisvale Weg",
    "Middelpos",
    "Morning Glory",
    "Nuwerus",
    "Oosterville",
    "Paballelo",
    "Progress",
    "Raaswater",
    "Rosedale",
    "Ses Brugge",
    "Straussburg",
    "Swartkop",
    "Upington Central",
    "Vaalkroek",
  ];

  return (
    <main className="min-h-screen bg-slate-100 pb-10">

      {/* =========================
          TOP HEADER
      ========================= */}

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-5 py-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                RouteX
              </p>

              <h1 className="text-2xl font-bold text-slate-900">
                Where are you going?
              </h1>
            </div>

            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-xl">🚕</span>
            </div>

          </div>

        </div>
      </div>


      {/* =========================
          BOOKING CARD
      ========================= */}

      <div className="max-w-2xl mx-auto px-4 py-5">

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* =========================
              LOCATIONS
          ========================= */}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

            <div className="p-5">

              <div className="flex">

                {/* CONNECTING LINE */}

                <div className="flex flex-col items-center mr-4 pt-2">

                  <div className="w-3 h-3 rounded-full bg-teal-600" />

                  <div className="w-px h-20 bg-slate-300" />

                  <div className="w-3 h-3 bg-slate-900" />

                </div>


                {/* LOCATION FIELDS */}

                <div className="flex-1 space-y-5">

                  {/* PICKUP */}

                  <div>

                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Pickup
                    </label>

                    <select
                      value={form.pickup_area}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          pickup_area:
                            e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">
                        Select pickup area
                      </option>

                      {areaOptions.map(
                        (area) => (
                          <option
                            key={area}
                            value={area}
                          >
                            {area}
                          </option>
                        )
                      )}
                    </select>

                    <input
                      placeholder="House number, street or landmark"
                      value={
                        form.pickup_address
                      }
                      onChange={async (e) => {
                        const value =
                          e.target.value;

                        setForm({
                          ...form,
                          pickup_address:
                            value,
                        });

                        if (
                          value.length < 2
                        ) {
                          setPickupSuggestions(
                            []
                          );
                          return;
                        }

                        try {
                          const response =
                            await fetch(
                              `https://routex-1-z1hf.onrender.com/addresses/search?q=${value}`
                            );

                          const data =
                            await response.json();

                          setPickupSuggestions(
                            data
                          );
                        } catch (error) {
                          console.error(
                            "Pickup address search failed",
                            error
                          );
                        }
                      }}
                      className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-teal-500"
                    />

                    {/* PICKUP SUGGESTIONS */}

                    {pickupSuggestions.length >
                      0 && (
                      <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">

                        {pickupSuggestions.map(
                          (item) => (
                            <button
                              key={
                                item.address
                              }
                              type="button"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  pickup_address:
                                    item.address,
                                });

                                setPickupSuggestions(
                                  []
                                );
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0"
                            >
                              <div className="font-medium text-slate-900">
                                {item.address}
                              </div>

                              <div className="text-xs text-slate-500 mt-1">
                                {
                                  item.area_name
                                }
                              </div>
                            </button>
                          )
                        )}

                      </div>
                    )}

                  </div>


                  {/* DROP-OFF */}

                  <div>

                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Drop-off
                    </label>

                    <select
                      value={form.dropoff_area}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dropoff_area:
                            e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">
                        Select drop-off area
                      </option>

                      {areaOptions.map(
                        (area) => (
                          <option
                            key={area}
                            value={area}
                          >
                            {area}
                          </option>
                        )
                      )}
                    </select>

                    <input
                      placeholder="House number, street or landmark"
                      value={
                        form.dropoff_address
                      }
                      onChange={async (e) => {
                        const value =
                          e.target.value;

                        setForm({
                          ...form,
                          dropoff_address:
                            value,
                        });

                        if (
                          value.length < 2
                        ) {
                          setDropoffSuggestions(
                            []
                          );
                          return;
                        }

                        try {
                          const response =
                            await fetch(
                              `https://routex-1-z1hf.onrender.com/addresses/search?q=${value}`
                            );

                          const data =
                            await response.json();

                          setDropoffSuggestions(
                            data
                          );
                        } catch (error) {
                          console.error(
                            "Dropoff address search failed",
                            error
                          );
                        }
                      }}
                      className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-teal-500"
                    />

                    {/* DROPOFF SUGGESTIONS */}

                    {dropoffSuggestions.length >
                      0 && (
                      <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">

                        {dropoffSuggestions.map(
                          (item) => (
                            <button
                              key={
                                item.address
                              }
                              type="button"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  dropoff_address:
                                    item.address,
                                });

                                setDropoffSuggestions(
                                  []
                                );
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0"
                            >
                              <div className="font-medium text-slate-900">
                                {item.address}
                              </div>

                              <div className="text-xs text-slate-500 mt-1">
                                {
                                  item.area_name
                                }
                              </div>
                            </button>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =========================
              TRAVEL DATE
          ========================= */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">

            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Travel date
            </label>

            <input
              type="date"
              min={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              value={form.travel_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  travel_date:
                    e.target.value,
                })
              }
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-teal-500"
            />

          </div>


          {/* =========================
              FARE
          ========================= */}

          {fare && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-400">
                    Estimated fare
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    R{fare}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs text-slate-400">
                    RouteX
                  </p>

                  <p className="text-sm text-slate-300 mt-1">
                    Driver assigned when available
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* =========================
              TRIP SUMMARY
          ========================= */}

          {fare && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">

              <h2 className="font-bold text-slate-900 mb-4">
                Trip summary
              </h2>

              <div className="space-y-3">

                <div className="flex gap-3">

                  <div className="w-2 h-2 rounded-full bg-teal-600 mt-2" />

                  <div>
                    <p className="text-xs text-slate-500">
                      Pickup
                    </p>

                    <p className="font-medium text-slate-900">
                      {form.pickup_address}
                    </p>

                    <p className="text-sm text-slate-500">
                      {form.pickup_area}
                    </p>
                  </div>

                </div>


                <div className="flex gap-3">

                  <div className="w-2 h-2 bg-slate-900 mt-2" />

                  <div>
                    <p className="text-xs text-slate-500">
                      Drop-off
                    </p>

                    <p className="font-medium text-slate-900">
                      {form.dropoff_address}
                    </p>

                    <p className="text-sm text-slate-500">
                      {form.dropoff_area}
                    </p>
                  </div>

                </div>


                <div className="pt-3 border-t border-slate-100">

                  <p className="text-xs text-slate-500">
                    Travel date
                  </p>

                  <p className="font-medium text-slate-900">
                    {form.travel_date}
                  </p>

                </div>

              </div>

            </div>
          )}
{/* PROMO CODE */}

<div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">

  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
    Promo Code
  </label>

  <input
    type="text"
    value={promoCode}
    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
    placeholder="Enter promo code"
    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-teal-500"
  />

  <p className="text-xs text-slate-500 mt-2">
    Have a RouteX promo code? Enter it here.
  </p>

</div>

          {/* =========================
              CONFIRM BUTTON
          ========================= */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white py-4 rounded-2xl font-bold text-lg shadow-sm transition"
          >
            {loading
              ? "Confirming ride..."
              : "Confirm booking"}
          </button>

          <p className="text-center text-xs text-slate-500 px-5">
            By confirming, you are requesting a
            RouteX ride. A driver will be assigned
            when available.
          </p>

        </form>

      </div>

    </main>
  );
}