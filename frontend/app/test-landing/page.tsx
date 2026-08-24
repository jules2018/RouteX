"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function TestLandingPage() {
  return (
    <main
      className={`${outfit.className} relative min-h-[100dvh] w-full overflow-x-hidden text-white`}
    >
      {/* ================================
          BACKGROUND
      ================================= */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/city-bg.jpg')",
        }}
      />

      {/* Dark Overlay */}
      <div className="fixed inset-0 z-0 bg-black/50" />

      {/* ================================
          PAGE CONTENT
      ================================= */}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 py-6">

        {/* ================================
            HERO
        ================================= */}
        <section className="pt-2 text-center">
          <h1 className="text-6xl font-extrabold tracking-tight drop-shadow-lg">
            <span className="text-white">Route</span>
            <span className="text-teal-400">X</span>
          </h1>

          <p className="mt-1 text-lg font-medium text-white/90">
            Getting Upington Moving
          </p>

          <p className="mt-3 text-base text-white/80">
            Fast. Local. Reliable.
          </p>
        </section>

       {/* ================================
    BOOK A RIDE
================================= */}
<section className="mt-8">
  <a
    href="/passenger-login"
    className="block w-full rounded-2xl border border-white/30 bg-white/10 py-5 text-center text-lg font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98]"
  >
    Book a Ride
  </a>
</section>

        {/* ================================
            DRIVER / AMBASSADOR
        ================================= */}
        <section className="mt-8">
          <p className="mb-4 text-center text-sm font-medium text-white/70">
            Portal Access
          </p>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="/driver-login"
              className="rounded-xl border border-white/20 bg-white/10 p-4 text-center font-semibold backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98]"
            >
              Driver Login
            </a>

            <a
              href="/ambassador-login"
              className="rounded-xl border border-white/20 bg-white/10 p-4 text-center font-semibold backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98]"
            >
              Ambassador Login
            </a>
          </div>
        </section>

        {/* ================================
            BECOME A DRIVER
        ================================= */}
        <section className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md">
          <div className="text-center">
            <h2 className="text-xl font-bold">
              Become a Driver
            </h2>

            <p className="mt-2 text-base leading-relaxed text-white/80">
             Drive with RouteX
              <br />
              Join RouteX and start earning.
            </p>

            <a
              href="/become-a-driver"
              className="mt-4 inline-block rounded-xl bg-white px-6 py-3 font-bold text-teal-700 shadow-md transition hover:bg-slate-100 active:scale-[0.98]"
            >
              Apply Now
            </a>
          </div>
        </section>

        {/* ================================
            SUPPORT
        ================================= */}
        <footer className="mt-auto pt-8 text-center">
          <div className="border-t border-white/20 pt-5">
            <p className="text-sm text-white/60">
              Need Help?
            </p>

            <p className="mt-1 font-semibold text-white">
              RouteX Support
            </p>

            <a
              href="https://wa.me/27799132513"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm text-white/80 transition hover:text-white"
            >
              WhatsApp: 079 913 2513
            </a>
          </div>
        </footer>

      </div>
    </main>
  );
}