"use client";

import { Poppins } from "next/font/google";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async () => {
    setError("");

    if (!phone.trim()) {
      setError("Please enter your mobile number.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to send verification code."
        );
        return;
      }

      // Remember the mobile number for the next screen
      sessionStorage.setItem(
        "passwordResetPhone",
        phone.trim()
      );

      router.push("/reset-password");
    } catch (error) {
      console.error("FORGOT PASSWORD ERROR:", error);

      setError(
        "Unable to connect to RouteX. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`${poppins.className} min-h-[100svh] bg-[#e7e9ee] text-[#17191f]`}>
      <section className="mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col px-5 pb-6 pt-5">

        <button
          type="button"
          onClick={() => router.back()}
          className="mb-10 flex w-fit items-center text-[12px] font-bold text-[#777b82]"
        >
          ← Back
        </button>

        <div className="flex flex-1 flex-col justify-center pb-20">
  <div className="relative rounded-[32px] bg-white px-6 py-8 shadow-[10px_10px_25px_#c5c7cc,-10px_-10px_25px_#ffffff]">
<div className="mx-auto mb-6 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white shadow-[6px_6px_14px_#c5c7cc,-6px_-6px_14px_#ffffff]">
  <span className="text-[26px]">
    🔐
  </span>
</div>
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff6846]">
              RouteX
            </p>

            <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em]">
              Forgot password?
            </h1>

            <p className="mt-3 text-[13px] font-medium leading-5 text-[#777b82]">
             Enter your mobile number and we'll send an OTP to your registered email.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-[#777b82]">
              Mobile number
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="065 154 9321"
              autoComplete="tel"
              className="w-full rounded-[18px] bg-white px-4 py-4 text-[14px] font-semibold outline-none shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff] placeholder:text-[#a0a3a9]"
            />

            {error && (
              <p className="mt-3 text-[11px] font-semibold text-[#ff6846]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={requestCode}
              disabled={loading}
              className="mt-5 w-full rounded-[18px] bg-[#17191f] px-4 py-4 text-[12px] font-black text-white shadow-[4px_4px_9px_#c3c5ca,-4px_-4px_9px_#ffffff] active:scale-[0.985] disabled:opacity-50"
            >
              {loading ? "Sending code..." : "Send OTP"}
            </button>
          </div>

        </div>
  </div>
        <p className="text-center text-[9px] font-semibold text-[#a0a3a9]">
          RouteX • Getting Upington Moving
        </p>

      </section>
    </main>
  );
}