export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-3xl w-full text-center">

        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          RouteX
        </h1>

        <p className="text-slate-500 mb-10">
          Passenger and Driver Transport Platform
        </p>

        <div className="grid md:grid-cols-2 gap-6">

          <a
            href="/passenger-login"
            className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700">
            <h2 className="text-xl font-semibold mb-2">
              Passenger Login
            </h2>

            <p className="text-blue-100">
              Book trips and track trip status.
            </p>
          </a>

          <a
            href="/driver-login"
            className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700">

            <p className="text-green-100">
              Accept trips and manage bookings.
            </p>
          </a>

        </div>  

      </div>
    </main>
  );
}