"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function PassengerTermsPage() {
  return (
    <main
      className={`${outfit.className} min-h-screen bg-white text-[#111111]`}
    >
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
            href="/passenger-register"
            className="
              rounded-full
              border border-[#e8e8e8]
              px-4
              py-2
              text-[14px]
              font-bold
            "
          >
            Back
          </a>
        </header>

        {/* TITLE */}
        <section className="border-b border-[#eeeeee] pb-6 pt-4">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#ff6a00]">
            Legal
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.04em]">
            Passenger Terms
            <br />
            & Conditions
          </h1>

          <p className="mt-3 text-[14px] font-medium text-[#777777]">
            Effective 14 September 2026
          </p>
        </section>

        {/* CONTENT */}
        <div className="space-y-8 pt-7 text-[16px] leading-[1.7] text-[#555555]">

          <LegalSection title="1. About RouteX">
            <p>
              RouteX is a technology-enabled local ride-booking platform
              intended to connect passengers with participating independent
              drivers.
            </p>

            <p>
              Unless RouteX expressly states otherwise in writing, RouteX
              does not itself operate the driver's vehicle or employ the
              driver.
            </p>

            <p>
              By creating a passenger account, requesting a ride, or using
              RouteX, you agree to these Passenger Terms & Conditions,
              together with the RouteX Terms of Use and Privacy Policy.
            </p>
          </LegalSection>

          <LegalSection title="2. Passenger accounts">
            <p>
              You must provide accurate registration and contact information
              and keep that information reasonably up to date.
            </p>

            <p>
              You are responsible for activity performed through your account
              and for keeping your login credentials secure.
            </p>
          </LegalSection>

          <LegalSection title="3. Ride requests">
            <p>
              A ride request is a request to be connected with an available
              RouteX driver.
            </p>

            <p>
              Submitting a request does not guarantee that a driver will be
              available, accept the request, arrive at a particular time, or
              complete the trip.
            </p>

            <p>
              Pickup times and trip duration may be affected by traffic,
              weather, road conditions, driver availability, vehicle issues,
              and other circumstances outside RouteX's reasonable control.
            </p>
          </LegalSection>

          <LegalSection title="4. Fares and payment">
            <p>
              The fare or fare basis displayed or communicated before booking
              should be reviewed before confirming your ride.
            </p>

            <p>
              A fare may change where the passenger changes the trip, adds
              stops, causes material waiting time, or another disclosed
              pricing condition applies.
            </p>

            <p>
              Promotional credits, referral rewards and discounts may be
              subject to separate eligibility requirements, limits and expiry
              dates.
            </p>
          </LegalSection>

          <LegalSection title="5. Cancellations and no-shows">
            <p>
              Passengers should cancel a ride as soon as reasonably possible
              if it is no longer required.
            </p>

            <p>
              RouteX may introduce reasonable cancellation or no-show charges
              where those charges are clearly disclosed before they apply and
              are permitted by applicable law.
            </p>

            <p>
              Drivers may cancel or refuse a trip for lawful safety reasons,
              vehicle problems, abusive conduct, materially incorrect trip
              information, or other reasonable grounds.
            </p>
          </LegalSection>

          <LegalSection title="6. Passenger conduct">
            <p>When using RouteX, passengers must:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Treat drivers and other passengers respectfully.</li>

              <li>
                Not threaten, harass, discriminate against, assault or
                intimidate another person.
              </li>

              <li>
                Not damage, soil or unlawfully interfere with a driver's
                vehicle.
              </li>

              <li>
                Not ask a driver to speed, drive dangerously, overload the
                vehicle or break the law.
              </li>

              <li>
                Wear a seat belt where required and follow reasonable safety
                instructions.
              </li>

              <li>
                Not use RouteX for unlawful activities, prohibited goods,
                fraud or criminal activity.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="7. Drivers">
            <p>
              Drivers using RouteX are responsible for the lawful operation
              of their vehicles, their driving conduct, and maintaining the
              licences, permits, roadworthiness, insurance and other legal
              requirements applicable to them.
            </p>

            <p>
              RouteX may perform driver onboarding or verification steps, but
              no verification process can eliminate all risk.
            </p>

            <p>
              Passengers should exercise ordinary personal-safety judgment
              when using transportation services.
            </p>
          </LegalSection>

          <LegalSection title="8. Safety and emergencies">
            <p>
              Passenger and driver safety is important to RouteX. Passengers
              should immediately report serious safety concerns or incidents.
            </p>

            <p>
              In an emergency, contact the appropriate emergency service or
              law-enforcement authority rather than relying on the RouteX
              platform.
            </p>

            <a
              href="/safety"
              className="inline-block font-bold text-[#ff6a00]"
            >
              Read RouteX Safety Guidelines →
            </a>
          </LegalSection>

          <LegalSection title="9. Complaints and lost property">
            <p>
              Passengers should report service complaints, safety incidents,
              suspected fraud or lost property to RouteX as soon as reasonably
              possible.
            </p>

            <p>
              RouteX may request booking details and other information
              reasonably necessary to investigate the matter.
            </p>
          </LegalSection>

          <LegalSection title="10. Account suspension">
            <p>
              RouteX may restrict or suspend an account where reasonably
              necessary to protect passenger or driver safety, prevent fraud,
              investigate serious misconduct, comply with law, or enforce
              these terms.
            </p>

            <p>
              Where appropriate, RouteX may provide the passenger with an
              opportunity to explain or challenge the action.
            </p>
          </LegalSection>

          <LegalSection title="11. Liability and consumer rights">
            <p>
              Nothing in these terms is intended to exclude or limit any
              consumer right or remedy that cannot lawfully be excluded under
              South African law.
            </p>

            <p>
              To the extent permitted by law, RouteX is not responsible for
              losses caused solely by an independent driver's unlawful or
              negligent conduct, third-party services, network outages,
              inaccurate information supplied by users, or events outside
              RouteX's reasonable control.
            </p>
          </LegalSection>

          <LegalSection title="12. Privacy">
            <p>
              RouteX processes passenger personal information in accordance
              with its Privacy Policy and applicable South African data
              protection requirements.
            </p>

            <a
              href="/privacy"
              className="inline-block font-bold text-[#ff6a00]"
            >
              Read the RouteX Privacy Policy →
            </a>
          </LegalSection>

          <LegalSection title="13. Governing law">
            <p>
              These terms are governed by the laws of the Republic of South
              Africa.
            </p>

            <p>
              Nothing in these terms prevents a passenger from approaching a
              competent regulator, tribunal or court where applicable.
            </p>
          </LegalSection>

          <LegalSection title="14. Contact RouteX">
            <p>
              Questions, complaints or concerns about these terms can be
              directed to RouteX Support.
            </p>

            <a
              href="https://wa.me/27799132513"
              target="_blank"
              rel="noopener noreferrer"
              className="
                mt-2
                inline-flex
                rounded-full
                bg-[#111111]
                px-5
                py-3
                text-[14px]
                font-bold
                text-white
              "
            >
              WhatsApp RouteX Support
            </a>
          </LegalSection>

        </div>

        {/* OTHER POLICIES */}
        <section className="mt-10 border-t border-[#eeeeee] pt-6">

          <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#999999]">
            RouteX Legal
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-[14px] font-bold">
            <a href="/privacy" className="hover:text-[#ff6a00]">
              Privacy
            </a>

            <a href="/terms-of-use" className="hover:text-[#ff6a00]">
              Terms of Use
            </a>

            <a href="/refund-policy" className="hover:text-[#ff6a00]">
              Refund Policy
            </a>

            <a href="/safety" className="hover:text-[#ff6a00]">
              Safety
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


/* =========================================
   LEGAL SECTION COMPONENT
========================================= */

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