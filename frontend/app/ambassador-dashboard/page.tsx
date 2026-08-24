"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Ambassador {
  full_name?: string;
  referral_code?: string;
}

export default function AmbassadorDashboardPage() {
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [registrations, setRegistrations] = useState(0);
  const [bookings, setBookings] = useState(0);
  const [referrals, setReferrals] = useState<any[]>([]);
  const router = useRouter();
  const allowance = 750;
  const bonus = bookings * 20;
  const totalEarned = allowance + bonus;
  const conversionRate =
  registrations === 0
    ? 0
    : (
        (bookings / registrations) *
        100
      ).toFixed(1);

  useEffect(() => {
    try {
      const storedAmbassador = localStorage.getItem("ambassador");

     if (storedAmbassador) {
  const parsedAmbassador = JSON.parse(storedAmbassador);
  setAmbassador(parsedAmbassador);

  fetch(
    `https://routex-smgu.onrender.com/ambassador/${parsedAmbassador.referral_code}/stats`
  )
    .then((res) => res.json())
    .then((data) => {
     setRegistrations(
  data.registrations
);

setBookings(
  data.bookings
);
fetch(
  `https://routex-smgu.onrender.com/ambassador/${parsedAmbassador.referral_code}/referrals`
)
  .then((res) => res.json())
  .then((data) => {
    setReferrals(data);
  });
    });
}

    } catch (error) {
      console.error("Failed to load ambassador data:", error);
      localStorage.removeItem("ambassador");
    }
  }, []);

  if (!ambassador) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-4xl">
          <h1 className="text-2xl font-bold text-slate-800">
            Ambassador Dashboard
          </h1>

          <p className="text-slate-600 mt-2">
            No ambassador information found. Please log in again.
          </p>

          <a
            href="/ambassador-login"
            className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Go to Ambassador Login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="bg-white rounded-2xl shadow-sm p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800">
  🚖 RouteX Ambassador Dashboard
</h1>

<p className="text-slate-600 mt-2">
  Welcome, {ambassador?.full_name}
</p>


        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h2 className="font-semibold text-slate-700">
            Referral Code
          </h2>

          <p className="text-2xl font-bold text-green-600 mt-2">
            {ambassador.referral_code || "Not assigned"}
          </p>
        </div>
        <div className="mt-4 bg-slate-50 border rounded-xl p-4">
  <h2 className="font-semibold text-slate-700">
    Registrations
  </h2>

  <p className="text-2xl font-bold text-blue-600 mt-2">
    {registrations}
  </p>
</div>
<div className="mt-4 bg-slate-50 border rounded-xl p-4">
  <h2 className="font-semibold text-slate-700">
    Bookings
  </h2>

  <p className="text-2xl font-bold text-green-600 mt-2">
    {bookings}
  </p>
</div>
<div className="mt-4 bg-slate-50 border rounded-xl p-4">
  <h2 className="font-semibold text-slate-700">
    Conversion Rate
  </h2>

  <p className="text-2xl font-bold text-orange-600 mt-2">
    {conversionRate}%
  </p>
</div>

<div className="mt-4 bg-slate-50 border rounded-xl p-4">
  <h2 className="font-semibold text-slate-700 mb-3">
    💰 Earnings Summary
  </h2>

  <div className="space-y-2 text-slate-700">
    <p>
      <strong>Allowance:</strong> R{allowance}
    </p>

    <p>
      <strong>Bonus:</strong> R{bonus}
    </p>

    <p className="text-lg font-bold text-teal-600">
      Total: R{totalEarned}
    </p>
  </div>
</div>
<div className="mt-4 bg-slate-50 border rounded-xl p-4">
  <h2 className="font-semibold text-slate-700 mb-3">
    Recent Referrals
  </h2>

  {referrals.length === 0 ? (
    <p className="text-slate-500">
      No referrals yet.
    </p>
  ) : (
    <div className="space-y-3">
      {referrals.map((referral, index) => (
        <div
          key={index}
          className="border rounded-lg p-3 bg-white"
        >
          <p className="font-medium text-slate-800">
            {referral.full_name}
          </p>

          <p className="text-sm text-slate-600">
            {referral.phone}
          </p>
        </div>
      ))}
    </div>
  )}
</div>
<button
  onClick={() => {
    localStorage.removeItem("ambassador");
    router.push("/ambassador-login");
  }}
  className="mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
>
  Logout
</button>
      </div>
    </main>
  );
}