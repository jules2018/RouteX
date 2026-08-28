"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Car,
  UserRound,
  MapPin,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export default function TestPage() {
  return (
    <main
      className={`${jakarta.variable} min-h-screen bg-white text-[#111111]`}
      style={{ fontFamily: "var(--font-jakarta)" }}
    >
      <div className="max-w-md mx-auto min-h-screen px-5">

        {/* Header */}
        <header className="flex items-center justify-between py-5">

          <h1 className="text-[24px] font-bold tracking-[-0.06em]">
            Route<span className="text-teal-600">X</span>
          </h1>

          <button
            className="
              bg-[#f5f5f5]
              hover:bg-[#eeeeee]
              px-5
              py-3
              rounded-full
              text-[14px]
              font-bold
              transition
            "
          >
            Log in
          </button>

        </header>

        {/* Hero */}
        <section className="pt-8">

          <h2
            className="
              text-[32px]
              leading-[1.08]
              font-extrabold
              tracking-[-0.055em]
            "
          >
            Where are you
            <br />
            going?
          </h2>

          <p className="text-[14px] text-[#6b6b6b] mt-3 font-medium">
            Get there with Route
            <span className="text-teal-600 font-bold">X</span>.
          </p>

        </section>

        {/* Booking */}
        <section className="mt-7">

          <div className="bg-[#f5f5f5] rounded-[22px] p-4">

            {/* Pickup */}
            <div className="flex items-center gap-4">

              <div className="w-[10px] h-[10px] rounded-full bg-[#00A86B] hover:bg-[#008f5a] shrink-0" />

              <input
                type="text"
                placeholder="Pickup location"
                className="
                  w-full
                  bg-transparent
                  outline-none
                  text-[14px]
                  font-semibold
                  text-[#111111]
                  placeholder:text-[#777777]
                "
              />

            </div>

            {/* Connector */}
            <div className="ml-[4px] h-4 border-l border-[#cfcfcf] my-1.5" />

            {/* Destination */}
            <div className="flex items-center gap-4">

              <div className="w-[10px] h-[10px] rounded-full bg-[#555555] shrink-0" />

              <input
                type="text"
                placeholder="Where are you going?"
                className="
                  w-full
                  bg-transparent
                  outline-none
                  text-[14px]
                  font-semibold
                  text-[#111111]
                  placeholder:text-[#777777]
                "
              />

            </div>

            {/* Button */}
            <button
              className="
                w-full
                mt-5
                bg-[#111111]
                hover:bg-[#222222]
                text-white
                py-3.5
                rounded-xl
                text-[14px]
                font-bold
                transition
              "
            >
              See prices
            </button>
<p className="text-center text-xs text-[#777777] mt-3">
  Popular routes from R50
</p>
          </div>

        </section>

        {/* Quick Options */}
        <section className="mt-8">

          <h3
            className="
              text-[19px]
              font-extrabold
              tracking-[-0.035em]
            "
          >
            Quick options
          </h3>

          <div className="grid grid-cols-2 gap-3 mt-4">

            {/* Book a ride */}
            <button
              className="
                bg-[#f7f7f7]
                hover:bg-[#f1f1f1]
                rounded-[18px]
                p-4
                text-left
                transition
              "
            >

              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mb-4">
                <Car
                  size={20}
                  strokeWidth={2.3}
                  className="text-black"
                />
              </div>

              <p className="text-[14px] font-extrabold">
                Book a ride
              </p>

              <p className="text-[11px] text-[#777777] mt-1">
                Get picked up
              </p>

            </button>

            {/* Become a driver */}
            <button
              className="
                bg-[#f7f7f7]
                hover:bg-[#f1f1f1]
                rounded-[18px]
                p-4
                text-left
                transition
              "
            >

              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mb-4">
                <UserRound
                  size={20}
                  strokeWidth={2.3}
                  className="text-black"
                />
              </div>

              <p className="text-[14px] font-extrabold">
                Become a driver
              </p>

              <p className="text-[11px] text-[#777777] mt-1">
                Earn with RouteX
              </p>

            </button>

          </div>

        </section>

        {/* Popular */}
        <section className="mt-8 pb-8">

          <h3
            className="
              text-[19px]
              font-extrabold
              tracking-[-0.035em]
            "
          >
            Popular in Upington
          </h3>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">

            {[
              "Upington CBD",
              "Keidebees",
              "Blydeville",
              "Flora Park",
            ].map((place) => (
              <button
                key={place}
                className="
                  shrink-0
                  bg-white
                  border
                  border-[#dedede]
                  px-4
                  py-2.5
                  rounded-full
                  text-[11px]
                  font-bold
                  text-[#333333]
                  hover:bg-[#f7f7f7]
                  transition
                  flex
                  items-center
                  gap-2
                "
              >
                <MapPin
                  size={14}
                  strokeWidth={2.5}
                  className="text-black"
                />

                {place}
              </button>
            ))}

          </div>

        </section>

      </div>
    </main>
  );
}