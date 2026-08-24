"use client";

import { useEffect, useState } from "react";

interface Ambassador {
  full_name?: string;
  referral_code?: string;
}

export default function AmbassadorDashboardPage() {
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [registrations, setRegistrations] = useState(0);

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
          Welcome, {ambassador.full_name || "Ambassador"}
        </h1>

        <p className="text-slate-600 mt-2">
          RouteX Ambassador Dashboard
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
      </div>
    </main>
  );
}