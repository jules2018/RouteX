
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        <div className="mb-8">
          
<h1 className="font-extrabold leading-none">
  <span className="text-4xl text-white">
    Route
  </span>
  <span className="text-7xl text-cyan-300">
    X
  </span>
</h1>

<h2 className="text-2xl font-semibold text-white mt-2">
  Getting Upington Moving
</h2>

    <p className="text-base text-white/90 mt-2">
  Book local rides across Upington.
</p>
        </div>
        <a
  href="/passenger-login"
  className="w-full max-w-md mx-auto bg-white text-teal-700 py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-slate-100 transition"

>
  Book a Ride
</a>

<div className="border-t border-white/20 pt-6">
  <p className="text-white/70 text-sm mb-4">
    Already driving with RouteX?
  </p>

  <a
    href="/driver-login"
    className="text-white font-bold hover:text-teal-200 transition"
  >
    Driver Login
  </a>
</div>

</div>
</main>
);
}