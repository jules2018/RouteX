"use client";



import { useRef, useState } from "react";

import { API_URL } from "../lib/api";



type DriverForm = {

  full_name: string;

  phone: string;

  residential_address: string;
  operating_town: string;

  id_passport_number: string;

  vehicle_type: string;

  vehicle_color: string;

  license_plate: string;

  referral_code: string;

};



const emptyForm: DriverForm = {

  full_name: "", phone: "", residential_address: "", operating_town: "Upington", id_passport_number: "",

  vehicle_type: "", vehicle_color: "", license_plate: "", referral_code: "",

};



const inputStyle = "w-full min-w-0 rounded-[22px] border border-white/50 bg-[#e8eaf0] py-[17px] pl-[58px] pr-4 text-[15px] font-medium text-[#161a20] outline-none placeholder:text-[#9aa1ad] shadow-[inset_5px_5px_10px_rgba(58,65,80,0.19),inset_-5px_-5px_10px_rgba(255,255,255,0.96)] transition focus:ring-2 focus:ring-[#ff6846]/35";

const raisedStyle = "rounded-[34px] border border-white/60 bg-[#e8eaf0] shadow-[12px_12px_26px_rgba(66,73,90,0.14),-12px_-12px_26px_rgba(255,255,255,0.95)]";



type IconName = "user" | "phone" | "home" | "id" | "car" | "palette" | "plate" | "ticket" | "camera";

function FieldIcon({ name }: { name: IconName }) {

  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (

    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true" {...common}>

      {name === "user" && <><circle cx="12" cy="7.5" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></>}

      {name === "phone" && <path d="M7 3H4a2 2 0 0 0-2 2c0 9.4 7.6 17 17 17a2 2 0 0 0 2-2v-3l-5-2-2 3a15 15 0 0 1-8-8l3-2-2-5Z"/>}

      {name === "home" && <><path d="m3 11 9-8 9 8v10H3Z"/><path d="M9 21v-7h6v7"/></>}

      {name === "id" && <><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M5 16c.5-2 5.5-2 6 0M14 9h5M14 13h5"/></>}

      {name === "car" && <><path d="m5 11 2-6h10l2 6M4 11h16v8H4zM6 19v2M18 19v2"/><circle cx="7" cy="15" r="1"/><circle cx="17" cy="15" r="1"/></>}

      {name === "palette" && <><circle cx="12" cy="12" r="9"/><circle cx="8" cy="8" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="7" cy="14" r="1"/><path d="M16 15a2 2 0 0 0 0 4"/></>}

      {name === "plate" && <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h5M6 14h8M17 11h1"/></>}

      {name === "ticket" && <><path d="M3 6h18v5a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4Z"/><path d="M12 6v12" strokeDasharray="2 2"/></>}

      {name === "camera" && <><path d="M3 8h4l2-3h6l2 3h4v12H3Z"/><circle cx="12" cy="14" r="4"/></>}

    </svg>

  );

}



async function compressPhoto(file: File): Promise<File> {

  if (!file.type.startsWith("image/")) throw new Error("Please select a valid image.");

  // Unsupported formats (e.g. HEIC in some browsers) are sent unchanged rather than lost.

  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  const image = new Image();

  const url = URL.createObjectURL(file);

  try {

    await new Promise<void>((resolve, reject) => {

      image.onload = () => resolve();

      image.onerror = () => reject(new Error("Could not read this photo. Try a JPG or PNG."));

      image.src = url;

    });

    const maxEdge = 1280;

    const ratio = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));

    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));

    const ctx = canvas.getContext("2d");

    if (!ctx) return file;

    ctx.fillStyle = "#fff";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.76));

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });

  } finally {

    URL.revokeObjectURL(url);

  }

}



