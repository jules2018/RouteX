export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white">
            RouteX
          </h1>

          <h2 className="text-lg text-white/90 mt-3">
            Getting Upington Moving
          </h2>

          <p className="text-sm text-white/70 mt-2">
            Book local rides across Upington.
          </p>
        </div>

        {/* Passenger */}
        <a
          href="/passenger-login"
          className="block w-full max-w-sm mx-auto bg-white text-teal-700 py-4 rounded-2xl font-semibold text-xl text-center shadow-lg hover:bg-slate-100 transition"
        >
          Book a Ride
        </a>

        {/* Driver / Ambassador */}
<div className="border-t border-white/20 pt-6 mt-6">
  <p className="text-white/70 text-sm mb-4">
    Driver or Ambassador?
  </p>

  <div className="space-y-3">
    <a
      href="/driver-login"
      className="block text-white font-bold hover:underline transition"
    >
      Driver Login
    </a>

    <a
      href="/ambassador-login"
      className="block text-white font-bold hover:underline transition"
    >
      Ambassador Login
    </a>
    <a
  href="/become-a-driver"
  className="block text-white font-bold hover:underline transition"
></a>
  </div>
</div>

{/* Become a Driver */}
<div className="mt-6 border-t border-white/20 pt-6">
  <h3 className="text-white font-bold text-lg">
    Earn with RouteX
  </h3>

  <p className="text-white/80 text-sm mt-2">
    Have a reliable vehicle? Join RouteX and start earning by providing rides
    across Upington and surrounding areas.
  </p>

  <a
    href="/become-a-driver"
    className="mt-4 inline-block bg-white text-teal-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition"
  >
    Become a Driver
  </a>
</div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/20 text-center">
          <h3 className="text-slate-200 text-sm">
            Need Help?
          </h3>

          <p className="text-slate-200 mt-2">
            RouteX Support
          </p>

          <p className="text-slate-200 text-sm">
            💬 WhatsApp: 079 913 2513
          </p>

          <p className="text-slate-400 text-xs mt-3">
            RouteX is currently in development.
            <br />
            We welcome feedback, bug reports and suggestions.
          </p>
        </footer>

      </div>
    </main>
  );
}