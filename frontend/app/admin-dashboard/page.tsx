"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { API_URL } from "../lib/api";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  CarFront,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";

type Section =
  | "overview"
  | "operations"
  | "bookings"
  | "drivers"
  | "passengers"
  | "analytics";

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

type Passenger = { id: number; full_name: string; phone: string };

type Booking = {
  id: number;
  passenger_id: number | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  booking_status: string | null;
  trip_status: string | null;
  assigned_driver_id: number | null;
  driver_name: string | null;
};

type Driver = {
  id: number;
  full_name: string;
  vehicle_type: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  status: string | null;
  is_online: boolean;
  last_online_at: string | null;
};

type OperationGroup =
  "waiting" | "assigned" | "in_progress" | "completed" | "cancelled" | "other";

function operationGroup(booking: Booking): OperationGroup {
  const statuses = [booking.booking_status, booking.trip_status]
    .filter((value): value is string => Boolean(value))
    .map((value) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_"),
    );
  if (
    statuses.some((value) =>
      ["cancelled", "canceled", "expired", "rejected"].includes(value),
    )
  )
    return "cancelled";
  if (
    statuses.some((value) =>
      ["completed", "complete", "finished"].includes(value),
    )
  )
    return "completed";
  if (
    statuses.some((value) =>
      ["in_progress", "ongoing", "started"].includes(value),
    )
  )
    return "in_progress";
  if (
    statuses.some((value) =>
      ["accepted", "assigned", "driver_assigned", "confirmed"].includes(value),
    )
  )
    return "assigned";
  if (
    statuses.some((value) =>
      ["waiting", "pending", "requested", "searching", "unassigned"].includes(
        value,
      ),
    )
  )
    return "waiting";
  return "other";
}

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },

  { id: "operations", label: "Live operations", icon: Activity },

  { id: "bookings", label: "Bookings", icon: CalendarDays },

  { id: "drivers", label: "Drivers", icon: CarFront },

  { id: "passengers", label: "Passengers", icon: Users },

  { id: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
] as const;

const EMPTY_STATS: Stats = {
  passengers: 0,
  drivers: 0,
  bookings: 0,
  onlineDrivers: 0,
  pendingApplications: 0,
};

function formatWhatsAppNumber(phone: string) {
  const cleaned = String(phone || "").replace(/\D/g, "");

  if (cleaned.startsWith("0")) return `27${cleaned.slice(1)}`;

  return cleaned;
}

