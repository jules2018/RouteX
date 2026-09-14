"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function SafetyPage() {
  return (
    <main className={`${outfit.className} min-h-screen bg-white text-[#111111]`}>
      <div className="mx-auto w-full max-w-md px-5 pb-12">

        {/* HEADER */}
        <header className="flex items-center justify-between py-5">
          <a
            href="/"
            className="text-[26px] font-extrabold tracking-[-0.05em]"
          >
            Route<span className="text-[#ff6a00]">X</span>
          </a>

          <a
            href="/"
            className="rounded-full border border-[#e8e8e8] px-4 py-2 text-[14px] font-bold"
          >
            Back
          </a>
        </header>

        {/* TITLE */}
        <section className="border-b border-[#eeeeee] pb-6 pt-4">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#ff6a00]">
            Ride safely
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.04em]">
            RouteX Safety
          </h1>

          <p className="mt-3 text-[16px] leading-relaxed text-[#666666]">
            Guidelines for safer trips for passengers and drivers.
          </p>
        </section>

        {/* EMERGENCY */}
        <section className="mt-6 rounded-[20px] bg-[#111111] p-5 text-white">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#ff6a00]">
            Emergency
          </p>

          <h2 className="mt-2 text-[20px] font-extrabold">
            If you are in immediate danger
          </h2>

          <p className="mt-2 text-[14px] leading-relaxed text-[#dddddd]">
            Contact the appropriate emergency service or law-enforcement
            authority immediately. RouteX Support is not an emergency-response
            service.
          </p>
        </section>

        {/* CONTENT */}
        <div className="space-y-8 pt-8 text-[16px] leading-[1.7] text-[#555555]">

          <LegalSection title="1. Before your trip">
            <p>
              Passengers should check the available driver and vehicle
              information before entering the vehicle.
            </p>

            <p>
              If the driver, vehicle or booking information does not reasonably
              match the information provided through RouteX, do not proceed
              with the trip until the situation has been clarified.
            </p>
          </LegalSection>

          <LegalSection title="2. Passenger safety">
            <p>Passengers should:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Use the correct pickup and destination information.</li>

              <li>
                Confirm that they are entering the vehicle associated with
                their booking.
              </li>

              <li>
                Wear a seat belt where available and legally required.
              </li>

              <li>
                Avoid distracting the driver while the vehicle is moving.
              </li>

              <li>
                Never ask a driver to speed, drive dangerously or break road
                laws.
              </li>

              <li>
                Treat the driver, vehicle and other passengers respectfully.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Driver safety">
            <p>Drivers should:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                Only drive when legally licensed and medically fit to do so.
              </li>

              <li>
                Keep the vehicle reasonably safe, maintained and roadworthy.
              </li>

              <li>
                Never drive while impaired by alcohol, drugs, extreme fatigue
                or another unsafe condition.
              </li>

              <li>
                Follow applicable traffic laws and speed limits.
              </li>

              <li>
                Avoid unlawful or dangerous mobile-phone use while driving.
              </li>

              <li>
                Confirm the passenger and trip information before beginning
                the ride.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Respect and personal safety">
            <p>
              RouteX does not tolerate violence, threats, harassment,
              intimidation, sexual misconduct or unlawful discrimination
              between platform users.
            </p>

            <p>
              Passengers and drivers should respect personal boundaries and
              avoid behaviour that could reasonably make another person feel
              threatened or unsafe.
            </p>
          </LegalSection>

          <LegalSection title="5. Alcohol and drugs">
            <p>
              Drivers must not operate a vehicle while impaired by alcohol,
              illegal drugs, medication or another substance that makes
              driving unsafe or unlawful.
            </p>

            <p>
              Passengers may not pressure a driver to continue a trip where
              doing so would be unsafe or unlawful.
            </p>
          </LegalSection>

          <LegalSection title="6. Vehicle condition">
            <p>
              Drivers are responsible for ensuring that vehicles used for
              RouteX trips comply with applicable legal and roadworthiness
              requirements.
            </p>

            <p>
              A vehicle should not be used for passenger transport where a
              defect makes the vehicle unsafe.
            </p>
          </LegalSection>

          <LegalSection title="7. Seat belts and passenger capacity">
            <p>
              Drivers must not carry more passengers than the vehicle can
              lawfully and safely accommodate.
            </p>

            <p>
              Passengers should use available seat belts in accordance with
              applicable law.
            </p>
          </LegalSection>

          <LegalSection title="8. Unsafe situations">
            <p>
              A passenger or driver may decide not to begin or continue a trip
              where there is a genuine and reasonable safety concern.
            </p>

            <p>
              Where possible, move to a safe public location and contact the
              appropriate emergency service if immediate assistance is
              required.
            </p>
          </LegalSection>

          <LegalSection title="9. Accidents">
            <p>
              If a RouteX trip is involved in a road accident, the immediate
              priority should be personal safety and obtaining emergency
              assistance where necessary.
            </p>

            <p>
              Drivers should comply with applicable legal requirements for
              reporting road accidents and exchanging information.
            </p>

            <p>
              The incident should also be reported to RouteX as soon as
              reasonably possible.
            </p>
          </LegalSection>

          <LegalSection title="10. Reporting a safety concern">
            <p>
              Serious safety concerns should be reported to RouteX as soon as
              reasonably possible after immediate danger has been addressed.
            </p>

            <p>
              RouteX may request information such as the booking number,
              passenger or driver details, date and time, and a description of
              what happened.
            </p>

            <p>
              RouteX may restrict an account while a serious safety complaint
              is being investigated.
            </p>
          </LegalSection>

          <LegalSection title="11. Personal information">
            <p>
              Passenger and driver contact information obtained through a
              RouteX booking should only be used for legitimate booking,
              safety and support purposes.
            </p>

            <p>
              Users should not publish another person's private information or
              use booking information for harassment or unwanted contact.
            </p>

            <a
              href="/privacy"
              className="inline-block font-bold text-[#ff6a00]"
            >
              Read the RouteX Privacy Policy →
            </a>
          </LegalSection>

          <LegalSection title="12. Lost property">
            <p>
              If property is left in a vehicle, contact RouteX Support as soon
              as reasonably possible.
            </p>

            <p>
              RouteX may assist the passenger and driver in communicating
              about the item but cannot guarantee that lost property will be
              recovered.
            </p>
          </LegalSection>

          <LegalSection title="13. RouteX verification">
            <p>
              RouteX may request driver identity, licence, vehicle and other
              documentation as part of driver onboarding or ongoing platform
              access.
            </p>

            <p>
              Verification and safety measures can reduce certain risks but
              cannot eliminate all risks associated with transportation or
              interactions between individuals.
            </p>
          </LegalSection>

          <LegalSection title="14. RouteX Support">
            <p>
              For non-emergency safety concerns, booking problems or incident
              reports, contact RouteX Support.
            </p>

            <a
              href="https://wa.me/27799132513"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex rounded-full bg-[#111111] px-5 py-3 text-[14px] font-bold text-white"
            >
              WhatsApp RouteX Support
            </a>

            <p className="text-[13px] text-[#888888]">
              RouteX Support is not a replacement for police, ambulance, fire
              or other emergency services.
            </p>
          </LegalSection>

        </div>

        {/* LEGAL LINKS */}
        <section className="mt-10 border-t border-[#eeeeee] pt-6">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#999999]">
            RouteX Legal
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-[14px] font-bold">
            <a href="/terms" className="hover:text-[#ff6a00]">
              Passenger Terms
            </a>

            <a href="/privacy" className="hover:text-[#ff6a00]">
              Privacy
            </a>

            <a href="/terms-of-use" className="hover:text-[#ff6a00]">
              Terms of Use
            </a>

            <a href="/refund-policy" className="hover:text-[#ff6a00]">
              Refund Policy
            </a>

            <a href="/referral-terms" className="hover:text-[#ff6a00]">
              Referral Terms
            </a>
          </div>
        </section>

        <footer className="pt-10 text-center">
          <p className="text-[12px] font-medium text-[#999999]">
            RouteX • Getting Upington Moving
          </p>
        </footer>

      </div>
    </main>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-[19px] font-extrabold tracking-[-0.025em] text-[#111111]">
        {title}
      </h2>

      <div className="space-y-3">
        {children}
      </div>
    </section>
  );
}