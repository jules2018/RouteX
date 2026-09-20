"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

export default function DriverLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  useEffect(() => {
    const driver = JSON.parse(
      localStorage.getItem("driver") || "null"
    );

    if (driver) {
      router.push("/driver-portal");
    }
  }, [router]);

  const showNotice = (
    message: string,
    type: "error" | "success" = "error"
  ) => {
    setNotice({ message, type });

    window.setTimeout(() => {
      setNotice(null);
    }, 3500);
  };

  const login = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!phone.trim() || !password) {
      showNotice(
        "Please enter your phone number and password."
      );
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/driver-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Driver login response:", data);

      if (!response.ok) {
        showNotice(
          data.error || "Unable to sign in."
        );
        return;
      }

      localStorage.removeItem("passenger");
      localStorage.removeItem("user");

      localStorage.setItem(
        "driver",
        JSON.stringify(data)
      );

      showNotice(
        "Welcome back. Opening your driver portal...",
        "success"
      );

      window.setTimeout(() => {
        window.location.href = "/driver-portal";
      }, 500);
    } catch (error) {
      console.error("DRIVER LOGIN ERROR:", error);

      showNotice(
        "Unable to connect to RouteX. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#e7e9ee] text-[#17191f]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8">

        {/* HEADER */}
        <header className="flex items-center justify-between pt-6">
          <a
            href="/"
            aria-label="Back"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-[14px]
              bg-[#e7e9ee]
              shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]
              transition
              active:scale-95
            "
          >
            <BackIcon />
          </a>

          <h1 className="text-[25px] font-black tracking-[-0.06em]">
            Route<span className="text-[#ff6846]">X</span>
          </h1>

          <div className="h-10 w-10" />
        </header>

        {/* NOTICE */}
        {notice && (
          <div
            className={`
              mt-5
              flex items-start gap-3
              rounded-[17px]
              px-4 py-3.5
              shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]
              ${
                notice.type === "success"
                  ? "bg-[#17191f] text-white"
                  : "bg-[#e7e9ee] text-[#17191f]"
              }
            `}
          >
            <span
              className={`
                mt-0.5
                flex h-7 w-7
                shrink-0
                items-center justify-center
                rounded-[9px]
                ${
                  notice.type === "success"
                    ? "bg-[#ff6846] text-white"
                    : "bg-[#ff6846] text-white"
                }
              `}
            >
              {notice.type === "success" ? (
                <CheckIcon />
              ) : (
                <InfoIcon />
              )}
            </span>

            <p className="pt-1 text-[10px] font-bold leading-4">
              {notice.message}
            </p>
          </div>
        )}

        {/* INTRO */}
        <section className="pt-10">
          <div
            className="
              flex h-14 w-14
              items-center justify-center
              rounded-[18px]
              bg-[#e7e9ee]
              text-[#ff6846]
              shadow-[5px_5px_11px_#c4c6ca,-5px_-5px_11px_#ffffff]
            "
          >
            <SteeringIcon />
          </div>

          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#ff6846]">
            Driver portal
          </p>

          <h2 className="mt-2 text-[34px] font-black leading-[1.03] tracking-[-0.055em]">
            Welcome
            <br />
            back, driver.
          </h2>

          <p className="mt-3 max-w-[290px] text-[13px] font-medium leading-5 text-[#7d8087]">
            Sign in to go online, receive ride requests and manage
            your RouteX trips.
          </p>
        </section>

        {/* LOGIN */}
        <form
          onSubmit={login}
          className="
            mt-8
            rounded-[26px]
            bg-[#e7e9ee]
            p-5
            shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]
          "
        >
          {/* PHONE */}
          <div>
            <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8d9097]">
              Phone number
            </label>

            <div
              className="
                flex items-center
                rounded-[16px]
                bg-[#e7e9ee]
                shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]
              "
            >
              <span className="flex w-12 shrink-0 items-center justify-center text-[#989ba2]">
                <PhoneIcon />
              </span>

              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="082 123 4567"
                className="
                  min-w-0 flex-1
                  bg-transparent
                  py-[15px]
                  pr-4
                  text-[13px]
                  font-bold
                  text-[#17191f]
                  outline-none
                  placeholder:font-medium
                  placeholder:text-[#a0a3a9]
                "
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="mt-5">
            <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8d9097]">
              Password
            </label>

            <div
              className="
                flex items-center
                rounded-[16px]
                bg-[#e7e9ee]
                shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]
              "
            >
              <span className="flex w-12 shrink-0 items-center justify-center text-[#989ba2]">
                <LockIcon />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                className="
                  min-w-0 flex-1
                  bg-transparent
                  py-[15px]
                  text-[13px]
                  font-bold
                  text-[#17191f]
                  outline-none
                  placeholder:font-medium
                  placeholder:text-[#a0a3a9]
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                className="
                  mr-2
                  flex h-9 w-9
                  shrink-0
                  items-center justify-center
                  rounded-[11px]
                  text-[#777b82]
                  transition
                  active:scale-90
                "
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOffIcon />
                ) : (
                  <EyeIcon />
                )}
              </button>
            </div>
          </div>

          {/* SIGN IN */}
          <button
            type="submit"
            disabled={loading}
            className="
              mt-6
              flex w-full
              items-center justify-between
              rounded-[18px]
              bg-[#17191f]
              px-5 py-[16px]
              text-white
              shadow-[5px_5px_11px_#c1c3c8,-4px_-4px_10px_#ffffff]
              transition
              active:scale-[0.985]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <div className="text-left">
              <p className="text-[13px] font-black">
                {loading
                  ? "Signing in..."
                  : "Sign in as driver"}
              </p>

              <p className="mt-0.5 text-[8px] font-semibold text-white/45">
                Access your RouteX driver portal
              </p>
            </div>

            <span
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-full
                bg-[#ff6846]
              "
            >
              {loading ? (
                <Spinner />
              ) : (
                <ArrowIcon />
              )}
            </span>
          </button>
        </form>

        {/* APPROVED DRIVERS */}
        <section
          className="
            mt-6
            flex items-center gap-3
            rounded-[19px]
            bg-[#e7e9ee]
            px-4 py-3.5
            shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]
          "
        >
          <div
            className="
              flex h-9 w-9
              shrink-0
              items-center justify-center
              rounded-[12px]
              bg-[#e7e9ee]
              text-[#ff6846]
              shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]
            "
          >
            <ShieldIcon />
          </div>

          <div>
            <p className="text-[10px] font-extrabold">
              Approved drivers only
            </p>

            <p className="mt-0.5 text-[8px] font-semibold leading-4 text-[#92959b]">
              Driver accounts are activated after RouteX verification.
            </p>
          </div>
        </section>

        {/* LINKS */}
        <section className="mt-auto pt-8 text-center">
          <p className="text-[10px] font-semibold text-[#8e9198]">
            Want to drive with RouteX?
          </p>

          <a
            href="/become-a-driver"
            className="mt-2 inline-block text-[11px] font-black text-[#ff6846]"
          >
            Apply to become a driver
          </a>

          <div className="mx-auto my-5 h-px w-16 bg-[#cfd1d6]" />

          <p className="text-[9px] font-semibold text-[#96999f]">
            Looking to book a ride?
          </p>

          <a
            href="/passenger-login"
            className="mt-1.5 inline-block text-[10px] font-black text-[#17191f]"
          >
            Passenger login
          </a>
        </section>

        <footer className="pt-7 text-center">
          <p className="text-[9px] font-semibold text-[#a0a3a9]">
            RouteX • Getting Upington Moving
          </p>
        </footer>
      </div>
    </main>
  );
}

/* =========================
   ICONS
========================= */

function BackIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function SteeringIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M3.5 10h17" />
      <path d="m12 14.5-3.5 5" />
      <path d="m12 14.5 3.5 5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon() {
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
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
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
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2" />
      <path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 4.1-.9" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function ArrowIcon() {
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

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}