"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function HomePage() {
  return (
   <main
  className={`${outfit.className} min-h-screen w-full bg-[#f0f0f0] text-[#111111]`}
>
      {/* =================================
          BACKGROUND
      ================================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="routex-glow-one absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#ff6a00]/10 blur-[90px]" />

        <div className="routex-glow-two absolute -left-32 top-[450px] h-80 w-80 rounded-full bg-[#ff6a00]/5 blur-[100px]" />

      </div>


      {/* =================================
          PAGE
      ================================= */}
      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-6">

        {/* HEADER */}
        <header className="flex items-center justify-between py-4">

          <h1 className="text-[26px] font-extrabold tracking-[-0.05em]">
            Route<span className="text-[#ff6a00]">X</span>
          </h1>

          <a
            href="/passenger-login"
            className="
              rounded-full
              border
              border-white/80
              bg-white/60
              px-4
              py-2
              text-[14px]
              font-bold
              backdrop-blur-xl
              transition
              duration-300
              hover:bg-white
              active:scale-[0.97]
            "
          >
            Log in
          </a>

        </header>


        {/* =================================
            HERO
        ================================= */}
        <section className="routex-rise pt-5">

          <span
            className="
              inline-flex
              rounded-full
              bg-[#fff3eb]/80
              px-3
              py-1.5
              text-[12px]
              font-extrabold
              uppercase
              tracking-[0.12em]
              text-[#e65f00]
              backdrop-blur-md
            "
          >
            Local rides in Upington
          </span>

          <h2
            className="
              mt-4
              text-[34px]
              font-extrabold
              leading-[1.05]
              tracking-[-0.045em]
            "
          >
            Getting Upington
            <br />
            moving.
          </h2>

          <p className="mt-3 text-[16px] font-medium leading-relaxed text-[#777777]">
            Book a trusted local driver in minutes.
          </p>

        </section>


        {/* =================================
            BOOK A RIDE
        ================================= */}
        <a
          href="/passenger-login"
          className="
            routex-rise
            routex-delay-one
            group
            mt-5
            flex
            w-full
            items-center
            justify-between
            rounded-[22px]
            border
            border-white/80
            bg-white/60
            px-4
            py-4
            shadow-[0_10px_35px_rgba(0,0,0,0.05)]
            backdrop-blur-xl
            transition-all
            duration-300
            hover:-translate-y-1
            hover:bg-white/80
            hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]
            active:scale-[0.98]
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#fff0e6]
                text-[#ff6a00]
              "
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>

            <div>
              <p className="text-[17px] font-extrabold">
                Book a ride
              </p>

              <p className="mt-0.5 text-[14px] font-medium text-[#888888]">
                Where are you going?
              </p>
            </div>

          </div>


          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-[#ff6a00]
              text-white
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </div>

        </a>


        {/* =================================
            DRIVER
        ================================= */}
        <section
          className="
            routex-rise
            routex-delay-two
            mt-5
            rounded-[22px]
            border
            border-white/80
            bg-white/55
            p-4
            shadow-[0_10px_35px_rgba(0,0,0,0.04)]
            backdrop-blur-xl
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p
                className="
                  text-[12px]
                  font-extrabold
                  uppercase
                  tracking-[0.12em]
                  text-[#ff6a00]
                "
              >
                Drive with RouteX
              </p>

              <h3 className="mt-1 text-[20px] font-extrabold">
                Earn on your schedule
              </h3>

            </div>


            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-[#fff1e8]
                text-[#ff6a00]
              "
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 17h14" />
                <path d="M6 17 4 13l2-5h12l2 5-2 4" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>

          </div>


          <div className="mt-4 grid grid-cols-2 gap-2">

            <a
              href="/become-a-driver"
              className="
                flex
                items-center
                justify-center
                rounded-[13px]
                bg-[#111111]
                py-3
                text-[14px]
                font-bold
                text-white
                transition-all
                duration-300
                hover:-translate-y-0.5
                active:scale-[0.98]
              "
            >
              Become a Driver
            </a>

            <a
              href="/driver-login"
              className="
                flex
                items-center
                justify-center
                rounded-[13px]
                border
                border-white
                bg-white/70
                py-3
                text-[14px]
                font-bold
                text-[#111111]
                backdrop-blur-xl
                transition-all
                duration-300
                hover:bg-white
                active:scale-[0.98]
              "
            >
              Driver Login
            </a>

          </div>

        </section>


        {/* =================================
            BENEFITS
        ================================= */}
        <section
          className="
            routex-rise
            routex-delay-three
            mt-8
            flex
            items-center
            justify-between
            border-y
            border-[#ededed]
            py-4
          "
        >

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />
            <span className="text-[13px] font-bold text-[#555555]">
              Quick
            </span>
          </div>

          <div className="h-4 w-px bg-[#e6e6e6]" />

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />
            <span className="text-[13px] font-bold text-[#555555]">
              Trusted
            </span>
          </div>

          <div className="h-4 w-px bg-[#e6e6e6]" />

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />
            <span className="text-[13px] font-bold text-[#555555]">
              Local
            </span>
          </div>

        </section>


        {/* =================================
            LEGAL
        ================================= */}
        <section className="routex-rise routex-delay-four mt-6">

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">

            <a
              href="/terms"
              className="text-[12px] font-semibold text-[#777777] transition hover:text-[#ff6a00]"
            >
              Terms
            </a>

            <a
              href="/privacy"
              className="text-[12px] font-semibold text-[#777777] transition hover:text-[#ff6a00]"
            >
              Privacy
            </a>

            <a
              href="/safety"
              className="text-[12px] font-semibold text-[#777777] transition hover:text-[#ff6a00]"
            >
              Safety
            </a>

            <a
              href="/terms-of-use"
              className="text-[12px] font-semibold text-[#777777] transition hover:text-[#ff6a00]"
            >
              Terms of Use
            </a>

            <a
              href="/driver-terms"
              className="text-[12px] font-semibold text-[#777777] transition hover:text-[#ff6a00]"
            >
              Driver Terms
            </a>

            <a
              href="/refund-policy"
              className="text-[12px] font-semibold text-[#777777] transition hover:text-[#ff6a00]"
            >
              Refund Policy
            </a>

            <a
              href="/referral-terms"
              className="text-[12px] font-semibold text-[#777777] transition hover:text-[#ff6a00]"
            >
              Referral Terms
            </a>

          </div>

        </section>


        {/* =================================
            SUPPORT
        ================================= */}
        <footer className="routex-rise routex-delay-five pt-5 pb-4 text-center">

          <a
            href="https://wa.me/27799132513"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-semibold text-[#888888] transition hover:text-[#ff6a00]"
          >
            Need help? WhatsApp RouteX Support
          </a>

          <p className="mt-3 text-[11px] font-medium text-[#aaaaaa]">
            RouteX • Getting Upington Moving
          </p>

        </footer>

      </div>


          </main>
  );
}