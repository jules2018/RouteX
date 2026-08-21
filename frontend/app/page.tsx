
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

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
       <a
  href="/passenger-login"
  className="block w-full max-w-sm mx-auto bg-white text-teal-700 py-4 rounded-2xl font-semibold text-xl text-center shadow-lg hover:bg-slate-100 transition"
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
<footer className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
  <p className="font-semibold text-slate-800">
    Need Help?
  </p>

  <p className="mt-2">
    Contact RouteX Support
  </p>

  <a
    href="tel:0799132513"
    className="mt-1 inline-block font-semibold text-teal-600 hover:text-teal-700"
  >
    079 913 2513
  </a>

  <p className="mt-2 text-xs text-slate-500">
    RouteX is currently in development. We welcome your feedback and suggestions.
  </p>
</footer>
</main>
);
}