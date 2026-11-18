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
  | "deliveries"
  | "drivers"
  | "passengers"
  | "analytics"
  | "monthly";

type PackageDelivery = {
  id: number;
  passenger_id: number;
  passenger_name: string | null;
  passenger_phone: string | null;
  driver_id: number | null;
  driver_name: string | null;
  delivery_type: string;
  pickup_address: string;
  dropoff_address: string;
  parcel_description: string | null;
  parcel_size: string | null;
  scheduled_pickup_at: string | null;
  fare_amount: number | string;
  status: string;
  created_at: string;
  accepted_at: string | null;
  collected_at: string | null;
  delivered_at: string | null;
};
type MonthlyInterest = {
  id: number;
  transport_type: string;
  pickup_area: string;
  destination: string;
  departure_time: string;
  return_time: string | null;
  needs_return: boolean;
  operating_days: number[];
  passenger_count: number;
  whatsapp_number: string;
  preferred_start_date: string | null;
  created_at?: string | null;
};

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

function whatsappUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const normalized = digits.startsWith("00")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? `27${digits.slice(1)}`
      : digits.length === 9
        ? `27${digits}`
        : digits;

  if (normalized.length < 10 || normalized.length > 15) return null;
  return `https://wa.me/${normalized}`;
}
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
  { id: "deliveries", label: "Package Deliveries", icon: ClipboardList },

  { id: "drivers", label: "Drivers", icon: CarFront },

  { id: "passengers", label: "Passengers", icon: Users },

  { id: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { id: "monthly", label: "Monthly Transport", icon: ClipboardList },
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
  return `Hi ${passenger.full_name},\n\nAs one of our first RouteX members, you've received R20 OFF your first ride.\n\nUse promo code:\nWELCOME20\n\nEnter the code when booking your trip.\n\nBook here:\nhttps://routex-frontend.onrender.com\n\nRouteX Ã¢â‚¬Â¢ Getting Upington Moving`;
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
      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#0d9488]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#173d73] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
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
    <div className="rounded-[18px] border border-[#dbe6f2] bg-white p-4 text-slate-800 shadow-[5px_5px_14px_#d5deea,-5px_-5px_14px_#ffffff]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e4f4f5] text-[#0d9488]">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[#173d73]">
        {value}
      </p>
      {note && <p className="mt-2 text-[11px] text-slate-400">{note}</p>}
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
        {value || "Ã¢â‚¬â€"}
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
  const [packageDeliveries, setPackageDeliveries] = useState<PackageDelivery[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "active" | "completed">("all");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  const [driverError, setDriverError] = useState("");
  const [resettingDriverId, setResettingDriverId] = useState<number | null>(null);
  const [resetDriverName, setResetDriverName] = useState("");
  const [resetLink, setResetLink] = useState("");

  const [monthlyInterests, setMonthlyInterests] = useState<MonthlyInterest[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState("");

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
    if (section !== "bookings" && section !== "operations" && section !== "overview") return;
    void loadBookings();
    const timer = window.setInterval(() => void loadBookings(), 15000);
    return () => window.clearInterval(timer);
  }, [loadBookings, section]);

  const loadPackageDeliveries = useCallback(async () => {
    if (!adminKey) {
      setPackageDeliveries([]);
      setDeliveryError("");
      return;
    }
    setDeliveryLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/package-deliveries`, {
        cache: "no-store",
        headers: { "X-RouteX-Admin-Key": adminKey },
      });
      if (!response.ok) {
        throw new Error(response.status === 403
          ? "Admin access denied. Update your access key."
          : `Package deliveries unavailable (${response.status})`);
      }
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Unexpected delivery response");
      setPackageDeliveries(data as PackageDelivery[]);
      setDeliveryError("");
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : "Unable to load deliveries");
    } finally {
      setDeliveryLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (section !== "deliveries" && section !== "overview") return;
    void loadPackageDeliveries();
    const timer = window.setInterval(() => void loadPackageDeliveries(), 15000);
    return () => window.clearInterval(timer);
  }, [loadPackageDeliveries, section]);
  const loadMonthlyInterests = useCallback(async () => {
    if (!adminKey) {
      setMonthlyInterests([]);
      setMonthlyError("");
      return;
    }
    setMonthlyLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/monthly-transport/interests`, {
        cache: "no-store",
        headers: { "X-RouteX-Admin-Key": adminKey },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Unable to load requests (${response.status})`);
      if (!Array.isArray(data)) throw new Error("Unexpected monthly transport response");
      setMonthlyInterests(data);
      setMonthlyError("");
    } catch (error) {
      setMonthlyError(error instanceof Error ? error.message : "Unable to load monthly transport requests");
    } finally {
      setMonthlyLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (section === "monthly") void loadMonthlyInterests();
  }, [section, loadMonthlyInterests]);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!adminKey) return;
    if (!silent) setRefreshing(true);

    try {
      const [statsResponse, applicationsResponse, passengersResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/stats`, { cache: "no-store", headers: { "X-RouteX-Admin-Key": adminKey } }),

          fetch(`${API_URL}/admin/applications`, { cache: "no-store", headers: { "X-RouteX-Admin-Key": adminKey } }),

          fetch(`${API_URL}/admin/passengers`, { cache: "no-store", headers: { "X-RouteX-Admin-Key": adminKey } }),
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
  }, [adminKey]);

  useEffect(() => {
    if (!adminKey) {
      setStats(EMPTY_STATS);
      setApplications([]);
      setPassengers([]);
      setLoading(false);
      return;
    }
    void loadDashboardData();

    const interval = window.setInterval(
      () => void loadDashboardData(true),
      15000,
    );

    return () => window.clearInterval(interval);
  }, [loadDashboardData, adminKey]);

  const approveDriver = async (application: Application) => {
    if (!adminKey) { window.alert("Enter the administrator access key first."); return; }
    setProcessingId(application.id);

    try {
      const response = await fetch(
        `${API_URL}/admin/applications/${application.id}/approve`,
        { method: "POST", headers: { "X-RouteX-Admin-Key": adminKey } },
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
    if (!adminKey) { window.alert("Enter the administrator access key first."); return; }
    if (
      !window.confirm(`Reject ${application.full_name}'s driver application?`)
    )
      return;

    setProcessingId(application.id);

    try {
      const response = await fetch(
        `${API_URL}/admin/applications/${application.id}/reject`,
        { method: "POST", headers: { "X-RouteX-Admin-Key": adminKey } },
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

  const newOverviewBookings = useMemo(
    () => bookings.filter((booking) => operationGroup(booking) === "waiting"),
    [bookings],
  );

  const newOverviewDeliveries = useMemo(
    () => packageDeliveries.filter(
      (delivery) =>
        delivery.status.toLowerCase() === "pending" &&
        delivery.driver_id === null,
    ),
    [packageDeliveries],
  );

  const passengerById = useMemo(
    () => new Map(passengers.map((passenger) => [passenger.id, passenger])),
    [passengers],
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
                        .join(" Ã‚Â· ") || "Vehicle details unavailable"}
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
    <main className="min-h-screen bg-[#edf3fa] text-slate-800">
      {mobileMenu && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[244px] flex-col bg-gradient-to-b from-[#102e56] via-[#153f70] to-[#0c3457] text-white transition-transform duration-200 lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}
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
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition ${section === id ? "bg-white/15 text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
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

      <div className="min-h-screen lg:pl-[244px]">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#d9e5f2] bg-white/95 px-4 py-4 text-[#173d73] shadow-sm backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-xl border border-[#d9e5f2] p-2 lg:hidden"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-xs font-black text-[#173d73]">
                {NAV.find((n) => n.id === section)?.label}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                RouteX administration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-2 text-xs font-bold text-slate-600 sm:inline-flex">
              <span
                className={`h-2 w-2 rounded-full ${stats.onlineDrivers > 0 ? "bg-emerald-500" : "bg-slate-300"}`}
              />
              {stats.onlineDrivers} drivers online
            </span>
            <button type="button" onClick={saveAdminKey} className="rounded-xl border border-[#d9e5f2] px-3 py-2 text-xs font-bold text-[#173d73]">{adminKey ? "Change admin key" : "Unlock admin"}</button>
            <button
              type="button"
              aria-label="Refresh dashboard"
              title="Refresh dashboard"
              onClick={() => {
                void loadDashboardData();
                void loadDrivers();
              }}
              disabled={refreshing}
              className="rounded-xl border border-[#d9e5f2] p-2.5 text-slate-600 hover:bg-blue-50 disabled:opacity-50"
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
                <Metric label="Total deliveries" value={packageDeliveries.length} icon={ClipboardList} />
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <section className="rounded-[20px] border border-[#dbe6f2] bg-white p-5 text-slate-800 shadow-[6px_6px_18px_#d5deea,-6px_-6px_18px_#ffffff]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[#173d73]">New passenger bookings</h3>
                      <p className="mt-1 text-[11px] text-slate-500">Waiting for a driver</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{newOverviewBookings.length} new</span>
                  </div>
                  <div className="max-h-[520px] space-y-3 overflow-y-auto">
                    {newOverviewBookings.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">No new bookings waiting.</p>
                    ) : (
                      newOverviewBookings.map((booking) => {
                        const passenger = booking.passenger_id === null ? undefined : passengerById.get(booking.passenger_id);
                        const contact = passenger?.phone ? whatsappUrl(passenger.phone) : null;
                        return (
                          <article key={booking.id} className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-800">{passenger?.full_name || `Passenger #${booking.passenger_id ?? "unknown"}`}</p>
                                <p className="mt-1 text-[11px] text-slate-500">Booking #{booking.id}</p>
                              </div>
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">Waiting</span>
                            </div>
                            <p className="text-[11px] text-slate-600"><span className="font-semibold">From:</span> {booking.pickup_address || "Not provided"}</p>
                            <p className="mt-1.5 text-[11px] text-slate-600"><span className="font-semibold">To:</span> {booking.dropoff_address || "Not provided"}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {contact ? (
                                <a href={contact} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#e5f7f2] px-3 py-2 text-[11px] font-semibold text-[#087e68]">
                                  <MessageCircle size={14} /> WhatsApp passenger
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400">No WhatsApp number available</span>
                              )}
                              <button type="button" onClick={() => navigate("bookings")} className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700">View booking</button>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>

                <section className="rounded-[20px] border border-[#dbe6f2] bg-white p-5 text-slate-800 shadow-[6px_6px_18px_#d5deea,-6px_-6px_18px_#ffffff]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[#173d73]">New package deliveries</h3>
                      <p className="mt-1 text-[11px] text-slate-500">Pending driver acceptance</p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{newOverviewDeliveries.length} new</span>
                  </div>
                  <div className="max-h-[520px] space-y-3 overflow-y-auto">
                    {newOverviewDeliveries.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">No new delivery requests.</p>
                    ) : (
                      newOverviewDeliveries.map((delivery) => {
                        const passenger = passengerById.get(delivery.passenger_id);
                        const contact = passenger?.phone ? whatsappUrl(passenger.phone) : null;
                        return (
                          <article key={delivery.id} className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-800">{passenger?.full_name || `Passenger #${delivery.passenger_id}`}</p>
                                <p className="mt-1 text-[11px] text-slate-500">Delivery #{delivery.id} Â· {delivery.delivery_type}</p>
                              </div>
                              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-medium text-teal-700">Pending</span>
                            </div>
                            <p className="text-[11px] text-slate-600"><span className="font-semibold">From:</span> {delivery.pickup_address}</p>
                            <p className="mt-1.5 text-[11px] text-slate-600"><span className="font-semibold">To:</span> {delivery.dropoff_address}</p>
                            <p className="mt-2 text-xs font-semibold text-[#173d73]">R{Number(delivery.fare_amount).toFixed(2)}</p>
                            <p className="mt-1 text-[10px] text-slate-400">Requested {new Date(delivery.created_at).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "short", timeStyle: "short" })}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {contact ? (
                                <a href={contact} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#e5f7f2] px-3 py-2 text-[11px] font-semibold text-[#087e68]">
                                  <MessageCircle size={14} /> WhatsApp sender
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400">No WhatsApp number available</span>
                              )}
                              <button type="button" onClick={() => navigate("deliveries")} className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700">View delivery</button>
                            </div>
                          </article>
                        );
                      })
                    )}
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
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Today's completed deliveries</h3>
                    <p className="mt-1 text-xs text-slate-500">Completed today · South Africa time</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {packageDeliveries.filter((d) => {
                      if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return false;
                      const localDate = (date: Date) =>
                        new Intl.DateTimeFormat("en-CA", {
                          timeZone: "Africa/Johannesburg",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        }).format(date);
                      return localDate(new Date(d.delivered_at)) === localDate(new Date());
                    }).length} completed
                  </span>
                </div>
                <div className="space-y-2">
                  {packageDeliveries.filter((d) => {
                    if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return false;
                    const localDate = (date: Date) =>
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Africa/Johannesburg",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }).format(date);
                    return localDate(new Date(d.delivered_at)) === localDate(new Date());
                  }).map((delivery) => (
                    <div key={delivery.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-5 sm:items-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Delivery #{delivery.id}</p>
                        <p className="text-xs text-emerald-700">Delivered</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Passenger</p>
                        <p className="text-xs text-slate-700">{delivery.passenger_name || `#${delivery.passenger_id}`}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Driver</p>
                        <p className="text-xs text-slate-700">{delivery.driver_name || "Unassigned"}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-800">R{Number(delivery.fare_amount).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleTimeString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </p>
                    </div>
                  ))}
                  {packageDeliveries.every((d) => {
                    if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return true;
                    const localDate = (date: Date) =>
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Africa/Johannesburg",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }).format(date);
                    return localDate(new Date(d.delivered_at)) !== localDate(new Date());
                  }) && (
                    <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                      No completed deliveries today.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {section === "deliveries" && (
            <section>
              <SectionHeading
                eyebrow="Delivery management"
                title="Package Deliveries"
                description="Review package delivery requests, assigned drivers and delivery progress. Refreshes every 15 seconds."
              />
              <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                
                <Metric label="Active deliveries" value={packageDeliveries.filter((d) => !["delivered", "completed", "cancelled", "canceled"].includes(d.status.toLowerCase())).length} icon={Activity} />
                <Metric label="Completed" value={packageDeliveries.filter((d) => ["delivered", "completed"].includes(d.status.toLowerCase())).length} icon={CheckCircle2} />
              </div>
              {!adminKey ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-900/70">
                  Enter your admin access key to view package deliveries.
                </div>
              ) : deliveryError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200" role="alert">{deliveryError}</div>
              ) : deliveryLoading && packageDeliveries.length === 0 ? (
                <p className="py-8 text-sm text-slate-500">Loading package deliveries...</p>
              ) : packageDeliveries.length === 0 ? (
                <EmptyPanel icon={ClipboardList} title="No package deliveries yet" description="New package delivery requests will appear here." />
              ) : (
                <div>
                <div className="mb-4 flex flex-wrap gap-2">
  {(["all", "active", "completed"] as const).map((filter) => (
    <button
      key={filter}
      type="button"
      onClick={() => setDeliveryFilter(filter)}
      className={`rounded-xl border px-4 py-2 text-xs font-bold capitalize transition ${
        deliveryFilter === filter
          ? "border-teal-600 bg-teal-600 text-slate-900"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {filter}
    </button>
  ))}
</div>
                <div className="space-y-3">
                  {packageDeliveries.filter((delivery) => deliveryFilter === "all" || (deliveryFilter === "completed" ? ["delivered", "completed"].includes(delivery.status.toLowerCase()) : !["delivered", "completed", "cancelled", "canceled"].includes(delivery.status.toLowerCase()))).map((delivery) => (
                    <article key={delivery.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold tracking-tight text-slate-800">Delivery #{delivery.id}</p>
                          <p className="mt-1 text-xs text-slate-500">{delivery.delivery_type === "scheduled" ? "Scheduled" : "Now"} {" | "} {delivery.parcel_size || "Parcel"}</p>
                        </div>
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium capitalize text-teal-700">{delivery.status.replace(/_/g, " ")}</span>
                      </div>
                      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        <div><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Pickup</p><p className="mt-1 break-words text-sm font-normal leading-relaxed text-slate-700">{delivery.pickup_address}</p></div>
                        <div><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Destination</p><p className="mt-1 break-words text-sm font-normal leading-relaxed text-slate-700">{delivery.dropoff_address}</p></div>
                        <div><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Fare</p><p className="mt-1 break-words text-sm font-normal leading-relaxed text-slate-700">{`R${Number(delivery.fare_amount).toFixed(2)}`}</p></div>
                        <div><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Assigned driver</p><p className="mt-1 break-words text-sm font-normal leading-relaxed text-slate-700">{delivery.driver_name || (delivery.driver_id ? `Driver #${delivery.driver_id}` : "Unassigned")}</p></div>
                        <div><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Scheduled pickup</p><p className="mt-1 break-words text-sm font-normal leading-relaxed text-slate-700">{delivery.scheduled_pickup_at ? new Date(delivery.scheduled_pickup_at).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" }) : "Not scheduled"}</p></div>
                        <div><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Requested</p><p className="mt-1 break-words text-sm font-normal leading-relaxed text-slate-700">{new Date(delivery.created_at).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" })}</p></div>
                        <div><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Parcel description</p><p className="mt-1 break-words text-sm font-normal leading-relaxed text-slate-700">{delivery.parcel_description}</p></div>
                        <div>
  <p className="text-xs text-slate-500">Passenger</p>
  <p className="mt-1 text-sm font-medium text-slate-700">
    {delivery.passenger_name || `Passenger #${delivery.passenger_id}`}
  </p>
  {delivery.passenger_phone && (
    <a
      href={`https://wa.me/${delivery.passenger_phone.replace(/\D/g, "").replace(/^0/, "").replace(/^(?!27)/, "27")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
    >
      WhatsApp passenger
    </a>
  )}
</div>
                      </div>
                    </article>
                  ))}
                </div>
                </div>
              )}
            </section>
          )}
          {section === "monthly" && (
            <section>
              <SectionHeading
                eyebrow="Route planning"
                title="Monthly Transport Interests"
                description="Passenger enquiries for future work and school transport routes. These are expressions of interest, not confirmed bookings."
              />
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Metric label="Requests received" value={monthlyInterests.length} icon={ClipboardList} />
                <button type="button" onClick={() => void loadMonthlyInterests()}
                  disabled={!adminKey || monthlyLoading}
                  className="rounded-xl border border-white/20 px-4 py-3 text-xs font-bold disabled:opacity-50">
                  {monthlyLoading ? "Loading..." : "Refresh requests"}
                </button>
              </div>
              {!adminKey ? (
                <p className="rounded-2xl bg-[#1e2127] p-5 text-sm">Enter your admin access key to view requests.</p>
              ) : monthlyError ? (
                <p role="alert" className="rounded-2xl border border-red-800 bg-[#2d2225] p-5 text-sm text-red-200">{monthlyError}</p>
              ) : monthlyLoading && monthlyInterests.length === 0 ? (
                <p className="text-sm text-white/60">Loading monthly requests...</p>
              ) : monthlyInterests.length === 0 ? (
                <EmptyPanel icon={ClipboardList} title="No requests returned" description="No monthly transport interest submissions were returned by the backend." />
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {monthlyInterests.map((item) => (
                    <article key={item.id} className="rounded-[22px] border border-[#353942] bg-[#1e2127] p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-black text-white">Request #{item.id}</h3>
                        <span className="rounded-full bg-[#ff754d]/10 px-3 py-1 text-xs font-bold capitalize text-[#ff9b7c]">{item.transport_type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Detail label="Pickup area" value={item.pickup_area} />
                        <Detail label="Destination" value={item.destination} />
                        <Detail label="Departure" value={item.departure_time} />
                        <Detail label="Return" value={item.needs_return ? item.return_time : "One way"} />
                        <Detail label="Days" value={(item.operating_days || []).map((day) => ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day] || String(day)).join(", ")} />
                        <Detail label="Passengers" value={String(item.passenger_count)} />
                        <Detail label="Preferred start" value={item.preferred_start_date?.slice(0, 10)} />
                        <Detail label="Submitted" value={item.created_at ? new Date(item.created_at).toLocaleDateString("en-ZA") : "Not recorded"} />
                      </div>
                      <a href={`https://wa.me/${formatWhatsAppNumber(item.whatsapp_number)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ff754d] px-4 py-3 text-xs font-black text-black">
                        <MessageCircle size={15} /> Contact on WhatsApp
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </section>
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
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Today's completed deliveries</h3>
                    <p className="mt-1 text-xs text-slate-500">Completed today · South Africa time</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {packageDeliveries.filter((d) => {
                      if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return false;
                      const localDate = (date: Date) =>
                        new Intl.DateTimeFormat("en-CA", {
                          timeZone: "Africa/Johannesburg",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        }).format(date);
                      return localDate(new Date(d.delivered_at)) === localDate(new Date());
                    }).length} completed
                  </span>
                </div>
                <div className="space-y-2">
                  {packageDeliveries.filter((d) => {
                    if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return false;
                    const localDate = (date: Date) =>
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Africa/Johannesburg",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }).format(date);
                    return localDate(new Date(d.delivered_at)) === localDate(new Date());
                  }).map((delivery) => (
                    <div key={delivery.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-5 sm:items-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Delivery #{delivery.id}</p>
                        <p className="text-xs text-emerald-700">Delivered</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Passenger</p>
                        <p className="text-xs text-slate-700">{delivery.passenger_name || `#${delivery.passenger_id}`}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Driver</p>
                        <p className="text-xs text-slate-700">{delivery.driver_name || "Unassigned"}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-800">R{Number(delivery.fare_amount).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleTimeString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </p>
                    </div>
                  ))}
                  {packageDeliveries.every((d) => {
                    if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return true;
                    const localDate = (date: Date) =>
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Africa/Johannesburg",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }).format(date);
                    return localDate(new Date(d.delivered_at)) !== localDate(new Date());
                  }) && (
                    <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                      No completed deliveries today.
                    </p>
                  )}
                </div>
              </section>
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
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Today's completed deliveries</h3>
                    <p className="mt-1 text-xs text-slate-500">Completed today · South Africa time</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {packageDeliveries.filter((d) => {
                      if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return false;
                      const localDate = (date: Date) =>
                        new Intl.DateTimeFormat("en-CA", {
                          timeZone: "Africa/Johannesburg",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        }).format(date);
                      return localDate(new Date(d.delivered_at)) === localDate(new Date());
                    }).length} completed
                  </span>
                </div>
                <div className="space-y-2">
                  {packageDeliveries.filter((d) => {
                    if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return false;
                    const localDate = (date: Date) =>
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Africa/Johannesburg",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }).format(date);
                    return localDate(new Date(d.delivered_at)) === localDate(new Date());
                  }).map((delivery) => (
                    <div key={delivery.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-5 sm:items-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Delivery #{delivery.id}</p>
                        <p className="text-xs text-emerald-700">Delivered</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Passenger</p>
                        <p className="text-xs text-slate-700">{delivery.passenger_name || `#${delivery.passenger_id}`}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Driver</p>
                        <p className="text-xs text-slate-700">{delivery.driver_name || "Unassigned"}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-800">R{Number(delivery.fare_amount).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleTimeString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </p>
                    </div>
                  ))}
                  {packageDeliveries.every((d) => {
                    if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return true;
                    const localDate = (date: Date) =>
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Africa/Johannesburg",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }).format(date);
                    return localDate(new Date(d.delivered_at)) !== localDate(new Date());
                  }) && (
                    <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                      No completed deliveries today.
                    </p>
                  )}
                </div>
              </section>
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
                              Passenger #{booking.passenger_id ?? "Ã¢â‚¬â€"}
                            </span>
                          </div>
                          <p className="mt-2 text-[11px] text-white/40">
                            Booking status: {booking.booking_status || "Ã¢â‚¬â€"} Ã‚Â·
                            Trip status: {booking.trip_status || "Ã¢â‚¬â€"}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Today's completed deliveries</h3>
                    <p className="mt-1 text-xs text-slate-500">Completed today · South Africa time</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {packageDeliveries.filter((d) => {
                      if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return false;
                      const localDate = (date: Date) =>
                        new Intl.DateTimeFormat("en-CA", {
                          timeZone: "Africa/Johannesburg",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        }).format(date);
                      return localDate(new Date(d.delivered_at)) === localDate(new Date());
                    }).length} completed
                  </span>
                </div>
                <div className="space-y-2">
                  {packageDeliveries.filter((d) => {
                    if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return false;
                    const localDate = (date: Date) =>
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Africa/Johannesburg",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }).format(date);
                    return localDate(new Date(d.delivered_at)) === localDate(new Date());
                  }).map((delivery) => (
                    <div key={delivery.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-5 sm:items-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Delivery #{delivery.id}</p>
                        <p className="text-xs text-emerald-700">Delivered</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Passenger</p>
                        <p className="text-xs text-slate-700">{delivery.passenger_name || `#${delivery.passenger_id}`}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Driver</p>
                        <p className="text-xs text-slate-700">{delivery.driver_name || "Unassigned"}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-800">R{Number(delivery.fare_amount).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleTimeString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </p>
                    </div>
                  ))}
                  {packageDeliveries.every((d) => {
                    if (!["delivered", "completed"].includes(d.status.toLowerCase()) || !d.delivered_at) return true;
                    const localDate = (date: Date) =>
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Africa/Johannesburg",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }).format(date);
                    return localDate(new Date(d.delivered_at)) !== localDate(new Date());
                  }) && (
                    <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                      No completed deliveries today.
                    </p>
                  )}
                </div>
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
                              Passenger #{booking.passenger_id ?? "Ã¢â‚¬â€"}
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
                              {booking.booking_status.replace(/_/g, " ")} Ã‚Â· Trip
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
            RouteX Control Centre Ã‚Â· Upington
          </footer>
        </div>
      </div>
    </main>
  );
}
