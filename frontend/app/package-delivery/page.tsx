"use client";



import { useEffect, useRef, useState } from "react";



const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type DeliveryType = "now" | "scheduled";

type Address = { address: string; full_address?: string; area_name?: string | null; lat: number; lng: number };

type Quote = { fare_amount: number | string; fare_quote_token?: string; booking_allowed?: boolean; quote_status?: string; distance_km?: number; base_fare?: number; out_of_town_fee?: number; pickup_surcharge?: number; night_surcharge?: number; error?: string };

const panel = "rounded-[24px] border border-white/50 bg-[#e9edf5] p-5 shadow-[8px_8px_22px_rgba(31,45,72,0.12),-7px_-7px_20px_rgba(255,255,255,0.95)] dark:border-white/[0.06] dark:bg-[#242b39] dark:shadow-[8px_8px_22px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.025)]";

const field = "w-full rounded-[15px] border border-white/40 bg-[#e9edf5] px-4 py-3.5 text-[13px] font-medium text-[#263247] outline-none shadow-[inset_3px_3px_8px_rgba(37,52,78,0.12),inset_-3px_-3px_8px_rgba(255,255,255,0.95)] placeholder:text-[#7e899c] focus:ring-2 focus:ring-[#e86a43]/35 dark:border-white/[0.04] dark:bg-[#242b39] dark:text-white dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.28),inset_-2px_-2px_7px_rgba(255,255,255,0.025)] dark:placeholder:text-white/45";

