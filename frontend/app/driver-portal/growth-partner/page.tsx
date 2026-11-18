"use client";

import { useEffect, useState } from "react";

type PartnerStats = {
  partner_name: string;
  referral_code: string;
  passengers_recruited: number;
  driver_applications: number;
  completed_trips: number;
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

export function GrowthPartnerDashboard() {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      try {
        const token =
          localStorage.getItem("driverToken") ||
          sessionStorage.getItem("driverToken");

        if (!token) {
          window.location.replace("/driver-login");
          return;
        }

        const response = await fetch(
          `${API_URL}/driver/growth-partner/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        if (response.status === 403) {
          throw new Error("Growth Partner access is not enabled for this account.");
        }

        if (!response.ok) {
          throw new Error("Unable to load Growth Partner statistics.");
        }

        const data: PartnerStats = await response.json();

        if (!controller.signal.aborted) {
          setStats(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => controller.abort();
  }, []);

  async function copyCode() {
    if (!stats?.referral_code) return;

    try {
      await navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
    } catch {
      setError("Could not copy the code. Please copy it manually.");
    }
  }

  return (
    <main className="min-h-screen bg-[#e9edf4] px-4 py-8 text-[#17191f] dark:bg-[#262b34] dark:text-white">
      <div className="mx-auto max-w-[650px]">

        <header className="mt-5 rounded-[25px] bg-gradient-to-br from-[#172c42] via-[#253e57] to-[#d9674d] p-6 text-white shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
            RouteX Upington
          </p>
          <h1 className="mt-2 text-[25px] font-bold">
            Growth Partner
          </h1>
          <p className="mt-2 text-[12px] text-white/80">
            Your contribution to growing the RouteX network.
          </p>
        </header>

        {loading && (
          <p className="mt-8 text-center text-[13px]">
            Loading your dashboard...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-[18px] bg-white p-5 text-[12px] text-red-600 dark:bg-[#1c1e24]"
          >
            {error}
          </div>
        )}

        {stats && (
          <>
            <section className="mt-5 rounded-[22px] bg-[#e9edf4] p-5 shadow-[6px_6px_14px_#c4c6ca,-6px_-6px_14px_#ffffff] dark:bg-[#1c1e24] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]">
              <p className="text-[11px] text-gray-500">
                Welcome
              </p>
              <h2 className="mt-1 text-[20px] font-bold">
                {stats.partner_name}
              </h2>

              <p className="mt-6 text-[11px] font-semibold text-gray-500">
                YOUR REFERRAL CODE
              </p>

              <div className="mt-2 flex items-center justify-between gap-3 rounded-[15px] bg-[#e9edf4] p-4 shadow-[inset_4px_4px_9px_#c4c6ca,inset_-4px_-4px_9px_#ffffff] dark:bg-[#30333d] dark:shadow-[inset_4px_4px_9px_#17191f,inset_-4px_-4px_9px_#424650]">
                <span className="break-all text-[17px] font-bold tracking-wide text-[#ff6846]">
                  {stats.referral_code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="shrink-0 rounded-xl bg-[#ff6846] px-4 py-2 text-[11px] font-semibold text-white"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <p className="mt-3 text-[11px] text-gray-500">
                Share this code with people registering on RouteX.
              </p>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3">
              {[
                {
                  label: "Passengers recruited",
                  value: stats.passengers_recruited,
                },
                {
                  label: "Driver applications",
                  value: stats.driver_applications,
                },
                {
                  label: "Completed rides",
                  value: stats.completed_trips,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[20px] bg-[#e9edf4] p-5 shadow-[6px_6px_14px_#c4c6ca,-6px_-6px_14px_#ffffff] dark:bg-[#1c1e24] dark:shadow-[7px_7px_16px_#101116,-7px_-7px_16px_#30333d]"
                >
                  <p className="text-[28px] font-bold text-[#ff6846]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-gray-500">
                    {item.label}
                  </p>
                </div>
              ))}
            </section>

            <p className="mt-6 text-center text-[11px] text-gray-500">
              Statistics reflect referrals recorded using your code.
              They do not represent earnings or profit-sharing payments.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default GrowthPartnerDashboard;
