"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function TestLandingPage() {
  return (
    <main
      className={`${outfit.className} min-h-screen w-full bg-white text-[#111111]`}
    >
      <div className="mx-auto w-full max-w-md px-5 pb-4">

        {/* =================================
            HEADER
        ================================= */}
        <header className="flex items-center justify-between py-4">

          <h1 className="text-[24px] font-extrabold tracking-[-0.05em]">
            Route<span className="text-[#ff6a00]">X</span>
          </h1>

          <a
            href="/passenger-login"
            className="
              rounded-full
              border border-[#e9e9e9]
              bg-white
              px-4
              py-2
              text-[12px]
              font-bold
              text-[#111111]
              transition
              active:scale-[0.97]
            "
          >
            Log in
          </a>

        </header>


        {/* =================================
            HERO
        ================================= */}
        <section className="pt-5">

          <span
            className="
              inline-flex
              rounded-full
              bg-[#fff3eb]
              px-3
              py-1.5
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.12em]
              text-[#e65f00]
            "
          >
            Local rides in Upington
          </span>

          <h2
            className="
              mt-4
              text-[30px]
              font-extrabold
              leading-[1.05]
              tracking-[-0.045em]
            "
          >
            Getting Upington
            <br />
            moving.
          </h2>

          <p
            className="
              mt-2
              text-[13px]
              font-medium
              leading-relaxed
              text-[#777777]
            "
          >
            Book a trusted local driver in minutes.
          </p>

        </section>


        {/* =================================
            BOOK A RIDE
        ================================= */}
        <a
          href="/passenger-login"
          className="
            mt-5
            flex
            w-full
            items-center
            justify-between
            rounded-[18px]
            border
            border-[#ededed]
            bg-[#fafafa]
            px-4
            py-4
            transition
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

              <p className="text-[15px] font-extrabold">
                Book a ride
              </p>

              <p className="mt-0.5 text-[11px] font-medium text-[#888888]">
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
            BENEFITS
        ================================= */}
        <section
          className="
            mt-5
            flex
            items-center
            justify-between
            border-y
            border-[#f0f0f0]
            py-4
          "
        >

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />

            <span className="text-[11px] font-bold text-[#555555]">
              Quick
            </span>
          </div>


          <div className="h-4 w-px bg-[#e6e6e6]" />


          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />

            <span className="text-[11px] font-bold text-[#555555]">
              Trusted
            </span>
          </div>


          <div className="h-4 w-px bg-[#e6e6e6]" />


          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />

            <span className="text-[11px] font-bold text-[#555555]">
              Local
            </span>
          </div>

        </section>


        {/* =================================
            DRIVER SECTION
        ================================= */}
        <section className="mt-5">

          <div className="flex items-center justify-between">

            <div>

              <p
                className="
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.12em]
                  text-[#ff6a00]
                "
              >
                Drive with RouteX
              </p>

              <h3 className="mt-1 text-[17px] font-extrabold">
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
                text-[11px]
                font-bold
                text-white
                transition
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
                border-[#e4e4e4]
                bg-white
                py-3
                text-[11px]
                font-bold
                text-[#111111]
                transition
                active:scale-[0.98]
              "
            >
              Driver Login
            </a>

          </div>

        </section>


        {/* =================================
            SUPPORT
        ================================= */}
        <footer className="pt-6 text-center">

          <a
            href="https://wa.me/27799132513"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-semibold text-[#999999]"
          >
            Need help? WhatsApp RouteX Support
          </a>

        </footer>

      </div>
    </main>
  );
}