const label = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.13em] text-[#637187] dark:text-white/65";

function saLocalInput(hoursAhead = 2) {

  const d = new Date(Date.now() + hoursAhead * 3600000);

  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);

  const get = (type: string) => parts.find(p => p.type === type)?.value || "00";

  const minute = Math.ceil(Number(get("minute")) / 15) * 15;

  if (minute === 60) return shiftSchedule(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:45`, 15);

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${String(minute).padStart(2, "0")}`;

}

function shortAddress(a: Address) {

  return (a.address || a.full_address || "").split(",").slice(0, 3).map(x => x.trim()).join(", ");

}

function shiftSchedule(value: string, minutes: number) {

  const d = new Date(`${value}:00+02:00`);

  d.setTime(d.getTime() + minutes * 60000);

  const parts = new Intl.DateTimeFormat("en-GB", {timeZone:"Africa/Johannesburg",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(d);

  const get = (k: string) => parts.find(x => x.type === k)?.value || "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;

}



type MapInstance = {

  setView: (position: [number, number], zoom: number) => MapInstance;

  on: (event: string, callback: (event: { latlng: { lat: number; lng: number } }) => void) => MapInstance;

  remove: () => void;

  invalidateSize: () => void;

};

type MapLibrary = {

  map: (node: HTMLElement) => MapInstance;

  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: MapInstance) => void };

  marker: (point: [number, number]) => { addTo: (map: MapInstance) => { setLatLng: (point: [number, number]) => void } };

};

declare global { interface Window { L?: MapLibrary } }

let mapLoader: Promise<void> | null = null;

function loadMapLibrary(): Promise<void> {

  if (window.L) return Promise.resolve();

  if (!mapLoader) {

    mapLoader = new Promise<void>((resolve, reject) => {

      if (!document.querySelector('link[data-routex-map]')) {

        const link = document.createElement("link");

        link.rel = "stylesheet";

        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

        link.setAttribute("data-routex-map", "true");

        document.head.appendChild(link);

      }

      const script = document.createElement("script");

      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

      script.onload = () => window.L ? resolve() : reject(new Error("Map unavailable"));

      script.onerror = () => reject(new Error("Map failed to load. Check your connection."));

      document.head.appendChild(script);

    }).catch(error => { mapLoader = null; throw error; });

  }

  return mapLoader;

}

function MapPicker({ onConfirm, onClose }: { onConfirm: (lat: number, lng: number) => void; onClose: () => void }) {

  const mapNode = useRef<HTMLDivElement>(null);

  const [point, setPoint] = useState<[number, number] | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {

    let closed = false;

    let map: MapInstance | undefined;

    void loadMapLibrary().then(() => {

      if (closed || !mapNode.current || !window.L) return;

      const L = window.L;

      map = L.map(mapNode.current).setView([-28.4575, 21.2427], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map);

      let marker: { setLatLng: (point: [number, number]) => void } | undefined;

      map.on("click", e => {

        const next: [number, number] = [e.latlng.lat, e.latlng.lng];

        setPoint(next);

        if (marker) marker.setLatLng(next);

        else marker = L.marker(next).addTo(map!);

      });

      window.setTimeout(() => { if (!closed) map?.invalidateSize(); }, 100);

    }).catch(e => { if (!closed) setError(e instanceof Error ? e.message : "Map unavailable"); });

    return () => { closed = true; map?.remove(); };

  }, []);

  return <div className="mt-3 rounded-[18px] p-3 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.12)]">

    <p className="mb-2 text-xs font-semibold">Tap the exact location on the map</p>

    <div ref={mapNode} className="h-72 w-full overflow-hidden rounded-xl" />

    {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

    {point && <p className="mt-2 text-[11px] opacity-70">Pin: {point[0].toFixed(5)}, {point[1].toFixed(5)}</p>}

    <div className="mt-3 grid grid-cols-2 gap-2">

      <button type="button" onClick={onClose} className="rounded-xl bg-white/50 px-3 py-3 text-xs font-bold dark:bg-white/10">Cancel</button>

      <button type="button" disabled={!point} onClick={() => { if (point) onConfirm(point[0], point[1]); }} className="rounded-xl bg-[#ff6846] px-3 py-3 text-xs font-bold text-white disabled:opacity-40">Use this location</button>

    </div>

  </div>;

}



function AddressSelector({ title, selected, onSelect, onChange }: { title: string; selected: Address | null; onSelect: (address: Address) => void; onChange: () => void }) {

  const [query, setQuery] = useState("");

  const [results, setResults] = useState<Address[]>([]);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [mapOpen, setMapOpen] = useState(false);

  const [locating, setLocating] = useState(false);

  async function chooseCoordinates(lat: number, lng: number, source: "GPS" | "Map") {

    setError("");

    setMapOpen(false);

    const fallback = `${source} pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

    let fullAddress = fallback;

    let area: string | null = null;

    try {

      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);

      if (response.ok) {

        const data = await response.json();

        fullAddress = String(data.display_name || fallback);

        area = data.address?.suburb || data.address?.neighbourhood || data.address?.town || data.address?.city || null;

      }

    } catch { /* Exact coordinates remain valid without a street name. */ }

    onSelect({ address: fullAddress, full_address: fullAddress, area_name: area, lat, lng });

  }

  function useGPS() {

    if (!navigator.geolocation) { setError("GPS is not supported in this browser."); return; }

    setLocating(true);

    setError("");

    navigator.geolocation.getCurrentPosition(

      position => { setLocating(false); void chooseCoordinates(position.coords.latitude, position.coords.longitude, "GPS"); },

      error => { setLocating(false); setError(error.code === 1 ? "Location permission denied. Choose on map instead." : "Could not get your GPS location. Choose on map instead."); },

      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }

    );

  }

  useEffect(() => {

    if (selected || query.trim().length < 3) { setResults([]); setBusy(false); return; }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {

      setBusy(true); setError("");

      try {

        const r = await fetch(`${API_URL}/addresses/search?q=${encodeURIComponent(query.trim())}`, {signal:controller.signal});

        if (!r.ok) throw new Error("Address search unavailable");

        const data = await r.json();

        const list: Address[] = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : Array.isArray(data.items) ? data.items : [];

        if (!controller.signal.aborted) setResults(list.slice(0,6));

      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Search failed"); }

      finally { if (!controller.signal.aborted) setBusy(false); }

    }, 500);

    return () => { window.clearTimeout(timer); controller.abort(); };

  }, [query, selected]);

  return <div>

    <span className={label}>{title}</span>

    {selected ? <button type="button" onClick={() => {onChange();setQuery("");}} className={`${field} text-left font-semibold`}>

      <span className="block truncate">{shortAddress(selected)}</span><span className="mt-1 block text-[10px] text-[#e96743]">Change address</span>

    </button> : <>

      <input className={field} value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${title.toLowerCase()}...`} autoComplete="off" />

      {busy && <p className="mt-2 text-xs opacity-60">Searching...</p>}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-3 grid grid-cols-2 gap-2">

        <button type="button" disabled={locating} onClick={useGPS} className="rounded-[14px] bg-[#e9ebf1] px-2 py-3 text-[11px] font-bold shadow-[4px_4px_9px_rgba(0,0,0,0.10),-4px_-4px_9px_rgba(255,255,255,0.95)] dark:bg-[#24262e] dark:shadow-[4px_4px_9px_rgba(0,0,0,0.35)]"><span className="text-[#e96743]">◎</span> {locating ? "Locating..." : "Use my location"}</button>

        <button type="button" onClick={() => setMapOpen(v => !v)} className="rounded-[14px] bg-[#e9ebf1] px-2 py-3 text-[11px] font-bold shadow-[4px_4px_9px_rgba(0,0,0,0.10),-4px_-4px_9px_rgba(255,255,255,0.95)] dark:bg-[#24262e] dark:shadow-[4px_4px_9px_rgba(0,0,0,0.35)]"><span className="text-[#e96743]">⌖</span> Choose on map</button>

      </div>

      {mapOpen && <MapPicker onClose={() => setMapOpen(false)} onConfirm={(lat, lng) => void chooseCoordinates(lat, lng, "Map")} />}

      {results.length > 0 && <div className="mt-3 max-h-60 space-y-2 overflow-y-auto p-1">

        {results.map((a,i) => <button type="button" key={`${a.lat}-${a.lng}-${i}`} onClick={() => {onSelect(a);setResults([]);setQuery("");}} className="block w-full rounded-[14px] bg-[#e9ebf1] px-4 py-3 text-left shadow-[4px_4px_9px_rgba(0,0,0,0.10),-4px_-4px_9px_rgba(255,255,255,0.95)] transition active:scale-[0.98] dark:bg-[#24262e] dark:shadow-[4px_4px_9px_rgba(0,0,0,0.35),-3px_-3px_8px_rgba(255,255,255,0.04)]">

          <span className="block truncate text-xs font-bold">{shortAddress(a)}</span>{a.area_name && <span className="mt-1 block text-[10px] text-[#e96743]">{a.area_name}</span>}

        </button>)}

      </div>}

    </>}

  </div>;

}

