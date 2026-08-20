
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        <div className="mb-8">
          

          <img
  src="/routex-logo.png"
  alt="RouteX"
  className="mx-auto w-56"
/>

<h2 className="text-3xl font-bold text-white">
  Getting Upington Moving
</h2>

         <p className="text-white/90">
  Book a ride with local drivers in minutes.
</p>
        </div>
        <a
  href="/passenger-login"
  className="block w-full bg-white text-teal-700 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-100 transition mb-6"
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