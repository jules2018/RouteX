"use client";
import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

type FareOffer = { id: number; driver_id: number; offered_fare: number; response: string; status: string };
type FareRequest = { id: number; status: string; expires_at: string; passenger_offer: number; suggested_fare: number; offers: FareOffer[] };
const headers = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
const MIN_OFFER = 20;
const MAX_OFFER = 10000;
const OFFER_STEP = 5;
const clampOffer = (value: number) => Math.min(MAX_OFFER, Math.max(MIN_OFFER, Math.round(value / OFFER_STEP) * OFFER_STEP));

export function PassengerRegionalOffers({ suggestedFare, quoteToken, pickupAddress, dropoffAddress, pickupLat, pickupLng }: { suggestedFare: number; quoteToken: string; pickupAddress: string; dropoffAddress: string; pickupLat: number; pickupLng: number }) {
  const [amount, setAmount] = useState(() => clampOffer(Number.isFinite(suggestedFare) ? suggestedFare : MIN_OFFER));
  const [request, setRequest] = useState<FareRequest | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingOfferId, setConfirmingOfferId] = useState<number | null>(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [revising, setRevising] = useState(false);
  const token = () => { try { return JSON.parse(localStorage.getItem("passenger") || "null")?.token || ""; } catch { return ""; } };

  useEffect(() => { setAmount(clampOffer(Number.isFinite(suggestedFare) ? suggestedFare : MIN_OFFER)); }, [suggestedFare]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const t = token(); if (!t) return;
      try {
        const r = await fetch(`${API_URL}/regional-fare-requests/mine`, { headers: headers(t), cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (active && Array.isArray(data)) setRequest(data.find((x: FareRequest) => x.status === "open" && new Date(x.expires_at).getTime() > Date.now()) || null);
      } catch { /* retry on next poll */ }
    };
    void refresh();
    const pollTimer = window.setInterval(() => { void refresh(); }, 3000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { active = false; window.clearInterval(pollTimer); window.clearInterval(clockTimer); };
  }, []);

  const searching = Boolean(request?.status === "open" && new Date(request.expires_at).getTime() > now);
  const secondsLeft = searching && request ? Math.max(0, Math.ceil((new Date(request.expires_at).getTime() - now) / 1000)) : 0;
  useEffect(() => {
    if (!searching) return;
    let alive = true;
    const update = async () => {
      try {
        const [online, nearby] = await Promise.all([
          fetch(`${API_URL}/online-drivers`, { cache: "no-store" }),
          fetch(`${API_URL}/available-drivers?pickup_lat=${encodeURIComponent(String(pickupLat))}&pickup_lng=${encodeURIComponent(String(pickupLng))}`, { cache: "no-store" })
        ]);
        if (alive && online.ok) { const d = await online.json(); setOnlineCount(Number(d.total) || 0); }
        if (alive && nearby.ok) { const d = await nearby.json(); setNearbyDrivers(Array.isArray(d) ? d : []); }
      } catch { /* Retain last available snapshot */ }
    };
    if (Number.isFinite(pickupLat) && Number.isFinite(pickupLng)) void update();
    const timer = window.setInterval(update, 5000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [searching, pickupLat, pickupLng]);

  async function cancelOffer() {
    if (!request || cancelling) return;
    const t = token(); if (!t) { setError("Please sign in again."); return; }
    setCancelling(true); setError("");
    try {
      const response = await fetch(`${API_URL}/regional-fare-requests/${request.id}/cancel`, { method: "POST", headers: headers(t) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to cancel fare request.");
      setRequest(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to cancel fare request."); }
    finally { setCancelling(false); }
  }

  async function submit() {
    setError("");
    if (!Number.isFinite(amount) || amount < MIN_OFFER || amount > MAX_OFFER) {
      setError("Choose an offer between R20 and R10,000."); return;
    }
    const t = token(); if (!t) { setError("Please sign in again."); return; }
    setBusy(true);
    try {
      const r = await fetch(`${API_URL}/regional-fare-requests`, {
        method: "POST", headers: headers(t),
        body: JSON.stringify({ fare_quote_token: quoteToken, pickup_address: pickupAddress, dropoff_address: dropoffAddress, passenger_offer: amount }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Could not submit offer.");
      setRequest({ ...data, offers: [] });
      setAmount(Number(data.passenger_offer));
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed."); }
    finally { setBusy(false); }
  }

  async function reviseOffer() {
    if (!request || revising || cancelling || confirmingOfferId !== null) return;
    if (amount === Number(request.passenger_offer)) { setError('Choose a different fare first.'); return; }
    const t=token(); if (!t) { setError('Please sign in again.'); return; }
    setRevising(true);setError('');
    try {
      const r=await fetch(`${API_URL}/regional-fare-requests/${request.id}/revise`, {
        method:'POST',headers:headers(t),body:JSON.stringify({passenger_offer:amount})
      });
      const data=await r.json();if (!r.ok) throw new Error(data.error || 'Unable to revise offer.');
      setRequest(old=>old?{...old,passenger_offer:Number(data.passenger_offer),offers:[]}:old);
    } catch(e) {setError(e instanceof Error?e.message:'Unable to revise offer.');}
    finally {setRevising(false);}
  }

  async function confirmOffer(offerId: number) {
    if (!request || confirmingOfferId !== null) return;
    const t = token();
    if (!t) { setError("Please sign in again."); return; }
    setError("");
    setConfirmingOfferId(offerId);
    try {
      const r = await fetch(`${API_URL}/regional-fare-requests/${request.id}/confirm`, {
        method: "POST", headers: headers(t), body: JSON.stringify({ offer_id: offerId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to confirm booking.");
      setConfirmedBookingId(Number(data.booking.id));
       window.location.href = `/passenger-portal?booking=${Number(data.booking.id)}`;
      setRequest(old => old ? { ...old, status: "confirmed" } : old);
    } catch (e) { setError(e instanceof Error ? e.message : "Booking confirmation failed."); }
    finally { setConfirmingOfferId(null); }
  }

  if (searching && request) return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#edf0f6] text-[#202c40] dark:bg-[#10141e] dark:text-white">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#e9edf5] px-5 pb-10 pt-7 dark:bg-[#202736]">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute h-16 w-16 animate-ping rounded-full bg-[#ed704d]/15" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#ed704d] shadow-lg"><span className="h-4 w-4 rounded-full border-[3px] border-white" /></span>
          </div>
          <h2 className="mt-5 text-[23px] font-semibold">Finding your driver...</h2>
          <p className="mt-2 text-xs text-[#6c7280] dark:text-white/70">Your fare offer is being sent to nearby RouteX drivers.</p>
        </div>
        <div className="mt-6 rounded-[28px] bg-[#e9edf5] p-5 shadow-[8px_8px_20px_rgba(31,45,72,0.11),-7px_-7px_18px_rgba(255,255,255,0.95)] dark:bg-[#24262e] dark:shadow-none">
          <div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-widest text-[#e95432]">Your trip</span><span className="text-[9px] text-[#6c7280] dark:text-white/70"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />{onlineCount} online</span></div>
          <div className="mt-5 rounded-[20px] p-4 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.10),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] dark:bg-[#263244] dark:shadow-none">
            <div className="flex items-start gap-3"><span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#263750] dark:border-white" /><div className="min-w-0"><p className="truncate text-sm font-medium">{pickupAddress}</p><p className="mt-1 text-[8px] uppercase tracking-widest opacity-60">Pickup</p></div></div>
            <div className="ml-[5px] my-2 h-6 w-px bg-[#e95432]/50" />
            <div className="flex items-start gap-3"><span className="mt-1 h-3 w-3 shrink-0 rounded-[3px] bg-[#e95432]" /><div className="min-w-0"><p className="truncate text-sm font-medium">{dropoffAddress}</p><p className="mt-1 text-[8px] uppercase tracking-widest opacity-60">Destination</p></div></div>
          </div>
          <div className="mt-5 flex items-end justify-between"><div><p className="text-[8px] uppercase tracking-widest opacity-60">Your offer</p><p className="mt-1 text-[28px] font-bold text-[#e95432]">R{Number(request.passenger_offer).toFixed(2)}</p></div><div className="text-right"><p className="text-[8px] uppercase tracking-widest opacity-60">Ride type</p><p className="mt-1 text-[10px] font-semibold">Offer Your Fare</p></div></div>
          <div className="mt-5 flex items-center justify-between rounded-[20px] bg-[#e1e3e9] px-4 py-4 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.22),6px_6px_12px_rgba(0,0,0,0.08)] dark:bg-[#202126]"><div><p className="text-[9px] font-semibold uppercase tracking-widest"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[#ed704d]" />Finding your driver</p><p className="mt-1 text-[9px] opacity-60">Waiting for driver responses</p></div><p className="text-[23px] font-bold tabular-nums">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2,"0")}</p></div>
          <p className="mb-2 mt-5 text-[9px] font-bold uppercase tracking-widest opacity-60">Available nearby</p>
          {nearbyDrivers.length ? nearbyDrivers.slice(0,3).map((driver:any) => <div key={driver.id} className="mb-2 flex items-center gap-3 rounded-[16px] p-3 shadow-[5px_5px_12px_#c8d0dc,-5px_-5px_12px_#ffffff] dark:bg-[#263244] dark:shadow-none"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[#e95432]">{driver.profile_image ? <img src={driver.profile_image} alt="" className="h-full w-full object-cover"/> : (driver.first_name?.[0] || "D")}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{driver.first_name || driver.full_name || "RouteX driver"}</p><p className="text-[9px] opacity-60">{driver.distance_km != null ? `${driver.distance_km} km away` : "Online"}</p></div><span className="text-[9px] text-[#e95432]">Available</span></div>) : <p className="text-xs opacity-60">Checking nearby drivers...</p>}
          <div className="mt-6 rounded-[28px] bg-[#e9edf5] p-4 shadow-[9px_9px_22px_#c5cdda,-9px_-9px_22px_#ffffff] dark:bg-[#242e40] dark:shadow-[8px_8px_18px_#131b29,-8px_-8px_18px_#35445c]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div><p className="text-[15px] font-bold tracking-tight">Make another offer</p><p className="mt-1 text-[10px] opacity-60">Adjust your fare in R5 steps</p></div>
              <span className="rounded-full bg-[#e9edf5] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#e95432] shadow-[3px_3px_8px_#c7cfdb,-3px_-3px_8px_#ffffff] dark:bg-[#29364b] dark:shadow-none">Your price</span>
            </div>
            <div className="grid grid-cols-[58px_minmax(0,1fr)_58px] items-center gap-3">
              <button type="button" aria-label="Decrease revised fare" disabled={revising || amount<=MIN_OFFER} onClick={()=>setAmount(v=>Math.max(MIN_OFFER,v-5))} className="flex h-[58px] items-center justify-center rounded-[19px] bg-[#e9edf5] text-[27px] font-semibold text-[#263750] shadow-[6px_6px_13px_#c4cdda,-6px_-6px_13px_#ffffff] transition active:scale-95 active:shadow-[inset_4px_4px_9px_#c4cdda,inset_-4px_-4px_9px_#ffffff] disabled:opacity-40 dark:bg-[#29364b] dark:text-white dark:shadow-[5px_5px_12px_#151d2c,-5px_-5px_12px_#394a64]">−</button>
              <div aria-live="polite" aria-label={`Revised fare R${amount.toFixed(2)}`} className="flex h-[64px] min-w-0 items-center justify-center rounded-[20px] bg-[#e1e6ef] px-1 text-[23px] font-extrabold tracking-tight text-[#263750] tabular-nums shadow-[inset_5px_5px_11px_#c2cad6,inset_-5px_-5px_11px_#ffffff] dark:bg-[#1e293a] dark:text-white dark:shadow-[inset_5px_5px_11px_#111827,inset_-5px_-5px_11px_#35445c]">R{amount.toFixed(2)}</div>
              <button type="button" aria-label="Increase revised fare" disabled={revising || amount>=MAX_OFFER} onClick={()=>setAmount(v=>Math.min(MAX_OFFER,v+5))} className="flex h-[58px] items-center justify-center rounded-[19px] bg-[#e9edf5] text-[27px] font-semibold text-[#263750] shadow-[6px_6px_13px_#c4cdda,-6px_-6px_13px_#ffffff] transition active:scale-95 active:shadow-[inset_4px_4px_9px_#c4cdda,inset_-4px_-4px_9px_#ffffff] disabled:opacity-40 dark:bg-[#29364b] dark:text-white dark:shadow-[5px_5px_12px_#151d2c,-5px_-5px_12px_#394a64]">+</button>
            </div>
            <button type="button" onClick={reviseOffer} disabled={revising || cancelling || confirmingOfferId!==null || amount===Number(request.passenger_offer)} className="mt-5 w-full rounded-[18px] bg-[#f15a36] px-4 py-4 text-[12px] font-bold text-white shadow-[5px_6px_14px_rgba(216,75,43,0.27),-3px_-3px_10px_rgba(255,255,255,0.75)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-[5px_6px_14px_#121b2a]">{revising?'Sending revised fare…':'Send revised fare to drivers'}</button>
            <p className="mt-3 px-1 text-[10px] leading-relaxed text-[#657184] dark:text-white/60">Revising your fare replaces previous driver offers. Drivers can respond again. Your 15-minute timer does not restart.</p>
          </div>
          <div className="mt-5 rounded-[26px] bg-[#e9edf5] p-4 shadow-[8px_8px_18px_#c5cdda,-8px_-8px_18px_#ffffff] dark:bg-[#242e40] dark:shadow-[7px_7px_16px_#131b29,-7px_-7px_16px_#35445c]">
            <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#53637b] dark:text-white/70">Driver responses</p><span className="rounded-full bg-[#e1e6ef] px-2.5 py-1 text-[10px] font-bold text-[#e95432] shadow-[inset_2px_2px_5px_#c3cbd8,inset_-2px_-2px_5px_#ffffff] dark:bg-[#1e293a] dark:shadow-none">{request.offers?.filter(o => o.status === "active" && (o.response === "accept" || o.response === "counter")).length || 0}</span></div>
            {request.offers?.filter(o => o.status === "active" && (o.response === "accept" || o.response === "counter")).length ? request.offers.filter(o => o.status === "active" && (o.response === "accept" || o.response === "counter")).map(o => <div key={o.id} className="mb-3 rounded-[20px] bg-[#e3e8f1] p-3 shadow-[inset_4px_4px_9px_#c5cdd9,inset_-4px_-4px_9px_#ffffff] last:mb-0 dark:bg-[#1e293a] dark:shadow-[inset_4px_4px_9px_#131b29,inset_-4px_-4px_9px_#35445c]"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-semibold">Driver #{o.driver_id}</p><p className="mt-1 text-[10px] opacity-60">{o.response === "accept" ? "Accepted your fare" : "Counteroffer"}</p><p className="mt-2 text-[22px] font-extrabold tabular-nums text-[#263750] dark:text-white">R{Number(o.offered_fare).toFixed(2)}</p></div><button type="button" disabled={confirmingOfferId !== null || cancelling} onClick={() => confirmOffer(o.id)} className="shrink-0 rounded-[15px] bg-[#f15a36] px-3 py-3.5 text-[11px] font-bold text-white shadow-[4px_5px_11px_rgba(216,75,43,0.25)] transition active:scale-95 disabled:opacity-50">{confirmingOfferId === o.id ? "Confirming..." : "Choose & confirm"}</button></div></div>) : <div className="rounded-[18px] bg-[#e2e7f0] px-4 py-5 text-center shadow-[inset_4px_4px_9px_#c5cdd9,inset_-4px_-4px_9px_#ffffff] dark:bg-[#1e293a] dark:shadow-[inset_4px_4px_9px_#131b29,inset_-4px_-4px_9px_#35445c]"><p className="text-[12px] font-medium text-[#66758b] dark:text-white/60">No driver has responded yet.</p><p className="mt-1 text-[10px] text-[#8490a2] dark:text-white/40">New offers will appear here automatically.</p></div>}
          </div>
          {error && <p role="alert" className="mt-4 rounded-[14px] bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          <button type="button" disabled={cancelling || confirmingOfferId !== null} onClick={cancelOffer} className="mt-6 w-full rounded-[20px] bg-[#e9edf5] px-5 py-4 text-[13px] font-bold text-[#d64c32] shadow-[7px_7px_16px_#c5cdda,-7px_-7px_16px_#ffffff] transition active:scale-[0.98] active:shadow-[inset_4px_4px_9px_#c5cdda,inset_-4px_-4px_9px_#ffffff] disabled:opacity-50 dark:bg-[#29364b] dark:text-[#ff8b74] dark:shadow-[6px_6px_14px_#131b29,-6px_-6px_14px_#35445c]">{cancelling ? "Cancelling..." : "Cancel fare request"}</button>
        </div>
      </div>
    </div>
  );

  return <section className="mt-5 rounded-[24px] bg-[#e9edf5] p-4 text-[#202c40] shadow-[8px_8px_20px_rgba(31,45,72,0.11),-7px_-7px_18px_rgba(255,255,255,0.95)] dark:bg-[#242b39] dark:text-white dark:shadow-[7px_7px_18px_rgba(0,0,0,0.07),-7px_-7px_18px_rgba(48,51,61,0.85)]">
    <h3 className="text-sm font-bold">Offer your fare</h3>
    <p className="mt-1 text-xs">RouteX suggested fare: <strong>R{suggestedFare.toFixed(2)}</strong></p>
    {confirmedBookingId !== null ? <div className="mt-3 rounded-xl bg-white/70 p-4 text-sm">
      <p className="font-bold">Booking confirmed · #{confirmedBookingId}</p>
      <p className="mt-1">Your driver has been assigned. View your booking in the passenger portal.</p>
    </div> : request?.status === "confirmed" ? <div className="mt-3 rounded-xl bg-white/70 p-4 text-sm">
      <p className="font-bold">Booking confirmed</p>
      <p className="mt-1">Your driver has been assigned. View your booking in the passenger portal.</p>
    </div> : request && request.status === "open" && new Date(request.expires_at).getTime() > now ? <div className="mt-3 space-y-2 text-xs">
      <p className="font-semibold">Your offer: R{Number(request.passenger_offer).toFixed(2)} · {request.status === "open" && new Date(request.expires_at).getTime() > now ? "Waiting for drivers" : request.status === "open" ? "Offer expired" : `Status: ${request.status}`}</p>
      <p>{new Date(request.expires_at).getTime() > now ? "Expires" : "Expired"}: {new Date(request.expires_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</p>
      {request.offers.filter(o => o.status === "active" && (o.response === "accept" || o.response === "counter")).map(o =>
        <div key={o.id} className="rounded-2xl bg-[#e9edf5] p-3 shadow-[inset_3px_3px_7px_#cbd3df,inset_-3px_-3px_7px_#ffffff]">
          <div className="flex items-center justify-between gap-2">
            <div><p className="font-semibold">Driver #{o.driver_id} · {o.response === "accept" ? "Accepted" : "Counteroffer"}</p>
              <p className="mt-1 text-base font-bold">R{Number(o.offered_fare).toFixed(2)}</p></div>
            <button type="button" disabled={confirmingOfferId !== null} onClick={() => confirmOffer(o.id)}
              className="rounded-xl bg-[#ff6846] px-3 py-3 text-xs font-bold text-white disabled:opacity-50">
              {confirmingOfferId === o.id ? "Confirming…" : "Choose driver & confirm"}
            </button>
          </div>
        </div>)}
      <p className="text-slate-600">A trip is booked only after you select a driver and confirmation succeeds.</p>
    </div> : <div className="mt-4 space-y-3">
      {request && <p className="text-xs text-slate-600">Your previous offer has expired or closed. You can submit a new offer below.</p>}
      <div className="grid w-full grid-cols-[42px_minmax(0,1fr)_42px] gap-2">
        <button
          type="button"
          aria-label="Decrease offer by R5"
          disabled={busy || amount <= MIN_OFFER}
          onClick={() => setAmount(v => Math.max(MIN_OFFER, v - OFFER_STEP))}
          className="flex h-12 items-center justify-center rounded-[14px] bg-[#e9edf5] text-[20px] font-bold text-[#202c40] shadow-[8px_8px_20px_rgba(31,45,72,0.11),-7px_-7px_18px_rgba(255,255,255,0.95)] transition active:scale-95 disabled:opacity-40 dark:bg-[#242b39] dark:text-white dark:shadow-[4px_4px_10px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(48,51,61,0.85)]"
        >−</button>
        <div aria-live="polite" aria-label={`Your offer R${amount.toFixed(2)}`} className="flex h-12 min-w-0 items-center justify-center rounded-[13px] bg-[#263750] px-3 text-[20px] font-semibold text-white tabular-nums">
          R{amount.toFixed(2)}
        </div>
        <button
          type="button"
          aria-label="Increase offer by R5"
          disabled={busy || amount >= MAX_OFFER}
          onClick={() => setAmount(v => Math.min(MAX_OFFER, v + OFFER_STEP))}
          className="flex h-12 items-center justify-center rounded-[14px] bg-[#e9edf5] text-[20px] font-bold text-[#202c40] shadow-[8px_8px_20px_rgba(31,45,72,0.11),-7px_-7px_18px_rgba(255,255,255,0.95)] transition active:scale-95 disabled:opacity-40 dark:bg-[#242b39] dark:text-white dark:shadow-[4px_4px_10px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(48,51,61,0.85)]"
        >+</button>
      </div>
      <button type="button" disabled={busy || !quoteToken} onClick={submit} className="w-full rounded-xl bg-[#ff6846] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-40">{busy ? "Sending…" : `Send offer · R${amount.toFixed(2)}`}</button>
    </div>}
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </section>;
}

type DriverRequest = { id: number; pickup_address: string; dropoff_address: string; suggested_fare: number; passenger_offer: number; expires_at: string; my_response?: string | null; my_fare?: number | null; my_status?: string | null };
export function DriverRegionalOffers({ isAvailable }: { isAvailable: boolean }) {
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [counter, setCounter] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    if (!isAvailable) { setRequests([]); setError(""); return; }
    let active = true;
    let inFlight = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (!active || inFlight) return;
      const token = localStorage.getItem("driverToken");
      if (!token) { setError("Driver session missing. Please sign in again."); return; }
      inFlight = true;
      try {
        const r = await fetch(`${API_URL}/driver/regional-fare-requests`, {
          headers: headers(token), cache: "no-store", signal: controller.signal,
        });
        if (!r.ok) {
          if (r.status === 401 || r.status === 403) throw new Error("Driver session expired. Please sign in again.");
          throw new Error(`Unable to load fare offers (HTTP ${r.status}).`);
        }
        const data = await r.json();
        if (active) {
          setRequests(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (e) {
        if (active && !controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Unable to refresh fare offers.");
        }
      } finally { inFlight = false; }
    };
    const onFocus = () => { void refresh(); };
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 3000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAvailable]);
  async function respond(id: number, response: "accept" | "counter" | "decline", passengerOffer: number) {
    setError(""); const token = localStorage.getItem("driverToken"); if (!token) { setError("Sign in again."); return; }
    const fare = response === "counter" ? (counter[id] ?? clampOffer(passengerOffer)) : passengerOffer;
    if (response === "counter" && (!Number.isFinite(fare) || fare < 20 || fare > 10000 || Math.round(fare * 100) !== fare * 100)) { setError("Enter a valid counteroffer (R20–R10,000)."); return; }
    setBusy(id);
    try {
      const r = await fetch(`${API_URL}/driver/regional-fare-requests/${id}/respond`, { method: "POST", headers: headers(token), body: JSON.stringify({ response, offered_fare: fare }) });
      const data = await r.json(); if (!r.ok) throw Error(data.error || "Unable to respond.");
      setRequests(old => old.map(x => x.id === id ? {...x,my_response:response,my_fare:fare,my_status:response === "decline" ? "rejected" : "active"} : x));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to respond."); }
    finally { setBusy(null); }
  }
  return <section className="my-4 rounded-[24px] bg-[#e9eef6] p-3 text-[#172334] shadow-[9px_9px_22px_#c8d0dc,-9px_-9px_22px_#ffffff] dark:bg-[#28384d] dark:text-white dark:shadow-[8px_8px_18px_#172334,-8px_-8px_18px_#354a64]">
    <h3 className="text-[16px] font-bold">Fare offers</h3>
    <p className="mt-1 text-xs opacity-70">Review passenger offers and respond with your price.</p>
    {!isAvailable ? <p className="mt-2 text-xs">Go online and set Available to view requests.</p> : requests.length === 0 ? <p className="mt-2 text-xs">No fare offers available right now.</p> : requests.map(r => <div key={r.id} className="mt-3 rounded-[19px] bg-[#e9eef6] p-3 text-xs shadow-[inset_5px_5px_11px_#cbd3df,inset_-5px_-5px_11px_#ffffff] dark:bg-[#28384d] dark:shadow-[inset_5px_5px_11px_#182638,inset_-5px_-5px_11px_#354a64]">
      <p className="font-semibold">{r.pickup_address} → {r.dropoff_address}</p>
      <div className="mt-2 rounded-[15px] bg-[#e9eef6] px-3 py-2 text-center shadow-[inset_3px_3px_7px_#cbd3df,inset_-3px_-3px_7px_#ffffff] dark:bg-[#28384d] dark:shadow-[inset_3px_3px_7px_#182638,inset_-3px_-3px_7px_#354a64]">
        <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#59677d] dark:text-white/70">Passenger's offer</p>
        <p className="mt-0.5 text-[24px] font-extrabold tabular-nums leading-tight text-[#e95432]">R{Number(r.passenger_offer).toFixed(2)}</p>
      </div>
      {r.my_status === "active" ? <p className="mt-3 rounded-xl bg-white/60 p-3 font-semibold dark:bg-[#34465e]">Your {r.my_response === "counter" ? "counteroffer" : "accepted fare"}: R{Number(r.my_fare).toFixed(2)} · Awaiting passenger decision</p> : r.my_status === "rejected" ? <p className="mt-3 text-xs opacity-70">You declined this offer. Waiting for any revised fare.</p> : null}
      {!r.my_status || r.my_status === "superseded" ? <><div className="mt-2 flex flex-wrap items-center gap-2">
        <button disabled={busy === r.id} onClick={() => respond(r.id, "accept", Number(r.passenger_offer))} className="rounded-xl bg-[#e9eef6] px-3 py-2 font-semibold text-[#172334] shadow-[4px_4px_9px_#c8d0dc,-4px_-4px_9px_#ffffff] transition active:shadow-inner disabled:opacity-50 dark:bg-[#34465e] dark:text-white dark:shadow-none">Accept offer</button>
        <button disabled={busy === r.id} onClick={() => respond(r.id, "decline", Number(r.passenger_offer))} className="rounded-xl bg-[#e9eef6] px-3 py-2 font-semibold text-[#59677d] shadow-[4px_4px_9px_#c8d0dc,-4px_-4px_9px_#ffffff] transition active:shadow-inner disabled:opacity-50 dark:bg-[#34465e] dark:text-white dark:shadow-none">Decline</button>
      </div>
      <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#59677d] dark:text-white/70">Your counteroffer</p>
      <div className="grid w-full grid-cols-[42px_minmax(0,1fr)_42px] gap-2">
        <button type="button" aria-label="Decrease counteroffer by R5" disabled={busy === r.id || (counter[r.id] ?? clampOffer(Number(r.passenger_offer))) <= MIN_OFFER} onClick={() => setCounter(old => ({ ...old, [r.id]: Math.max(MIN_OFFER, (old[r.id] ?? clampOffer(Number(r.passenger_offer))) - OFFER_STEP) }))} className="h-10 rounded-[13px] bg-[#e9eef6] text-xl font-bold text-[#263750] shadow-[4px_4px_9px_#c8d0dc,-4px_-4px_9px_#ffffff] active:shadow-inner disabled:opacity-40 dark:bg-[#34465e] dark:text-white dark:shadow-none">−</button>
        <div className="flex h-10 items-center justify-center rounded-[13px] bg-[#263750] text-xl font-semibold tabular-nums text-white shadow-[inset_3px_3px_7px_#17263d,inset_-2px_-2px_6px_#3c506d]">R{(counter[r.id] ?? clampOffer(Number(r.passenger_offer))).toFixed(2)}</div>
        <button type="button" aria-label="Increase counteroffer by R5" disabled={busy === r.id || (counter[r.id] ?? clampOffer(Number(r.passenger_offer))) >= MAX_OFFER} onClick={() => setCounter(old => ({ ...old, [r.id]: Math.min(MAX_OFFER, (old[r.id] ?? clampOffer(Number(r.passenger_offer))) + OFFER_STEP) }))} className="h-10 rounded-[13px] bg-[#e9eef6] text-xl font-bold text-[#263750] shadow-[4px_4px_9px_#c8d0dc,-4px_-4px_9px_#ffffff] active:shadow-inner disabled:opacity-40 dark:bg-[#34465e] dark:text-white dark:shadow-none">+</button>
      </div>
      <div className="mt-2">
        <button disabled={busy === r.id} onClick={() => respond(r.id, "counter", Number(r.passenger_offer))} className="w-full rounded-[14px] bg-[#ff6846] px-3 py-2.5 font-semibold text-white shadow-[4px_5px_12px_rgba(255,104,70,.24)] transition active:scale-[.99] disabled:opacity-50">Send counteroffer</button>
      </div></> : null}
    </div>)}
    {error && <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
  </section>;
}