function passengerMessage(passenger: Passenger) {
  return `Hi ${passenger.full_name},\n\nAs one of our first RouteX members, you've received R20 OFF your first ride.\n\nUse promo code:\nWELCOME20\n\nEnter the code when booking your trip.\n\nBook here:\nhttps://routex-frontend.onrender.com\n\nRouteX • Getting Upington Moving`;
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f36e47]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
        {description}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  note,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  note?: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#353942] bg-[#1e2127] p-4 shadow-[0_6px_24px_rgba(17,24,39,.035)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold text-white/60">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ff754d]/10 text-[#e9623b]">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      {note && <p className="mt-2 text-[11px] text-white/40">{note}</p>}
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#353942] bg-[#1e2127] px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff754d]/10 text-[#e9623b]">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-base font-black text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">
        {description}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-white">
        {value || "—"}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [section, setSection] = useState<Section>("overview");

  const [mobileMenu, setMobileMenu] = useState(false);

  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  const [applications, setApplications] = useState<Application[]>([]);

  const [passengers, setPassengers] = useState<Passenger[]>([]);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("all");

  const [driverError, setDriverError] = useState("");
  const [resettingDriverId, setResettingDriverId] = useState<number | null>(null);
  const [resetDriverName, setResetDriverName] = useState("");
  const [resetLink, setResetLink] = useState("");

  const [adminKey, setAdminKey] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const [setupDriver, setSetupDriver] = useState("");

  const [setupLink, setSetupLink] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    setAdminKey(sessionStorage.getItem("routex_admin_key") || "");
  }, []);

  const saveAdminKey = () => {
    const key = window.prompt(
      "Enter the RouteX admin dashboard access key (configured in backend ADMIN_DASHBOARD_KEY):",
    );

    if (key === null) return;

    const trimmed = key.trim();

    if (trimmed) sessionStorage.setItem("routex_admin_key", trimmed);
    else sessionStorage.removeItem("routex_admin_key");

    setAdminKey(trimmed);
  };

  const resetDriverPassword = async (driver: Driver) => {
    if (!adminKey) {
      window.alert("Enter your administrator access key first.");
      return;
    }
    if (!window.confirm(`Generate a new password reset link for ${driver.full_name}? Any previous reset link will stop working.`)) return;

    setResettingDriverId(driver.id);
    setResetLink("");
    setResetDriverName("");
    try {
      const response = await fetch(`${API_URL}/admin/drivers/${driver.id}/reset-password`, {
        method: "POST",
        headers: { "X-RouteX-Admin-Key": adminKey },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || (response.status === 404
          ? "Reset endpoint not installed on the backend yet."
          : `Password reset failed (${response.status}).`));
      }
      if (typeof data.reset_link !== "string" || !data.reset_link) {
        throw new Error("The backend did not return a reset link.");
      }
      setResetDriverName(driver.full_name);
      setResetLink(data.reset_link);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not generate reset link.");
    } finally {
      setResettingDriverId(null);
    }
  };

  const copyResetLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      window.alert("Reset link copied. Send it privately to the verified driver.");
    } catch {
      window.alert("Unable to copy the reset link.");
    }
  };

  const loadDrivers = useCallback(async () => {
    if (!adminKey) {
      setDrivers([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/driver-directory`, {
        cache: "no-store",
        headers: { "X-RouteX-Admin-Key": adminKey },
      });

      if (!response.ok)
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Invalid admin access key"
            : `Driver directory unavailable (${response.status})`,
        );

      const data = await response.json();

      setDrivers(Array.isArray(data) ? data : []);

      setDriverError("");
    } catch (error) {
      setDriverError(
        error instanceof Error ? error.message : "Could not load drivers",
      );
    }
  }, [adminKey]);

  useEffect(() => {
    void loadDrivers();
    const timer = window.setInterval(() => void loadDrivers(), 15000);
    return () => window.clearInterval(timer);
  }, [loadDrivers]);

  const loadBookings = useCallback(async () => {
    if (!adminKey) {
      setBookings([]);
      setBookingError("");
      return;
    }
    setBookingLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/bookings`, {
        cache: "no-store",
        headers: { "X-RouteX-Admin-Key": adminKey },
      });
      if (!response.ok)
        throw new Error(
          response.status === 403
            ? "Admin access denied. Update your access key."
            : `Booking history unavailable (${response.status})`,
        );
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
      setBookingError("");
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "Could not load booking history",
      );
    } finally {
      setBookingLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (section !== "bookings" && section !== "operations") return;
    void loadBookings();
    const timer = window.setInterval(() => void loadBookings(), 15000);
    return () => window.clearInterval(timer);
  }, [loadBookings, section]);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);

    try {
      const [statsResponse, applicationsResponse, passengersResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/stats`, { cache: "no-store" }),

          fetch(`${API_URL}/admin/applications`, { cache: "no-store" }),

          fetch(`${API_URL}/admin/passengers`, { cache: "no-store" }),
        ]);

      if (
        !statsResponse.ok ||
        !applicationsResponse.ok ||
        !passengersResponse.ok
      ) {
        throw new Error("One or more dashboard requests failed.");
      }

      const [statsData, applicationData, passengerData] = await Promise.all([
        statsResponse.json(),
        applicationsResponse.json(),
        passengersResponse.json(),
      ]);

      setStats({
        passengers: Number(statsData.passengers) || 0,

        drivers: Number(statsData.drivers) || 0,

        bookings: Number(statsData.bookings) || 0,

        onlineDrivers: Number(statsData.onlineDrivers) || 0,

        pendingApplications: Number(statsData.pendingApplications) || 0,
      });

      setApplications(Array.isArray(applicationData) ? applicationData : []);

      setPassengers(Array.isArray(passengerData) ? passengerData : []);

      setLoadError("");

      setLastUpdated(new Date());
    } catch (error) {
      console.error("ADMIN DASHBOARD LOAD ERROR:", error);

      setLoadError(
        "Some dashboard information could not be refreshed. Check your connection and try again.",
      );
    } finally {
      setLoading(false);

      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();

    const interval = window.setInterval(
      () => void loadDashboardData(true),
      15000,
    );

    return () => window.clearInterval(interval);
  }, [loadDashboardData]);

  const approveDriver = async (application: Application) => {
    setProcessingId(application.id);

    try {
      const response = await fetch(
        `${API_URL}/admin/applications/${application.id}/approve`,
        { method: "POST" },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Unable to approve driver.");

      if (data.setup_link) {
        setSetupDriver(application.full_name);
        setSetupLink(data.setup_link);
      }

      await loadDashboardData(true);
    } catch (error) {
      console.error("APPROVE DRIVER ERROR:", error);

      window.alert(
        error instanceof Error ? error.message : "Unable to approve driver.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectDriver = async (application: Application) => {
    if (
      !window.confirm(`Reject ${application.full_name}'s driver application?`)
    )
      return;

    setProcessingId(application.id);

    try {
      const response = await fetch(
        `${API_URL}/admin/applications/${application.id}/reject`,
        { method: "POST" },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Unable to reject application.");

      await loadDashboardData(true);
    } catch (error) {
      console.error("REJECT DRIVER ERROR:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to reject application.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const copySetupLink = async () => {
    try {
      await navigator.clipboard.writeText(setupLink);
      window.alert("Password setup link copied.");
    } catch {
      window.alert("Unable to copy the link.");
    }
  };

  const logout = () => {
    localStorage.removeItem("admin");
    sessionStorage.removeItem("routex_admin_key");
    router.push("/");
  };

  const navigate = (next: Section) => {
    setSection(next);
    setMobileMenu(false);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const status =
          `${booking.trip_status || ""} ${booking.booking_status || ""}`.toLowerCase();
        const matchesStatus =
          bookingFilter === "all" ||
          status.split(/\s+/).includes(bookingFilter) ||
          status.includes(bookingFilter);
        const query = search.toLowerCase().trim();
        const matchesSearch =
          !query ||
          `${booking.id} ${booking.pickup_address || ""} ${booking.dropoff_address || ""} ${booking.driver_name || ""} ${booking.passenger_id || ""}`
            .toLowerCase()
            .includes(query);
        return matchesStatus && matchesSearch;
      }),
    [bookings, bookingFilter, search],
  );

  const operationCounts = useMemo(() => {
    const counts: Record<OperationGroup, number> = {
      waiting: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      other: 0,
    };
    bookings.forEach((booking) => {
      counts[operationGroup(booking)] += 1;
    });
    return counts;
  }, [bookings]);

  const attentionBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ["waiting", "assigned", "in_progress"].includes(
          operationGroup(booking),
        ),
      ),
    [bookings],
  );

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((d) =>
        `${d.full_name} ${d.vehicle_type || ""} ${d.license_plate || ""}`
          .toLowerCase()
          .includes(search.toLowerCase().trim()),
      ),
    [drivers, search],
  );

  const driverDirectory = (
    <section className="mt-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">Registered drivers</h3>
          <p className="mt-1 text-xs text-white/40">
            Names, vehicles and latest reported status
          </p>
        </div>
        <button
          type="button"
          onClick={saveAdminKey}
          className="rounded-xl border border-[#393d46] bg-[#292d35] px-4 py-2.5 text-xs font-bold text-white"
        >
          {adminKey ? "Change access key" : "Unlock driver directory"}
        </button>
      </div>
      {!adminKey ? (
        <div className="rounded-2xl bg-[#24272e] p-6 text-sm text-white/70">
          Enter the administrator access key to load driver names securely.
        </div>
      ) : driverError ? (
        <div className="rounded-2xl border border-red-800/50 bg-[#2d2225] p-5 text-sm text-red-200">
          {driverError}. Verify the backend endpoint and access key.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredDrivers.length ? (
            filteredDrivers.map((driver) => (
              <article
                key={driver.id}
                className="rounded-2xl border border-[#363941] bg-[#23262d] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{driver.full_name}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {[
                        driver.vehicle_color,
                        driver.vehicle_type,
                        driver.license_plate,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Vehicle details unavailable"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${driver.is_online && driver.status === "Available" ? "bg-emerald-500/15 text-emerald-300" : driver.is_online ? "bg-orange-500/15 text-orange-300" : "bg-[#1e2127]/10 text-white/50"}`}
                  >
                    {driver.is_online ? driver.status || "Online" : "Offline"}
                  </span>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={resettingDriverId !== null}
                    onClick={() => void resetDriverPassword(driver)}
                    className="rounded-xl border border-[#ff754d]/40 bg-[#ff754d]/10 px-4 py-2.5 text-xs font-bold text-[#ff9b7c] hover:bg-[#ff754d]/20 disabled:opacity-50"
                  >
                    {resettingDriverId === driver.id ? "Generating link..." : "Reset password"}
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-white/40">
                  Last activity:{" "}
                  {driver.last_online_at
                    ? new Date(driver.last_online_at).toLocaleString("en-ZA")
                    : "Not recorded"}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-white/50">No matching drivers found.</p>
          )}
        </div>
      )}
    </section>
  );

  const filteredPassengers = useMemo(
    () =>
      passengers.filter((p) =>
        `${p.full_name} ${p.phone}`
          .toLowerCase()
          .includes(search.toLowerCase().trim()),
      ),
    [passengers, search],
  );

  const filteredApplications = useMemo(
    () =>
      applications.filter((a) =>
        `${a.full_name} ${a.phone} ${a.vehicle_type} ${a.license_plate}`
          .toLowerCase()
          .includes(search.toLowerCase().trim()),
      ),
    [applications, search],
  );

  const applicationCards = (items: Application[]) =>
    items.length === 0 ? (
      <EmptyPanel
        icon={CheckCircle2}
        title="No pending applications"
        description="New driver applications will appear here as soon as they are submitted."
      />
    ) : (
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((application) => (
          <article
            key={application.id}
            className="overflow-hidden rounded-[22px] border border-[#353942] bg-[#1e2127] shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
              <div>
                <h3 className="text-lg font-black text-white">
                  {application.full_name}
                </h3>
                <p className="mt-1 text-xs text-white/40">
                  {application.created_at
                    ? `Applied ${new Date(application.created_at).toLocaleDateString("en-ZA")}`
                    : "Driver application"}
                </p>
              </div>
              <span className="rounded-full bg-[#ff754d]/10 px-3 py-1.5 text-[10px] font-black text-[#db5e38]">
                Pending
              </span>
            </div>

            <div className="p-5">
              {application.vehicle_image && (
                <div className="mb-5 overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={application.vehicle_image}
                    alt={`${application.full_name} vehicle`}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <Detail label="Phone" value={application.phone} />
                <Detail label="Vehicle" value={application.vehicle_type} />
                <Detail label="Colour" value={application.vehicle_color} />
                <Detail
                  label="Registration"
                  value={application.license_plate}
                />
                {application.referral_code && (
                  <Detail label="Referral" value={application.referral_code} />
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={processingId !== null}
                  onClick={() => void approveDriver(application)}
                  className="rounded-xl bg-[#1e2127] px-5 py-3 text-xs font-black text-white hover:bg-[#30343c] disabled:opacity-50"
                >
                  {processingId === application.id
                    ? "Processing..."
                    : "Approve driver"}
                </button>
                <button
                  type="button"
                  disabled={processingId !== null}
                  onClick={() => void rejectDriver(application)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-xs font-black text-white/80 hover:bg-white/10 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );

  const passengerCards = (items: Passenger[]) =>
    items.length === 0 ? (
      <EmptyPanel
        icon={Users}
        title="No passengers found"
        description="Registered passengers matching your search will appear here."
      />
    ) : (
      <div className="overflow-hidden rounded-[22px] border border-[#353942] bg-[#1e2127]">
        {items.map((passenger, index) => (
          <div
            key={passenger.id}
            className={`flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 ${index ? "border-t border-white/10" : ""}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff754d]/10 font-black text-[#e9623b]">
                {passenger.full_name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {passenger.full_name}
                </p>
                <p className="mt-1 text-xs text-white/60">{passenger.phone}</p>
              </div>
            </div>
            <a
              href={`https://wa.me/${formatWhatsAppNumber(passenger.phone)}?text=${encodeURIComponent(passengerMessage(passenger))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e2127] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#30343c]"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
          </div>
        ))}
      </div>
    );

  return (
    <main className="min-h-screen bg-[#101216] text-white">
      {mobileMenu && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-[#111319] text-white transition-transform duration-200 lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-7">
          <div>
            <p className="text-2xl font-black tracking-[-.06em]">
              Route<span className="text-[#ff754d]">X</span>
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[.22em] text-white/35">
              Control Centre
            </p>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            className="lg:hidden"
            onClick={() => setMobileMenu(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav
          aria-label="Admin navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-7"
        >
          <p className="mb-4 px-4 text-[10px] font-black uppercase tracking-[.2em] text-white/30">
            Workspace
          </p>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => navigate(id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition ${section === id ? "bg-[#ff754d] text-[#151515]" : "text-white/60 hover:bg-[#1e2127]/10 hover:text-white"}`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {id === "drivers" && stats.pendingApplications > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${section === id ? "bg-black/15" : "bg-[#ff754d] text-black"}`}
                >
                  {stats.pendingApplications}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#1e2127]/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff754d]/15 text-[#ff754d]">
              <ShieldCheck size={19} />
            </div>
            <div>
              <p className="text-xs font-black">Administrator</p>
              <p className="text-[10px] text-white/40">RouteX Upington</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-white/60 hover:bg-[#1e2127]/10 hover:text-white"
          >
            <LogOut size={17} /> Log out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#181b20]/95 px-4 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-xl border border-white/10 p-2 lg:hidden"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-xs font-black text-white">
                {NAV.find((n) => n.id === section)?.label}
              </p>
              <p className="mt-0.5 text-[10px] text-white/40">
                RouteX administration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-2 text-xs font-bold text-white/60 sm:inline-flex">
              <span
                className={`h-2 w-2 rounded-full ${stats.onlineDrivers > 0 ? "bg-emerald-500" : "bg-slate-300"}`}
              />
              {stats.onlineDrivers} drivers online
            </span>
            <button
              type="button"
              aria-label="Refresh dashboard"
              title="Refresh dashboard"
              onClick={() => {
                void loadDashboardData();
                void loadDrivers();
              }}
              disabled={refreshing}
              className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 sm:py-9">
          {loadError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              {loadError}
            </div>
          )}

          {resetLink && (
            <section className="mb-7 rounded-[22px] border border-[#ff754d]/30 bg-[#1e2127] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[#ff754d]">
                <ShieldCheck size={18} />
                <p className="text-xs font-black uppercase tracking-widest">Driver password reset</p>
              </div>
              <h3 className="mt-3 text-xl font-black">{resetDriverName}</h3>
              <p className="mt-2 text-sm text-white/65">
                This link expires after 15 minutes. Send it only to the verified driver via their registered contact number. Anyone with this link can set a new password.
              </p>
              <p className="mt-4 break-all rounded-xl bg-[#111319] p-3 text-xs text-white/80">{resetLink}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void copyResetLink()} className="inline-flex items-center gap-2 rounded-xl bg-[#ff754d] px-4 py-2.5 text-xs font-black text-black">
                  <Copy size={15} /> Copy reset link
                </button>
                <button type="button" onClick={() => { setResetLink(""); setResetDriverName(""); }} className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold">
                  Close
                </button>
              </div>
            </section>
          )}

          {setupLink && (
            <section className="mb-7 overflow-hidden rounded-[22px] bg-[#1e2127] p-5 text-white sm:p-6">
              <div className="flex items-center gap-2 text-[#ff754d]">
                <CheckCircle2 size={18} />
                <p className="text-xs font-black uppercase tracking-widest">
                  Driver approved
                </p>
              </div>
              <h3 className="mt-3 text-xl font-black">{setupDriver}</h3>
              <p className="mt-2 text-sm text-white/65">
                Send this password setup link privately to the driver. Treat it
                as sensitive and do not share it publicly.
              </p>
              <p className="mt-4 break-all rounded-xl bg-[#1e2127]/10 p-3 text-xs text-white/80">
                {setupLink}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copySetupLink()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ff754d] px-4 py-2.5 text-xs font-black text-black"
                >
                  <Copy size={15} /> Copy setup link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSetupLink("");
                    setSetupDriver("");
                  }}
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </section>
          )}

          {section === "overview" && (
            <>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <SectionHeading
                  eyebrow="RouteX / Operations"
                  title="Your business at a glance"
                  description="An overview of registered users, driver availability, bookings and applications."
                />
                <p className="flex items-center gap-1.5 text-xs text-white/40">
                  <Clock3 size={14} />
                  {lastUpdated
                    ? `Updated ${lastUpdated.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`
                    : loading
                      ? "Loading..."
                      : "Not yet updated"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                <Metric
                  label="Passengers"
                  value={stats.passengers}
                  icon={Users}
                />
                <Metric
                  label="Registered drivers"
                  value={stats.drivers}
                  icon={CarFront}
                />
                <Metric
                  label="All bookings"
                  value={stats.bookings}
                  icon={CalendarDays}
                />
                <Metric
                  label="Drivers online"
                  value={stats.onlineDrivers}
                  icon={Activity}
                />
                <Metric
                  label="Pending applications"
                  value={stats.pendingApplications}
                  icon={ClipboardList}
                />
              </div>

              <div className="mt-7 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
                <section className="rounded-[24px] bg-[#1e2127] p-6 text-white sm:p-7">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#ff754d]">
                    Operations
                  </p>
                  <h3 className="mt-3 text-2xl font-black">
                    Manage RouteX from one place.
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-white/55">
                    Review driver applications, contact passengers and monitor
                    the information currently available from your backend.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate("drivers")}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#ff754d] px-4 py-3 text-xs font-black text-white"
                    >
                      Manage drivers <ArrowRight size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("passengers")}
                      className="rounded-xl border border-white/20 px-4 py-3 text-xs font-bold"
                    >
                      View passengers
                    </button>
                  </div>
                </section>
                <section className="rounded-[24px] border border-[#353942] bg-[#1e2127] p-6">
                  <h3 className="text-lg font-black">Quick access</h3>
                  <p className="mt-1 text-xs text-white/40">
                    Jump straight to a workspace
                  </p>
                  <div className="mt-5 space-y-2">
                    {(
                      [
                        {
                          id: "drivers",
                          title: "Driver applications",
                          subtitle: `${stats.pendingApplications} pending`,
                          icon: CarFront,
                        },
                        {
                          id: "passengers",
                          title: "Passenger directory",
                          subtitle: `${stats.passengers} registered`,
                          icon: Users,
                        },
                        {
                          id: "operations",
                          title: "Live operations",
                          subtitle: "Availability overview",
                          icon: Activity,
                        },
                      ] as const
                    ).map(({ id, title, subtitle, icon: Icon }) => (
                      <button
                        type="button"
                        key={id}
                        onClick={() => navigate(id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 p-3 text-left hover:bg-white/10"
                      >
                        <span className="rounded-xl bg-[#ff754d]/10 p-2.5 text-[#e9623b]">
                          <Icon size={17} />
                        </span>
                        <span className="flex-1">
                          <span className="block text-xs font-black">
                            {title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-white/40">
                            {subtitle}
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-white/40" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {driverDirectory}

              <section className="mt-7">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black">
                    Pending driver applications
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate("drivers")}
                    className="text-xs font-bold text-[#dc633e]"
                  >
                    View all <ArrowRight size={14} className="inline" />
                  </button>
                </div>
                {applicationCards(applications.slice(0, 2))}
              </section>
            </>
          )}

          {section === "drivers" && (
            <>
              <SectionHeading
                eyebrow="Fleet management"
                title="Drivers & applications"
                description="Review new driver applications and approve or reject them. A full directory of approved drivers will require an additional backend endpoint."
              />
              <div className="mb-5 grid grid-cols-2 gap-3">
                <Metric
                  label="Registered drivers"
                  value={stats.drivers}
                  icon={CarFront}
                />
                <Metric
                  label="Pending approval"
                  value={stats.pendingApplications}
                  icon={ClipboardList}
                />
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-black">Pending applications</h3>
                <div className="relative w-full sm:w-72">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-white/40"
                  />
                  <input
                    aria-label="Search driver applications"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone or vehicle"
                    className="w-full rounded-xl border border-[#353942] bg-[#1e2127] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#ff754d]"
                  />
                </div>
              </div>
              {applicationCards(filteredApplications)}
              <div className="mt-6">{driverDirectory}</div>
            </>
          )}

          {section === "passengers" && (
            <>
              <SectionHeading
                eyebrow="Community"
                title="Passenger directory"
                description="Search registered passengers and contact them through WhatsApp using your existing welcome promotion."
              />
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-white/60">
                  {filteredPassengers.length} passengers shown
                </p>
                <div className="relative w-full sm:w-80">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-white/40"
                  />
                  <input
                    aria-label="Search passengers"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or phone"
                    className="w-full rounded-xl border border-[#353942] bg-[#1e2127] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#ff754d]"
                  />
                </div>
              </div>
              {passengerCards(filteredPassengers)}
            </>
          )}

          {section === "operations" && (
            <>
              <SectionHeading
                eyebrow="Live operations"
                title="Ride activity"
                description="Monitor recent booking statuses and driver availability. Booking records refresh every 15 seconds while this section is open."
              />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <Metric
                  label="Drivers online"
                  value={stats.onlineDrivers}
                  icon={Activity}
                />
                <Metric
                  label="Waiting"
                  value={operationCounts.waiting}
                  icon={Clock3}
                />
                <Metric
                  label="Assigned"
                  value={operationCounts.assigned}
                  icon={CarFront}
                />
                <Metric
                  label="In progress"
                  value={operationCounts.in_progress}
                  icon={ArrowRight}
                />
                <Metric
                  label="Completed"
                  value={operationCounts.completed}
                  icon={CheckCircle2}
                />
                <Metric
                  label="Cancelled / expired"
                  value={operationCounts.cancelled}
                  icon={X}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
                <span>
                  Based on {bookings.length} most recent booking records
                  (maximum 200).{" "}
                  {operationCounts.other > 0
                    ? `${operationCounts.other} record(s) have an unrecognised status.`
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={() => void loadBookings()}
                  disabled={!adminKey || bookingLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 font-bold text-white disabled:opacity-40"
                >
                  <RefreshCw
                    size={15}
                    className={bookingLoading ? "animate-spin" : ""}
                  />{" "}
                  Refresh
                </button>
              </div>
              <section className="mt-7">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black">
                      Rides needing attention
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      Waiting, assigned and in-progress bookings
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("bookings")}
                    className="text-xs font-bold text-[#ff754d]"
                  >
                    View booking history{" "}
                    <ArrowRight size={14} className="inline" />
                  </button>
                </div>
                {!adminKey ? (
                  <div className="rounded-2xl border border-[#353942] bg-[#1e2127] p-6">
                    <p className="text-sm text-white/70">
                      Enter your admin access key to load ride activity.
                    </p>
                    <button
                      type="button"
                      onClick={saveAdminKey}
                      className="mt-4 rounded-xl bg-[#ff754d] px-4 py-2.5 text-xs font-black text-black"
                    >
                      Enter admin access key
                    </button>
                  </div>
                ) : bookingError ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-800/50 bg-[#2d2225] p-5 text-sm text-red-200"
                  >
                    {bookingError}
                  </div>
                ) : bookingLoading && bookings.length === 0 ? (
                  <p className="py-8 text-sm text-white/50">
                    Loading ride activity...
                  </p>
                ) : attentionBookings.length === 0 ? (
                  <EmptyPanel
                    icon={CheckCircle2}
                    title="No active rides in recent records"
                    description="No waiting, assigned or in-progress rides were found among the booking records returned by the server."
                  />
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {attentionBookings.map((booking) => {
                      const group = operationGroup(booking);
                      const label =
                        group === "in_progress"
                          ? "In progress"
                          : group === "assigned"
                            ? "Assigned"
                            : "Waiting";
                      return (
                        <article
                          key={booking.id}
                          className="rounded-2xl border border-[#353942] bg-[#1e2127] p-5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black">
                              Booking #{booking.id}
                            </p>
                            <span className="rounded-full bg-[#ff754d]/10 px-3 py-1 text-[11px] font-bold text-[#ff9b7c]">
                              {label}
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Detail
                              label="Pickup"
                              value={booking.pickup_address}
                            />
                            <Detail
                              label="Destination"
                              value={booking.dropoff_address}
                            />
                          </div>
                          <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/60">
                            Driver:{" "}
                            <span className="font-bold text-white">
                              {booking.driver_name ||
                                (booking.assigned_driver_id
                                  ? `Driver #${booking.assigned_driver_id}`
                                  : "Not assigned")}
                            </span>
                            <span className="ml-3">
                              Passenger #{booking.passenger_id ?? "—"}
                            </span>
                          </div>
                          <p className="mt-2 text-[11px] text-white/40">
                            Booking status: {booking.booking_status || "—"} ·
                            Trip status: {booking.trip_status || "—"}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {section === "bookings" && (
            <>
              <SectionHeading
                eyebrow="Ride management"
                title="Booking history"
                description="Review RouteX ride requests, trip statuses and assigned drivers. Data refreshes every 15 seconds while this section is open."
              />
              <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                <Metric
                  label="Total bookings"
                  value={stats.bookings}
                  icon={CalendarDays}
                />
                <Metric
                  label="Records loaded"
                  value={bookings.length}
                  icon={ClipboardList}
                  note="Latest 200 records maximum"
                />
                <Metric
                  label="Matching filters"
                  value={filteredBookings.length}
                  icon={Search}
                />
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-white/40"
                  />
                  <input
                    aria-label="Search bookings"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search booking, address or driver"
                    className="w-full rounded-xl border border-[#353942] bg-[#1e2127] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#ff754d]"
                  />
                </div>
                <select
                  aria-label="Filter booking status"
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                  className="rounded-xl border border-[#353942] bg-[#1e2127] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff754d]"
                >
                  <option value="all">All statuses</option>
                  <option value="waiting">Waiting</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
                <button
                  type="button"
                  onClick={() => void loadBookings()}
                  disabled={!adminKey || bookingLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold disabled:opacity-40"
                >
                  <RefreshCw
                    size={15}
                    className={bookingLoading ? "animate-spin" : ""}
                  />{" "}
                  Refresh
                </button>
              </div>
              {!adminKey ? (
                <div className="rounded-2xl border border-[#353942] bg-[#1e2127] p-6">
                  <p className="text-sm text-white/70">
                    Unlock the admin directory to load booking history.
                  </p>
                  <button
                    type="button"
                    onClick={saveAdminKey}
                    className="mt-4 rounded-xl bg-[#ff754d] px-4 py-2.5 text-xs font-black text-black"
                  >
                    Enter admin access key
                  </button>
                </div>
              ) : bookingError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-800/50 bg-[#2d2225] p-5 text-sm text-red-200"
                >
                  {bookingError}
                </div>
              ) : bookingLoading && bookings.length === 0 ? (
                <p className="py-10 text-center text-sm text-white/50">
                  Loading bookings...
                </p>
              ) : filteredBookings.length === 0 ? (
                <EmptyPanel
                  icon={ClipboardList}
                  title="No matching bookings"
                  description="Try another search or status filter."
                />
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking) => {
                    const status =
                      booking.trip_status ||
                      booking.booking_status ||
                      "Unknown";
                    return (
                      <article
                        key={booking.id}
                        className="rounded-2xl border border-[#353942] bg-[#1e2127] p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                          <div>
                            <p className="text-sm font-black text-white">
                              Booking #{booking.id}
                            </p>
                            <p className="mt-1 text-[11px] text-white/40">
                              Passenger #{booking.passenger_id ?? "—"}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#ff754d]/10 px-3 py-1.5 text-[11px] font-bold capitalize text-[#ff9b7c]">
                            {status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <Detail
                            label="Pickup"
                            value={booking.pickup_address}
                          />
                          <Detail
                            label="Destination"
                            value={booking.dropoff_address}
                          />
                          <Detail
                            label="Assigned driver"
                            value={
                              booking.driver_name ||
                              (booking.assigned_driver_id
                                ? `Driver #${booking.assigned_driver_id}`
                                : "Not assigned")
                            }
                          />
                        </div>
                        {booking.trip_status &&
                          booking.booking_status &&
                          booking.trip_status !== booking.booking_status && (
                            <p className="mt-4 text-[11px] text-white/40">
                              Booking status:{" "}
                              {booking.booking_status.replace(/_/g, " ")} · Trip
                              status: {booking.trip_status.replace(/_/g, " ")}
                            </p>
                          )}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {section === "analytics" && (
            <>
              <SectionHeading
                eyebrow="Business intelligence"
                title="Analytics"
                description="Monitor business growth using confirmed backend data. Financial reporting will be added only when its underlying records are available."
              />
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                <Metric
                  label="Passengers"
                  value={stats.passengers}
                  icon={Users}
                />
                <Metric label="Drivers" value={stats.drivers} icon={CarFront} />
                <Metric
                  label="Total bookings"
                  value={stats.bookings}
                  icon={ChartNoAxesCombined}
                />
              </div>
              <div className="mt-6">
                <EmptyPanel
                  icon={Wallet}
                  title="Trip and revenue reports are next"
                  description="Daily bookings, completion rates, cancellations and gross fares will be calculated from actual booking records. Gross fares are not the same as RouteX revenue."
                />
              </div>
            </>
          )}

          <footer className="mt-10 border-t border-white/10 py-5 text-center text-[11px] text-white/40">
            RouteX Control Centre · Upington
          </footer>
        </div>
      </div>
    </main>
  );
}
