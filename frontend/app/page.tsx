export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-2xl font-bold text-white">
            RX
          </div>

          <h1 className="mb-3 text-4xl font-bold text-slate-800">
            RouteX
          </h1>

          <p className="mb-3 text-slate-600">Your Ride Starts Here</p>

          <p className="mb-8 text-sm text-slate-500">
            Book rides, track your journey and travel with confidence.
          </p>

          <a
            href="/passenger-login"
            className="my-6 block w-full rounded-xl bg-teal-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-teal-700"
          >
            Passenger Login
          </a>

          <p className="mb-2 text-sm font-semibold text-slate-700">Driver Access</p>

          <p className="mb-4 text-sm text-slate-500">
            Manage bookings, trips and passengers.
          </p>

          <a
            href="/driver-login"
            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Driver Login
          </a>
        </div>
      </div>
    </main>
  );
}