export default function PackageDeliveryPage() {

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("now");

  const [pickup, setPickup] = useState<Address | null>(null);

  const [dropoff, setDropoff] = useState<Address | null>(null);

  const [schedule, setSchedule] = useState(() => saLocalInput());

  const [description, setDescription] = useState("");

  const [size, setSize] = useState<"small" | "medium">("small");

  const [recipient, setRecipient] = useState("");

  const [phone, setPhone] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);

  const [quoteBusy, setQuoteBusy] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);

  const [quoteKey, setQuoteKey] = useState(0);

  useEffect(() => {

    setQuote(null); setError("");

    if (!pickup || !dropoff) return;

    if (deliveryType === "scheduled" && (!schedule || new Date(`${schedule}:00+02:00`).getTime() < Date.now() + 30 * 60000)) return;

    let cancelled = false;

    const load = async () => {

      setQuoteBusy(true);

      try {

        const params = new URLSearchParams({ delivery_type: deliveryType, pickup_area: pickup.area_name || "GPS Pickup", dropoff_area: dropoff.area_name || "GPS Destination", pickup_lat: String(pickup.lat), pickup_lng: String(pickup.lng), dropoff_lat: String(dropoff.lat), dropoff_lng: String(dropoff.lng) });

        if (deliveryType === "scheduled") params.set("scheduled_pickup_at", schedule);

        const r = await fetch(`${API_URL}/package-deliveries/calculate-fare?${params}`, { cache: "no-store" });

        const data: Quote = await r.json();

        if (!r.ok) throw new Error(data.error || "Could not calculate fare");

        if (!cancelled) setQuote(data);

      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Fare unavailable"); }

      finally { if (!cancelled) setQuoteBusy(false); }

    };

    void load();

    return () => { cancelled = true; };

  }, [pickup, dropoff, deliveryType, schedule, quoteKey]);

  const validSchedule = deliveryType === "now" || (Boolean(schedule) && new Date(`${schedule}:00+02:00`).getTime() >= Date.now() + 30 * 60000);

  const [createdPin, setCreatedPin] = useState("");

  const canSubmit = Boolean(pickup && dropoff && description.trim() && recipient.trim() && /^\+?[0-9\s()-]{7,20}$/.test(phone.trim()) && validSchedule && quote?.booking_allowed && quote.fare_quote_token && Number(quote.fare_amount) > 0 && !quoteBusy && !submitting);

  async function submit() {

    setShowConfirm(false);

    if (!canSubmit || !pickup || !dropoff || !quote) return;

    const passenger = (() => { try { return JSON.parse(localStorage.getItem("passenger") || "null"); } catch { return null; } })();

    if (!passenger?.token) { setError("Please sign in as a passenger before requesting delivery."); return; }

    setSubmitting(true); setError(""); setSuccess("");

    try {

      const r = await fetch(`${API_URL}/package-deliveries`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${passenger.token}` }, body: JSON.stringify({ delivery_type: deliveryType, pickup_area: pickup.area_name || "GPS Pickup", dropoff_area: dropoff.area_name || "GPS Destination", pickup_address: pickup.full_address || pickup.address, pickup_lat: pickup.lat, pickup_lng: pickup.lng, dropoff_address: dropoff.full_address || dropoff.address, dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng, parcel_description: description.trim(), parcel_size: size, recipient_name: recipient.trim(), recipient_phone: phone.trim(), scheduled_pickup_at: deliveryType === "scheduled" ? schedule : null, fare_quote_token: quote.fare_quote_token, accepted_fare_amount: Number(quote.fare_amount) }) });

      const data = await r.json();

      if (!r.ok) { if (r.status === 409) setQuoteKey(k => k + 1); throw new Error(data.error || data.message || "Delivery request failed"); }

      const newPin = String(data.delivery_pin || "");

      setCreatedPin(newPin);

      if (newPin && data.delivery?.id) {

        try {

          const key = "routex-package-pins";

          const existing = JSON.parse(localStorage.getItem(key) || "{}");

          existing[String(data.delivery.id)] = newPin;

          localStorage.setItem(key, JSON.stringify(existing));

        } catch { /* Still display the PIN so it can be saved manually. */ }

      }

      setSuccess(`Delivery request #${data.delivery?.id || "created"} submitted. Status: ${data.delivery?.status || "pending"}.`);

      setQuote(null);

    } catch (e) { setError(e instanceof Error ? e.message : "Could not request delivery"); }

    finally { setSubmitting(false); }

  }

  return <main className="min-h-[100dvh] bg-[#f0f3f9] text-[#202c40] dark:bg-[#111722] dark:text-[#f5f6f8]">

    {showConfirm && quote && (

      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-5 backdrop-blur-[4px]" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) setShowConfirm(false); }}>

        <section role="dialog" aria-modal="true" aria-labelledby="package-confirm-title" className="w-full max-w-[370px] rounded-[26px] bg-[#e9ebf1] p-6 text-[#17191f] shadow-[12px_12px_32px_rgba(0,0,0,0.25),-4px_-4px_16px_rgba(255,255,255,0.7)] dark:bg-[#24262e] dark:text-[#f5f6f8] dark:shadow-[10px_10px_30px_rgba(0,0,0,0.55)]">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ff6846] text-white shadow-[4px_4px_10px_rgba(255,104,70,0.2)]">

            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></svg>

          </div>

          <h2 id="package-confirm-title" className="mt-5 text-center text-[20px] font-semibold tracking-tight">Confirm package delivery</h2>

          <p className="mt-2 text-center text-[12px] text-[#626977] dark:text-white/65">{deliveryType === "now" ? "Deliver now" : "Scheduled collection"} · {size === "small" ? "Small parcel" : "Medium parcel"}</p>

          <div className="mt-5 rounded-[17px] px-4 py-4 shadow-[inset_3px_3px_8px_rgba(0,0,0,0.10),inset_-3px_-3px_8px_rgba(255,255,255,0.95)] dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.5)]">

            <p className="text-center text-[10px] font-bold uppercase tracking-wider text-[#626977] dark:text-white/60">Total delivery fare</p>

            <p className="mt-1 text-center text-[30px] font-black text-[#e96743]">R{Number(quote.fare_amount).toFixed(2)}</p>

            {deliveryType === "scheduled" && <p className="mt-2 text-center text-[11px] font-semibold">{new Date(`${schedule}:00+02:00`).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</p>}

          </div>

          <p className="mt-4 text-center text-[11px] leading-5 text-[#626977] dark:text-white/65">Please check your delivery details before submitting.</p>

          <div className="mt-5 grid grid-cols-2 gap-3">

            <button type="button" disabled={submitting} onClick={() => setShowConfirm(false)} className="rounded-[15px] bg-[#e9ebf1] px-3 py-3.5 text-[12px] font-bold shadow-[4px_4px_9px_rgba(0,0,0,0.1),-4px_-4px_9px_rgba(255,255,255,0.95)] disabled:opacity-50 dark:bg-[#24262e] dark:shadow-[4px_4px_9px_rgba(0,0,0,0.35)]">Go back</button>

            <button type="button" disabled={submitting || !canSubmit} onClick={submit} className="rounded-[15px] bg-[#ff6846] px-3 py-3.5 text-[12px] font-black text-white transition active:scale-[0.98] disabled:opacity-50">{submitting ? "Submitting..." : "Confirm delivery"}</button>

          </div>

        </section>

      </div>

    )}

    <div className="mx-auto min-h-[100dvh] w-full max-w-md space-y-5 bg-[#e9edf5] px-5 pb-12 pt-5 dark:bg-[#1b2330]">

      <a href="/passenger-portal" aria-label="Back to Passenger Portal" className="inline-flex w-fit items-center gap-2 rounded-[13px] bg-[#273a55] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[3px_4px_10px_rgba(31,45,72,0.16)] transition hover:bg-[#354c6a] active:scale-[0.98] dark:bg-[#34445f]"><span aria-hidden="true">‹</span> Back</a>

        <header className="relative overflow-hidden rounded-[19px] border border-white/40 bg-gradient-to-r from-[#243651] via-[#364b66] to-[#d86b49] px-5 py-5 text-white shadow-[0_10px_24px_rgba(36,54,81,0.15)]"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-white/75">RouteX</p><h1 className="mt-1 text-[22px] font-semibold tracking-tight">Package Delivery</h1><p className="mt-1 text-[11px] text-white/80">Send parcels around Upington</p></header>

      {success ? <section className={panel}><h2 className="text-lg font-bold">Request submitted</h2><p className="mt-2 text-sm">{success}</p>{createdPin && <div className="mt-4 rounded-xl bg-[#ff6846]/10 p-4"><p className="text-xs font-bold">Recipient handover PIN</p><p className="mt-1 text-2xl font-black tracking-[0.18em] text-[#e96743]">{createdPin}</p><p className="mt-2 text-xs">Save this PIN and share it only with the recipient. The driver will need it to complete the delivery.</p></div>}<p className="mt-2 text-xs opacity-70">Track delivery status and assigned driver details in My Package Deliveries on your Passenger Portal.</p><a href="/passenger-portal" className="mt-4 inline-block rounded-xl bg-[#263a57] px-4 py-3 text-xs font-bold text-white">Return to passenger portal</a></section> : <>

      <section className="grid grid-cols-2 gap-2 rounded-[18px] p-1.5 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.10),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.35)]">

        {(["now", "scheduled"] as DeliveryType[]).map(type => <button type="button" key={type} onClick={() => setDeliveryType(type)} className={`rounded-[13px] px-3 py-3 text-xs font-bold ${deliveryType === type ? "bg-[#263a57] text-white" : "text-[#626977] dark:text-white/70"}`}>{type === "now" ? "Deliver Now" : "Schedule Delivery"}</button>)}

      </section>

      {deliveryType === "scheduled" && <section className={panel}>

        <p className={label}>Trip details</p><h2 className="mb-4 text-[16px] font-semibold">Choose collection time</h2>

        <p className={label}>Collection date</p>

        <div className="grid grid-cols-[42px_1fr_42px] gap-2">

          <button type="button" aria-label="Previous day" onClick={() => setSchedule(v => shiftSchedule(v,-1440))} className={`${field} !px-0 text-xl font-bold`}>‹</button>

          <div className={`${field} flex flex-col items-center justify-center text-center`}><span className="text-[13px] font-bold">{new Date(`${schedule}:00+02:00`).toLocaleDateString("en-ZA",{timeZone:"Africa/Johannesburg",weekday:"short",day:"2-digit",month:"short"})}</span><span className="text-[9px] opacity-60">{schedule.slice(0,10)}</span></div>

          <button type="button" aria-label="Next day" onClick={() => setSchedule(v => shiftSchedule(v,1440))} className={`${field} !px-0 text-xl font-bold`}>›</button>

        </div>

        <div className="mb-2 mt-4 flex items-center justify-between"><p className={`${label} !mb-0`}>Collection time</p><span className="text-[9px] opacity-60">15 min intervals</span></div>

        <div className="grid grid-cols-[42px_1fr_42px] gap-2">

          <button type="button" aria-label="15 minutes earlier" onClick={() => setSchedule(v => shiftSchedule(v,-15))} className={`${field} !px-0 text-xl font-bold`}>−</button>

          <div className="flex h-12 items-center justify-center rounded-[14px] bg-[#17191f] text-[20px] font-semibold text-white">{schedule.slice(11,16)}</div>

          <button type="button" aria-label="15 minutes later" onClick={() => setSchedule(v => shiftSchedule(v,15))} className={`${field} !px-0 text-xl font-bold`}>+</button>

        </div>

        <p className="mt-4 rounded-[14px] border-l-[3px] border-[#ff6846] px-3 py-2 text-[10px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)]">Schedule at least 30 minutes ahead.</p>

        {new Date(`${schedule}:00+02:00`).getTime() < Date.now()+30*60000 && <p className="mt-2 text-xs font-bold text-[#e96743]">Choose a later collection time.</p>}

      </section>}

      <section className={`${panel} space-y-5`}><AddressSelector title="Collection address" selected={pickup} onSelect={setPickup} onChange={() => setPickup(null)} /><div className="h-px bg-black/10 dark:bg-white/10"/><AddressSelector title="Delivery address" selected={dropoff} onSelect={setDropoff} onChange={() => setDropoff(null)} /></section>

      <section className={`${panel} space-y-4`}><h2 className="text-sm font-semibold">Parcel details</h2><div><label className={label} htmlFor="parcel-description">What are you sending?</label><textarea id="parcel-description" className={`${field} min-h-20 resize-y`} maxLength={500} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Documents, clothing or a small box" /></div><div><span className={label}>Parcel size</span><div className="grid grid-cols-2 gap-2">{(["small", "medium"] as const).map(s => <button key={s} type="button" onClick={() => setSize(s)} className={`rounded-[15px] px-3 py-3.5 text-xs font-bold transition active:scale-95 ${size === s ? "bg-[#e9ebf1] text-[#e96743] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.12),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] dark:bg-[#24262e] dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.4)]" : "bg-[#e9ebf1] shadow-[4px_4px_9px_rgba(0,0,0,0.10),-4px_-4px_9px_rgba(255,255,255,0.95)] dark:bg-[#24262e] dark:shadow-[4px_4px_9px_rgba(0,0,0,0.35),-3px_-3px_8px_rgba(255,255,255,0.04)]"}`}>{s === "small" ? "Small parcel" : "Medium parcel"}</button>)}</div></div><div><label className={label} htmlFor="recipient">Recipient name</label><input id="recipient" className={field} maxLength={150} value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Full name" /></div><div><label className={label} htmlFor="recipient-phone">Recipient cellphone</label><input id="recipient-phone" type="tel" className={field} maxLength={30} value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0821234567" /></div></section>

      <section className={`${panel} text-center`}><p className={label}>Delivery fare</p><p className="text-[34px] font-black tracking-tight">{quoteBusy ? "..." : quote ? `R${Number(quote.fare_amount).toFixed(2)}` : "—"}</p>{quote && <><p className="mt-1 text-xs opacity-65">{quote.distance_km != null ? `${Number(quote.distance_km).toFixed(1)} km by road` : "Distance unavailable"}</p><div className="mt-4 space-y-1 border-t border-black/10 pt-3 text-left text-xs dark:border-white/10">{quote.base_fare != null && <p>Base fare: R{Number(quote.base_fare).toFixed(2)}</p>}{Number(quote.out_of_town_fee) > 0 && <p>Out-of-town fee: R{Number(quote.out_of_town_fee).toFixed(2)}</p>}{Number(quote.pickup_surcharge) > 0 && <p>Driver pickup: R{Number(quote.pickup_surcharge).toFixed(2)}</p>}{Number(quote.night_surcharge) > 0 && <p>Night surcharge: R{Number(quote.night_surcharge).toFixed(2)}</p>}</div>{!quote.booking_allowed && <p className="mt-3 rounded-xl bg-[#17191f] p-3 text-left text-xs text-white">Provisional estimate only. No driver with a recent GPS location is available to confirm an immediate delivery fare. Please try again later or schedule a delivery.</p>}</>}{error && <p role="alert" className="mt-3 text-left text-xs font-semibold text-red-500">{error}</p>}<button type="button" onClick={() => setQuoteKey(k => k + 1)} disabled={!pickup || !dropoff || quoteBusy} className="mt-3 text-xs font-bold text-[#e96743] disabled:opacity-40">Refresh fare</button></section>

      <button type="button" disabled={!canSubmit} onClick={() => setShowConfirm(true)} className="w-full rounded-[18px] bg-[#263a57] px-5 py-4 text-left text-sm font-semibold text-white transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-35">{submitting ? "Submitting..." : deliveryType === "now" ? "Request Package Delivery →" : "Schedule Package Delivery →"}</button><p className="text-center text-[10px] text-[#626977] dark:text-white/50">RouteX · Getting Upington Moving</p>

      </>}

    </div>

  </main>;

}