export default function BecomeADriverPage() {

  const [form, setForm] = useState<DriverForm>(emptyForm);

  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const submittingRef = useRef(false);

  const [stage, setStage] = useState("");

  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const [acceptedDriverTerms, setAcceptedDriverTerms] = useState(false);

  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const vehicleInput = useRef<HTMLInputElement>(null);

  const profileInput = useRef<HTMLInputElement>(null);



  const update = (key: keyof DriverForm, value: string) => setForm((previous) => ({ ...previous, [key]: value }));



  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    if (submittingRef.current) return;

    setNotice(null);

    if (!form.full_name.trim() || !form.phone.trim() || !form.residential_address.trim() ||

        !form.id_passport_number.trim() || !form.vehicle_type.trim() ||

        !form.vehicle_color.trim() || !form.license_plate.trim()) {

      setNotice({ ok: false, message: "Please complete all required fields." });

      return;

    }

    if (!vehiclePhoto || !profilePhoto) {

      setNotice({ ok: false, message: "Please upload both a vehicle photo and a profile photo." });

      return;

    }

    if (!acceptedDriverTerms || !acceptedPrivacy) {

      setNotice({ ok: false, message: "Please accept both agreements to continue." });

      return;

    }



    submittingRef.current = true;

    setSubmitting(true);

    try {

      setStage("Preparing your photos...");

      const [vehicle, profile] = await Promise.all([

        compressPhoto(vehiclePhoto), compressPhoto(profilePhoto),

      ]);

      const formData = new FormData();

      for (const [key, value] of Object.entries(form)) formData.append(key, value);

      formData.append("acceptedDriverTerms", String(acceptedDriverTerms));

      formData.append("acceptedPrivacy", String(acceptedPrivacy));

      formData.append("vehicle_photo", vehicle);

      formData.append("profile_photo", profile);

      setStage("Sending your application. Please keep this page open...");

      const response = await fetch(`${API_URL}/driver-application`, { method: "POST", body: formData });

      if (!response.ok) {

        const errorData = await response.json().catch(() => null);

        throw new Error(errorData?.error || `Submission failed (HTTP ${response.status}). Please try again.`);

      }

      setNotice({ ok: true, message: "Application submitted successfully. RouteX will review your application." });

      setForm(emptyForm);

      setVehiclePhoto(null);

      setProfilePhoto(null);

      setAcceptedDriverTerms(false);

      setAcceptedPrivacy(false);

      if (vehicleInput.current) vehicleInput.current.value = "";

      if (profileInput.current) profileInput.current.value = "";

    } catch (error) {

      console.error("Driver application error:", error);

      setNotice({ ok: false, message: error instanceof Error ? error.message : "Something went wrong. Please try again." });

    } finally {

      setStage("");

      setSubmitting(false);

      submittingRef.current = false;

    }

  }



  const fields: { key: keyof DriverForm; label: string; placeholder: string; icon: IconName; optional?: boolean }[] = [

    { key: "full_name", label: "Full name", placeholder: "Your full name", icon: "user" },

    { key: "phone", label: "Phone number", placeholder: "0821234567", icon: "phone" },

    { key: "residential_address", label: "Residential address", placeholder: "Enter your residential address", icon: "home" },

    { key: "id_passport_number", label: "SA ID or Passport number", placeholder: "Enter your ID or passport number", icon: "id" },

    { key: "vehicle_type", label: "Vehicle", placeholder: "e.g. Toyota Corolla", icon: "car" },

    { key: "vehicle_color", label: "Vehicle colour", placeholder: "e.g. White", icon: "palette" },

    { key: "license_plate", label: "Registration number", placeholder: "e.g. CA 123-456", icon: "plate" },

    { key: "referral_code", label: "Referral code", placeholder: "Enter referral code", icon: "ticket", optional: true },

  ];



  return (

    <main className="min-h-screen bg-[#e8eaf0] text-[#121721]">

      <div className="mx-auto w-full max-w-[590px] px-5 pb-12 pt-7 sm:px-7">

        <header className="flex items-center justify-between px-1">

          <div className="text-[23px] font-black tracking-[-0.06em]">Route<span className="text-[#ff6846]">X</span></div>

          <span className="rounded-full bg-[#e8eaf0] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#f26747] shadow-[4px_4px_9px_rgba(55,63,80,0.14),-4px_-4px_9px_white]">Driver registration</span>

        </header>



        <section className="mt-8 px-1">

          <div className="mb-5 h-[5px] w-12 rounded-full bg-[#ff6846]" />

          <h1 className="text-[31px] font-black tracking-[-0.055em]">Drive with RouteX</h1>

          <p className="mt-2 text-[14px] leading-6 text-[#687080]">Apply to become a RouteX driver and earn by helping people travel around your town and the wider region.</p>

        </section>



        <form onSubmit={handleSubmit} className={`${raisedStyle} mt-7 px-5 py-7 sm:px-7`} noValidate>

          <div className="space-y-5">

            {fields.slice(0, 7).map((field) => (

              <label key={field.key} className="block">

                <span className="mb-3 block pl-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#929baa]">{field.label} <span className="text-[#ff6846]">*</span></span>

                <span className="relative block">

                  <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-[#9198a5]"><FieldIcon name={field.icon} /></span>

                  <input className={inputStyle} type={field.key === "phone" ? "tel" : "text"}

                    inputMode={field.key === "phone" ? "numeric" : undefined}

                    autoComplete={field.key === "phone" ? "tel" : field.key === "residential_address" ? "street-address" : "off"}

                    placeholder={field.placeholder} value={form[field.key]} disabled={submitting} required

                    onChange={(e) => update(field.key, field.key === "phone" ? e.target.value.replace(/\D/g, "") : field.key === "license_plate" ? e.target.value.toUpperCase() : e.target.value)} />

                </span>

              </label>

            ))}



            <label className="block">
              <span className="mb-3 block pl-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#929baa]">Operating town *</span>
              <input className={inputStyle} value={form.operating_town} maxLength={100}
                onChange={(e) => update("operating_town", e.target.value)}
                placeholder="e.g. Upington, Keimoes, Groblershoop"
                disabled={submitting} required />
              <span className="mt-2 block text-[11px] text-[#818a99]">Your normal operating town. Live GPS determines nearby bookings.</span>
            </label>

            <div className="pt-2">

              <p className="mb-4 pl-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#929baa]">Required photos</p>

              <div className="space-y-4">

                {[

                  { title: "Vehicle photo", help: "Select a clear photo of your vehicle", file: vehiclePhoto, set: setVehiclePhoto, ref: vehicleInput },

                  { title: "Profile photo", help: "Select a clear photo of yourself", file: profilePhoto, set: setProfilePhoto, ref: profileInput },

                ].map((photo) => (

                  <label key={photo.title} className="flex cursor-pointer items-center gap-4 rounded-[22px] border border-white/50 bg-[#e8eaf0] px-4 py-4 shadow-[inset_5px_5px_10px_rgba(58,65,80,0.16),inset_-5px_-5px_10px_white]">

                    <span className="text-[#929baa]"><FieldIcon name="camera" /></span>

                    <span className="min-w-0 flex-1">

                      <span className="block text-[12px] font-bold text-[#353b46]">{photo.title} <span className="text-[#ff6846]">*</span></span>

                      <span className="mt-1 block truncate text-[11px] text-[#929baa]">{photo.file ? photo.file.name : photo.help}</span>

                    </span>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8eaf0] text-lg font-bold text-[#ff6846] shadow-[3px_3px_7px_rgba(58,65,80,0.17),-3px_-3px_7px_white]">{photo.file ? "✓" : "+"}</span>

                    <input ref={photo.ref} type="file" accept="image/*" className="sr-only" required disabled={submitting} onChange={(e) => photo.set(e.target.files?.[0] || null)} />

                  </label>

                ))}

              </div>

              <p className="mt-3 text-[11px] leading-5 text-[#818a99]">Large photos are automatically compressed before uploading.</p>

            </div>



            <label className="block pt-1">

              <span className="mb-3 flex justify-between pl-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#929baa]">Referral code <span className="font-medium normal-case tracking-normal">Optional</span></span>

              <span className="relative block">

                <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-[#9198a5]"><FieldIcon name="ticket" /></span>

                <input className={inputStyle} type="text" placeholder="Enter referral code" value={form.referral_code} disabled={submitting} onChange={(e) => update("referral_code", e.target.value)} />

              </span>

            </label>



            <div className="space-y-4 pt-2">

              <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-5 text-[#687080]">

                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#ff6846]" checked={acceptedDriverTerms} onChange={(e) => setAcceptedDriverTerms(e.target.checked)} disabled={submitting} />

                <span>I agree to the <a href="/driver-terms" target="_blank" rel="noopener noreferrer" className="font-bold text-[#ff6846] underline underline-offset-2">Driver Terms and Independent Contractor Agreement</a>.</span>

              </label>

              <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-5 text-[#687080]">

                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#ff6846]" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} disabled={submitting} />

                <span>I agree to the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-[#ff6846] underline underline-offset-2">Privacy Policy</a>.</span>

              </label>

            </div>

          </div>



          {notice && <div role="status" aria-live="polite" className={`mt-5 rounded-2xl border px-4 py-3 text-[13px] font-semibold ${notice.ok ? "border-[#b8d8c7] bg-white text-[#196b42]" : "border-[#f5c9be] bg-white text-[#a93f27]"}`}>{notice.message}</div>}

          {submitting && <p role="status" aria-live="polite" className="mt-5 text-center text-[12px] font-semibold text-[#687080]">{stage}</p>}

          <button type="submit" disabled={submitting || !acceptedDriverTerms || !acceptedPrivacy}

            className="mt-6 w-full rounded-[22px] bg-[#17191f] px-5 py-4 text-[15px] font-extrabold text-white shadow-[6px_6px_14px_rgba(34,42,55,0.27),-5px_-5px_12px_rgba(255,255,255,0.86)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55">

            {submitting ? "Submitting application..." : "Apply to drive →"}

          </button>

        </form>

        <p className="mt-7 text-center text-[13px] text-[#737b87]">Already approved? <a href="/driver-login" className="font-extrabold text-[#ff6846]">Driver sign in</a></p>

      </div>

    </main>

  );

}
