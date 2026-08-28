"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function TestLandingPage() {
  return (
    <main
      className={`${outfit.className} min-h-[100dvh] w-full bg-white text-[#111111]`}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5">

        {/* ================================
            HEADER
        ================================= */}
        <header className="flex items-center justify-between py-5">

          <h1 className="text-[26px] font-extrabold tracking-[-0.06em]">
            <span className="text-[#111111]">Route</span>
            <span className="text-teal-600">X</span>
          </h1>

          <a
            href="/passenger-login"
            className="
              rounded-full
              bg-[#f5f5f5]
              px-5
              py-3
              text-[14px]
              font-bold
              text-[#111111]
              transition
              hover:bg-[#eeeeee]
              active:scale-[0.97]
            "
          >
            Log in
          </a>

        </header>


        {/* ================================
            HERO
        ================================= */}
        <section className="pt-8">

          <h2
            className="
              text-[34px]
              font-extrabold
              leading-[1.05]
              tracking-[-0.055em]
            "
          >
            Getting Upington
            <br />
            Moving.
          </h2>

          <p className="mt-3 text-[15px] font-medium text-[#6b6b6b]">
            Fast. Local. Reliable.
          </p>

        </section>


        {/* ================================
            BOOK A RIDE
        ================================= */}
        
<a
  href="/passenger-login"
  className="
    flex
    w-full
    items-center
    justify-between
    rounded-[20px]
    bg-[#f5f5f5]
    px-5
    py-5
    text-left
    transition
    hover:bg-[#eeeeee]
    active:scale-[0.98]
  "
>
  <div>
    <p className="text-[18px] font-extrabold tracking-tight">
  Book a ride
</p>

<p className="mt-1 text-[13px] font-medium text-[#777777]">
  Where are you going?
</p>
  </div>

  <div
    className="
      flex
      h-10
      w-10
      items-center
      justify-center
      rounded-full
      bg-[#111111]
      text-white
    "
  >
    <svg
      width="18"
      height="18"
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

        {/* ================================
            PORTAL ACCESS
        ================================= */}
        <section className="mt-8">

          <p className="mb-4 text-[13px] font-bold text-[#777777]">
            Portal Access
          </p>

         <div className="grid grid-cols-1 gap-3">

            {/* Driver */}
            <a
              href="/driver-login"
              className="
                rounded-[18px]
                bg-[#f7f7f7]
                p-4
                text-center
                text-[14px]
                font-bold
                text-[#111111]
                transition
                hover:bg-[#eeeeee]
                active:scale-[0.98]
              "
            >
              Driver Login
            </a>

          </div>

        </section>


        {/* ================================
            BECOME A DRIVER
        ================================= */}
        <section
          className="
            mt-8
            rounded-[20px]
            bg-[#f5f5f5]
            p-6
          "
        >

          <div className="text-center">

            {/* Black Driver Icon */}
            <div
              className="
                mx-auto
                mb-4
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-white
                text-[#111111]
              "
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="7" r="4" />
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
              </svg>
            </div>

            <h2 className="text-[20px] font-extrabold tracking-tight">
              Become a Driver
            </h2>

            <p className="mt-2 text-[14px] leading-relaxed text-[#6b6b6b]">
              Drive with Route<span className="text-teal-600 font-bold">X</span>
              <br />
              Join Route<span className="text-teal-600 font-bold">X</span> and
              start earning.
            </p>

            <a
              href="/become-a-driver"
              className="
                mt-5
                inline-flex
                items-center
                justify-center
                rounded-xl
                bg-[#111111]
                px-7
                py-3
                text-[14px]
                font-bold
                text-white
                transition
                hover:bg-[#222222]
                active:scale-[0.97]
              "
            >
              Apply Now
            </a>

          </div>

        </section>


        {/* ================================
            SUPPORT
        ================================= */}
        <footer className="mt-auto pt-8 pb-5">

          <div className="border-t border-[#e5e5e5] pt-5 text-center">

            <p className="text-[12px] font-medium text-[#999999]">
              Need Help?
            </p>

            <p className="mt-1 text-[13px] font-bold text-[#333333]">
              RouteX Support
            </p>
<a
  href="https://wa.me/27799132513"
  target="_blank"
  rel="noopener noreferrer"
  className="
    mt-1
    block
    text-[12px]
    font-medium
    text-[#777777]
    transition
    hover:text-[#111111]
  "
>
  WhatsApp: 079 913 2513
</a>

          </div>

        </footer>

      </div>
    </main>
  );
}