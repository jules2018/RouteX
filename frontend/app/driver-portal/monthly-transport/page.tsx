"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import { API_URL } from "../../lib/api";

type Route = {
  id: number; route_name: string; origin_label: string; destination_label: string;
  morning_departure: string; afternoon_return: string; operating_days: number[];
  seat_capacity: number; available_seats: number; monthly_fare: string; status: string;
};
const weekdays = [{id:1,name:"Mon"},{id:2,name:"Tue"},{id:3,name:"Wed"},{id:4,name:"Thu"},{id:5,name:"Fri"},{id:6,name:"Sat"},{id:7,name:"Sun"}];
const inputStyle = "w-full rounded-xl border border-[#c8cbd1] bg-white px-3 py-3 text-sm text-[#17191f] outline-none focus:border-[#ff6846] dark:border-[#474a55] dark:bg-[#292c35] dark:text-white";
const cardStyle = "rounded-2xl bg-[#e7e9ee] p-4 shadow-[5px_5px_12px_#c4c6ca,-5px_-5px_12px_#ffffff] dark:bg-[#1c1e24] dark:shadow-[5px_5px_12px_#101116,-5px_-5px_12px_#30333d]";

export default function MonthlyTransportDriverPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [routeName, setRouteName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [morning, setMorning] = useState("07:00");
  const [afternoon, setAfternoon] = useState("17:00");
  const [days, setDays] = useState<number[]>([1,2,3,4,5]);
  const [seats, setSeats] = useState("3");
  const [fare, setFare] = useState("");
  const [stopRouteId, setStopRouteId] = useState<number | null>(null);
  const [stopName, setStopName] = useState("");
  const [stopLat, setStopLat] = useState("");
  const [stopLng, setStopLng] = useState("");
  const [stopOrder, setStopOrder] = useState("0");

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = sessionStorage.getItem("driverToken");
    if (!token) throw new Error("Please sign in again.");
    const response = await fetch(`${API_URL}${path}`, {
      ...init, cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api("/monthly-transport/my-routes");
      setRoutes(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load routes."); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => {
    if (!sessionStorage.getItem("driverToken") || !localStorage.getItem("driver")) {
      router.replace("/driver-login"); return;
    }
    void refresh();
  }, [refresh, router]);

  async function createRoute(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (!days.length) throw new Error("Choose at least one operating day.");
      const capacity = Number(seats); const price = Number(fare);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 30) throw new Error("Enter 1–30 passenger seats.");
      if (!Number.isFinite(price) || price <= 0) throw new Error("Enter a valid monthly fare.");
      await api("/monthly-transport/my-routes", { method: "POST", body: JSON.stringify({
        route_name: routeName.trim(), origin_label: origin.trim(), destination_label: destination.trim(),
        morning_departure: morning, afternoon_return: afternoon, operating_days: [...days].sort((a,b)=>a-b),
        seat_capacity: capacity, monthly_fare: price,
      }) });
      setMessage("Draft route created. Add and approve a safe pickup point before activating it.");
      setRouteName(""); setOrigin(""); setDestination(""); setFare("");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create route."); }
    finally { setBusy(false); }
  }

  async function updateStatus(route: Route, status: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      await api(`/monthly-transport/my-routes/${route.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setMessage(`Route ${status}.`); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not change route status."); }
    finally { setBusy(false); }
  }

  async function addStop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (stopRouteId === null) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const lat = Number(stopLat), lng = Number(stopLng), order = Number(stopOrder);
      if (!stopLat.trim() || !stopLng.trim() || !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error("Enter valid GPS coordinates for the pickup point.");
      if (!Number.isInteger(order) || order < 0) throw new Error("Stop order must be zero or higher.");
      const stop = await api(`/monthly-transport/my-routes/${stopRouteId}/stops`, { method: "POST", body: JSON.stringify({
        stop_label: stopName.trim(), latitude: lat, longitude: lng, stop_order: order, pickup_allowed: true, dropoff_allowed: true,
      }) });
      // The driver confirms this selected location is suitable before approval.
      await api(`/monthly-transport/my-routes/${stopRouteId}/stops/${stop.id}/approve`, { method: "PATCH" });
      setMessage("Pickup point saved and approved. You can now activate the route.");
      setStopRouteId(null); setStopName(""); setStopLat(""); setStopLng(""); setStopOrder("0");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add pickup point."); }
    finally { setBusy(false); }
  }

  return <AuthGuard><main className="min-h-screen bg-[#e7e9ee] px-4 py-6 text-[#17191f] dark:bg-[#1c1e24] dark:text-white">
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-[#ff6846]">RouteX Driver</p><h1 className="text-2xl font-black">Monthly Transport</h1></div><button type="button" onClick={() => router.push("/driver-portal")} className="rounded-xl border border-[#bfc2c9] px-3 py-2 text-xs font-bold dark:border-[#4b4e58]">Back to portal</button></div>
      <p className="text-xs leading-5 text-[#70747d] dark:text-[#b3b6bf]">Offer regular shared transport with a morning trip and afternoon return. Your normal Ride Now availability is not affected.</p>
      <div className="rounded-2xl border border-[#ff6846]/40 bg-[#ff6846]/10 p-4">
  <div className="flex items-center gap-2">
    <span className="text-lg">ℹ️</span>
    <h3 className="text-sm font-bold text-[#ff6846]">
      Monthly Transport — Prototype
    </h3>
  </div>

  <p className="mt-2 text-xs leading-5">
    We're currently developing and testing RouteX Monthly
    Shared Transport. This feature will allow drivers to
    offer regular transport for work, school and other
    destinations.
  </p>

  <p className="mt-2 text-xs font-semibold leading-5">
    This feature is not yet available for real passenger
    bookings. We'll notify drivers when it officially launches.
  </p>
</div>
      {error && <div role="alert" className="rounded-xl border border-red-400 p-3 text-sm text-red-600 dark:text-red-300">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-green-500 p-3 text-sm text-green-700 dark:text-green-300">{message}</div>}
      <section className={cardStyle}><h2 className="mb-3 text-lg font-black">Create a monthly route</h2>
        <form onSubmit={createRoute} className="space-y-3">
          <label className="block text-xs font-bold">Route name<input required minLength={2} maxLength={180} className={`${inputStyle} mt-1`} value={routeName} onChange={e=>setRouteName(e.target.value)} placeholder="e.g. Rosedale to CBD" /></label>
          <label className="block text-xs font-bold">Starting area<input required minLength={2} className={`${inputStyle} mt-1`} value={origin} onChange={e=>setOrigin(e.target.value)} placeholder="e.g. Rosedale" /></label>
          <label className="block text-xs font-bold">Destination<input required minLength={2} className={`${inputStyle} mt-1`} value={destination} onChange={e=>setDestination(e.target.value)} placeholder="e.g. Upington CBD" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Morning departure<input type="time" required className={`${inputStyle} mt-1`} value={morning} onChange={e=>setMorning(e.target.value)} /></label><label className="text-xs font-bold">Afternoon return<input type="time" required className={`${inputStyle} mt-1`} value={afternoon} onChange={e=>setAfternoon(e.target.value)} /></label></div>
          <div><p className="mb-2 text-xs font-bold">Operating days</p><div className="flex flex-wrap gap-2">{weekdays.map(day=><label key={day.id} className={`cursor-pointer rounded-lg px-2 py-2 text-xs font-bold ${days.includes(day.id)?"bg-[#ff6846] text-white":"bg-[#d7d9df] dark:bg-[#343741]"}`}><input type="checkbox" className="sr-only" checked={days.includes(day.id)} onChange={e=>setDays(prev=>e.target.checked?[...prev,day.id]:prev.filter(id=>id!==day.id))}/>{day.name}</label>)}</div></div>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Passenger seats<input type="number" required min={1} max={30} step={1} className={`${inputStyle} mt-1`} value={seats} onChange={e=>setSeats(e.target.value)}/></label><label className="text-xs font-bold">Monthly fare (R)<input type="number" required min="1" step="0.01" className={`${inputStyle} mt-1`} value={fare} onChange={e=>setFare(e.target.value)} placeholder="e.g. 850"/></label></div>
          <p className="text-[11px] text-[#70747d] dark:text-[#b3b6bf]">The driver sets the monthly fare. Payment and passenger bookings are not enabled in this phase.</p>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#ff6846] py-3 text-sm font-black text-white disabled:opacity-50">{busy?"Saving...":"Create draft route"}</button>
        </form>
      </section>
      <section className="space-y-3"><h2 className="text-lg font-black">My monthly routes</h2>
        {loading ? <p className="text-sm">Loading routes...</p> : routes.length===0 ? <div className={cardStyle}><p className="text-sm">No monthly routes created yet.</p></div> : routes.map(route=><article key={route.id} className={`${cardStyle} space-y-2`}>
          <div className="flex items-start justify-between gap-2"><h3 className="text-base font-black">{route.route_name}</h3><span className="rounded-full bg-[#d4d6dc] px-2 py-1 text-[10px] font-bold capitalize dark:bg-[#353842]">{route.status}</span></div>
          <p className="text-sm">{route.origin_label} → {route.destination_label}</p>
          <p className="text-xs text-[#6e727a] dark:text-[#b3b6bf]">{String(route.morning_departure).slice(0,5)} out · {String(route.afternoon_return).slice(0,5)} return · {route.operating_days.map(n=>weekdays.find(d=>d.id===n)?.name).join(", ")}</p>
          <p className="text-sm font-bold">R{Number(route.monthly_fare).toFixed(2)}/month · {route.available_seats} of {route.seat_capacity} seats available</p>
          <div className="flex flex-wrap gap-2">{["draft","paused"].includes(route.status) && <button disabled={busy} type="button" onClick={()=>{setStopRouteId(route.id);setStopOrder("0");}} className="rounded-xl bg-[#d5d7dc] px-3 py-2 text-xs font-bold dark:bg-[#353842]">Add pickup point</button>}
          {route.status!=="active" && route.status!=="closed" && <button disabled={busy} type="button" onClick={()=>void updateStatus(route,"active")} className="rounded-xl bg-[#ff6846] px-3 py-2 text-xs font-bold text-white">Activate</button>}
          {route.status==="active" && <button disabled={busy} type="button" onClick={()=>void updateStatus(route,"paused")} className="rounded-xl bg-[#d5d7dc] px-3 py-2 text-xs font-bold dark:bg-[#353842]">Pause</button>}
          {route.status!=="closed" && <button disabled={busy} type="button" onClick={()=>void updateStatus(route,"closed")} className="rounded-xl border border-[#aeb1ba] px-3 py-2 text-xs font-bold dark:border-[#51545d]">Close</button>}</div>
          {stopRouteId===route.id && <form onSubmit={addStop} className="mt-3 space-y-3 rounded-xl border border-[#c3c5cb] p-3 dark:border-[#464954]"><h4 className="text-sm font-black">Add a safe pickup point</h4><p className="text-xs">Use a legal, safe stopping location. Enter its GPS coordinates from a map and verify them before approving.</p>
            <input required minLength={2} className={inputStyle} value={stopName} onChange={e=>setStopName(e.target.value)} placeholder="Pickup point name" />
            <div className="grid grid-cols-2 gap-2"><input required type="number" step="any" className={inputStyle} value={stopLat} onChange={e=>setStopLat(e.target.value)} placeholder="Latitude" aria-label="Latitude"/><input required type="number" step="any" className={inputStyle} value={stopLng} onChange={e=>setStopLng(e.target.value)} placeholder="Longitude" aria-label="Longitude"/></div>
            <label className="block text-xs font-bold">Stop order<input required type="number" min={0} step={1} className={`${inputStyle} mt-1`} value={stopOrder} onChange={e=>setStopOrder(e.target.value)}/></label>
            <label className="flex items-start gap-2 text-xs"><input type="checkbox" required/>I confirm this pickup point is a safe and permitted stopping location.</label>
            <div className="flex gap-2"><button type="submit" disabled={busy} className="flex-1 rounded-xl bg-[#ff6846] py-3 text-xs font-black text-white disabled:opacity-50">Save & approve point</button><button type="button" onClick={()=>setStopRouteId(null)} className="rounded-xl px-3 text-xs font-bold">Cancel</button></div>
          </form>}
        </article>)}
      </section>
    </div>
  </main></AuthGuard>;
}
