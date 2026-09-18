"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

type Stats = {
  passengers: number;
  drivers: number;
  bookings: number;
  onlineDrivers: number;
  pendingApplications: number;
};

type Application = {
  id: number;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_color: string;
  license_plate: string;
  referral_code?: string | null;
  vehicle_image?: string | null;
  profile_image?: string | null;
  created_at: string;
};

type Passenger = {
  id: number;
  full_name: string;
  phone: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    passengers: 0,
    drivers: 0,
    bookings: 0,
    onlineDrivers: 0,
    pendingApplications: 0,
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [setupDriver, setSetupDriver] = useState("");
  const [setupLink, setSetupLink] = useState("");

  // =====================================
  // LOAD DASHBOARD
  // =====================================

  const loadDashboardData = async () => {
    try {
      const [statsResponse, applicationsResponse, passengersResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/stats`, {
            cache: "no-store",
          }),
          fetch(`${API_URL}/admin/applications`, {
            cache: "no-store",
          }),
          fetch(`${API_URL}/admin/passengers`, {
            cache: "no-store",
          }),
        ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();

        setStats({
          passengers: Number(statsData.passengers) || 0,
          drivers: Number(statsData.drivers) || 0,
          bookings: Number(statsData.bookings) || 0,
          onlineDrivers: Number(statsData.onlineDrivers) || 0,
          pendingApplications:
            Number(statsData.pendingApplications) || 0,
        });
      }

      if (applicationsResponse.ok) {
        const applicationData = await applicationsResponse.json();

        setApplications(
          Array.isArray(applicationData)
            ? applicationData
            : []
        );
      }

      if (passengersResponse.ok) {
        const passengerData = await passengersResponse.json();

        setPassengers(
          Array.isArray(passengerData)
            ? passengerData
            : []
        );
      }
    } catch (error) {
      console.error("ADMIN DASHBOARD LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // =====================================
  // APPROVE DRIVER
  // =====================================

  const approveDriver = async (application: Application) => {
    try {
      setProcessingId(application.id);

      const response = await fetch(
        `${API_URL}/admin/applications/${application.id}/approve`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to approve driver.");
        return;
      }

      if (data.setup_link) {
        setSetupDriver(application.full_name);
        setSetupLink(data.setup_link);
      }

      await loadDashboardData();
    } catch (error) {
      console.error("APPROVE DRIVER ERROR:", error);
      alert("Unable to approve driver.");
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================
  // REJECT DRIVER
  // =====================================

  const rejectDriver = async (application: Application) => {
    const confirmed = window.confirm(
      `Reject ${application.full_name}'s driver application?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(application.id);

      const response = await fetch(
        `${API_URL}/admin/applications/${application.id}/reject`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to reject application.");
        return;
      }

      await loadDashboardData();
    } catch (error) {
      console.error("REJECT DRIVER ERROR:", error);
      alert("Unable to reject application.");
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================
  // COPY PASSWORD SETUP LINK
  // =====================================

  const copySetupLink = async () => {
    try {
      await navigator.clipboard.writeText(setupLink);
      alert("Password setup link copied.");
    } catch {
      alert("Unable to copy the link.");
    }
  };

  // =====================================
  // LOGOUT
  // =====================================

  const logout = () => {
    localStorage.removeItem("admin");
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#f6f6f6] text-black">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="sticky top-0 z-30 border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <div>
            <h1 className="text-[24px] font-black tracking-tight">
              Route<span className="text-[#ff6a00]">X</span>
            </h1>

            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#999999]">
              Admin
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 rounded-full bg-[#f5f5f5] px-3 py-2 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  stats.onlineDrivers > 0
                    ? "bg-[#ff6a00]"
                    : "bg-[#bbbbbb]"
                }`}
              />

              <span className="text-xs font-bold text-[#666666]">
                {stats.onlineDrivers} online
              </span>
            </div>

            <button
              onClick={logout}
              className="rounded-full border border-[#dddddd] bg-white px-4 py-2 text-xs font-bold transition hover:bg-[#f7f7f7]"
            >
              Log out
            </button>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">

        {/* =====================================
            WELCOME
        ===================================== */}

        <section>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#ff6a00]">
            RouteX Control Centre
          </p>

          <h2 className="mt-2 text-[30px] font-black tracking-tight sm:text-[36px]">
            Dashboard
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#777777]">
            Monitor RouteX activity, manage driver applications
            and contact registered passengers.
          </p>
        </section>

        {/* =====================================
            STATS
        ===================================== */}

        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">

          <StatCard
            label="Passengers"
            value={stats.passengers}
          />

          <StatCard
            label="Drivers"
            value={stats.drivers}
          />

          <StatCard
            label="Bookings"
            value={stats.bookings}
          />

          <StatCard
            label="Online now"
            value={stats.onlineDrivers}
            active={stats.onlineDrivers > 0}
          />

          <StatCard
            label="Pending"
            value={stats.pendingApplications}
            active={stats.pendingApplications > 0}
          />

        </section>

        {/* =====================================
            DRIVER PASSWORD SETUP
        ===================================== */}

        {setupLink && (
          <section className="mt-8 overflow-hidden rounded-[24px] bg-black text-white">

            <div className="h-1.5 bg-[#ff6a00]" />

            <div className="p-5 sm:p-7">

              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#ff6a00]">
                Driver Approved
              </p>

              <h3 className="mt-2 text-xl font-black">
                {setupDriver}
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                The driver account has been created. Send this
                secure setup link to the driver so they can create
                their own password.
              </p>

              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <p className="break-all text-xs leading-5 text-white/80">
                  {setupLink}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                <button
                  onClick={copySetupLink}
                  className="rounded-xl bg-[#ff6a00] px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
                >
                  Copy setup link
                </button>

                <button
                  onClick={() => {
                    setSetupLink("");
                    setSetupDriver("");
                  }}
                  className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Close
                </button>

              </div>
            </div>
          </section>
        )}

        {/* =====================================
            DRIVER APPLICATIONS
        ===================================== */}

        <section className="mt-10">

          <div className="flex items-end justify-between gap-4">

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#ff6a00]">
                Drivers
              </p>

              <h2 className="mt-1 text-[22px] font-black tracking-tight">
                Driver applications
              </h2>

              <p className="mt-1 text-sm text-[#777777]">
                Review people who want to drive with RouteX.
              </p>
            </div>

            {applications.length > 0 && (
              <span className="rounded-full bg-[#fff1e8] px-3 py-1.5 text-xs font-black text-[#ff6a00]">
                {applications.length} pending
              </span>
            )}

          </div>

          {loading ? (
            <div className="mt-5 rounded-[22px] border border-[#e5e5e5] bg-white p-8 text-center text-sm text-[#888888]">
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-[#e5e5e5] bg-white p-8 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1e8]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />
              </div>

              <h3 className="mt-4 font-black">
                No pending applications
              </h3>

              <p className="mt-1 text-sm text-[#888888]">
                New driver applications will appear here.
              </p>

            </div>
          ) : (
            <div className="mt-5 space-y-4">

              {applications.map((application) => (
                <article
                  key={application.id}
                  className="overflow-hidden rounded-[22px] border border-[#e5e5e5] bg-white"
                >

                  <div className="flex flex-col gap-4 border-b border-[#eeeeee] p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <h3 className="text-lg font-black">
                        {application.full_name}
                      </h3>

                      <p className="mt-1 text-sm text-[#888888]">
                        {application.created_at
                          ? `Applied ${new Date(
                              application.created_at
                            ).toLocaleDateString()}`
                          : "Driver application"}
                      </p>
                    </div>

                    <span className="self-start rounded-full bg-[#fff1e8] px-3 py-1.5 text-xs font-black text-[#ff6a00]">
                      Pending
                    </span>

                  </div>

                  <div className="p-5">

  {/* Vehicle Photo */}
  {application.vehicle_image && (
    <div className="mb-6">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#aaaaaa]">
        Vehicle photo
      </p>

      <div className="overflow-hidden rounded-[18px] border border-[#eeeeee] bg-[#f7f7f7]">
        <img
          src={application.vehicle_image}
          alt={`${application.full_name} vehicle`}
          className="h-52 w-full object-cover sm:h-64"
        />
      </div>
    </div>
  )}

                    <div className="grid grid-cols-2 gap-x-5 gap-y-5 lg:grid-cols-4">

                      <Detail
                        label="Phone"
                        value={application.phone}
                      />

                      <Detail
                        label="Vehicle"
                        value={application.vehicle_type}
                      />

                      <Detail
                        label="Colour"
                        value={application.vehicle_color}
                      />

                      <Detail
                        label="Registration"
                        value={application.license_plate}
                      />

                    </div>

                    {application.referral_code && (
                      <div className="mt-5 border-t border-[#eeeeee] pt-5">
                        <Detail
                          label="Referral code"
                          value={application.referral_code}
                        />
                      </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                      <button
                        disabled={processingId === application.id}
                        onClick={() =>
                          approveDriver(application)
                        }
                        className="rounded-xl bg-[#ff6a00] px-6 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {processingId === application.id
                          ? "Processing..."
                          : "Approve driver"}
                      </button>

                      <button
                        disabled={processingId === application.id}
                        onClick={() =>
                          rejectDriver(application)
                        }
                        className="rounded-xl border border-[#dddddd] bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-[#f7f7f7] disabled:opacity-50"
                      >
                        Reject
                      </button>

                    </div>

                  </div>
                </article>
              ))}

            </div>
          )}

        </section>

        {/* =====================================
            PASSENGERS
        ===================================== */}

        <section className="mt-12 pb-10">

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#ff6a00]">
              Community
            </p>

            <h2 className="mt-1 text-[22px] font-black tracking-tight">
              Passengers
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              Registered RouteX passengers.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-[#e5e5e5] bg-white">

            {passengers.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#888888]">
                No passengers found.
              </div>
            ) : (
              passengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className={`flex items-center justify-between gap-4 p-4 sm:p-5 ${
                    index !== passengers.length - 1
                      ? "border-b border-[#eeeeee]"
                      : ""
                  }`}
                >

                  <div className="min-w-0">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-sm font-black text-black">
                        {passenger.full_name
                          ?.charAt(0)
                          ?.toUpperCase() || "P"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {passenger.full_name}
                        </p>

                        <p className="mt-0.5 text-xs text-[#888888]">
                          {passenger.phone}
                        </p>
                      </div>

                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${formatWhatsAppNumber(
                      passenger.phone
                    )}?text=${encodeURIComponent(
                      `Hi ${passenger.full_name},

As one of our first RouteX members, you've received R20 OFF your first ride.

Use promo code:

WELCOME20

Enter the code when booking your trip.

Book here:
https://routex-frontend.onrender.com

RouteX • Getting Upington Moving`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#222222]"
                  >
                    WhatsApp
                  </a>

                </div>
              ))
            )}

          </div>

        </section>

      </div>
    </main>
  );
}

// =====================================
// STAT CARD
// =====================================

function StatCard({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[#e5e5e5] bg-white p-4 sm:p-5">

      <div className="flex items-center justify-between gap-2">

        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#888888]">
          {label}
        </p>

        {active && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff6a00]" />
        )}

      </div>

      <p className="mt-3 text-[28px] font-black tracking-tight">
        {value}
      </p>

    </div>
  );
}

// =====================================
// DETAIL
// =====================================

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#aaaaaa]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-[#333333]">
        {value || "—"}
      </p>
    </div>
  );
}

// =====================================
// WHATSAPP PHONE FORMAT
// =====================================

function formatWhatsAppNumber(phone: string) {
  const cleaned = String(phone || "").replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    return `27${cleaned.substring(1)}`;
  }

  return cleaned;
}