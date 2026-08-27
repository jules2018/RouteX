import { Car, User } from "lucide-react";
export default function Home() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 max-w-3xl w-full text-center">

       <div className="mb-10">
  <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
    ROUTEX
  </h1>

  <p className="text-sm text-slate-500 mt-1">
    Getting Upington Moving
  </p>
</div>

        <div className="grid md:grid-cols-2 gap-6">

 <a
  href="/passenger-login"
  className="bg-white border border-gray-200 p-8 rounded-3xl hover:shadow-lg transition-all duration-300 mb-2"
>
  <h2 className="text-xl font-bold text-gray-900">
    Passenger
  </h2>

  <p className="text-gray-500 mt-2">
    Book rides and track your journey.
  </p>
</a>

       <a
  href="/driver-login"
  className="bg-white border border-gray-200 p-8 rounded-3xl hover:shadow-lg transition-all duration-200"
>
  <h2 className="text-xl font-bold text-gray-900">
    Driver
  </h2>

  <p className="text-gray-500 mt-2">
    Accept rides and manage your trips.
  </p>
</a>  

        </div>  

      </div>
    </main>
  );
}