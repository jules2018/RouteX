export default function Home() {
  return (
  <main className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-xl p-12 max-w-4xl w-full text-center border border-slate-200">

        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          RouteX
        </h1>

        <p className="text-slate-500 mb-10">
          On-Demand Transport Platform
        </p>
<p className="text-slate-500 max-w-2xl mx-auto mb-10">

Book trips, accept rides, track journeys and manage

transport operations in real time.

</p>
        <div className="grid md:grid-cols-2 gap-6">

          <a href="/passenger-login"
  className="bg-cyan-600 text-white p-8 rounded-2xl hover:bg-slate-700 hover:bg-slate-800 transition shadow-md">
  <p>
    Book trips and track trip status.
  </p>
</a>

          <a href="/driver-login"
  className="bg-emerald-600 text-white p-8 rounded-2xl hover:bg-teal-600 hover:bg-teal-700 transition shadow-md">
    <p>
    Accept trips and manage bookings.
  </p>
</a>
        </div>
      </div>
    </main> 
  );

}