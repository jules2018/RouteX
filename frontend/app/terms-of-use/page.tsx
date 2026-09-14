"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function TermsOfUsePage() {
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
            href="/"
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
            Terms of Use
          </h1>

          <p className="mt-3 text-[14px] font-medium text-[#777777]">
            Effective 14 September 2026
          </p>
        </section>

        {/* CONTENT */}
        <div className="space-y-8 pt-7 text-[16px] leading-[1.7] text-[#555555]">

          <LegalSection title="1. Acceptance of these terms">
            <p>
              These Terms of Use apply when you access or use the RouteX
              website, mobile web application, passenger services, driver
              services or other RouteX platform features.
            </p>

            <p>
              By accessing or using RouteX, you agree to these Terms of Use
              and any additional terms that apply to the particular RouteX
              service you use.
            </p>

            <p>
              Passengers are also subject to the Passenger Terms &
              Conditions. Drivers are subject to the Driver Terms and
              Independent Contractor Agreement.
            </p>
          </LegalSection>

          <LegalSection title="2. About RouteX">
            <p>
              RouteX provides technology that helps connect passengers
              seeking transportation with participating independent drivers.
            </p>

            <p>
              Unless expressly stated otherwise, RouteX does not itself
              operate the driver's vehicle and does not guarantee that a
              driver will be available for every booking request.
            </p>
          </LegalSection>

          <LegalSection title="3. Eligibility">
            <p>
              You may only use RouteX where you are legally permitted to do
              so and must provide accurate information when creating an
              account or using the platform.
            </p>

            <p>
              You may not impersonate another person, create fraudulent
              accounts or use another person's account without permission.
            </p>
          </LegalSection>

          <LegalSection title="4. Account security">
            <p>
              You are responsible for keeping your login details and account
              credentials secure.
            </p>

            <p>
              You should notify RouteX promptly if you believe your account
              has been accessed or used without authorisation.
            </p>
          </LegalSection>

          <LegalSection title="5. Acceptable use">
            <p>You may not use RouteX to:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Commit or facilitate unlawful activity.</li>

              <li>
                Harass, threaten, discriminate against or harm another person.
              </li>

              <li>
                Provide false, misleading or fraudulent information.
              </li>

              <li>
                Interfere with the security or operation of the RouteX
                platform.
              </li>

              <li>
                Attempt to gain unauthorised access to RouteX systems,
                accounts or data.
              </li>

              <li>
                Introduce malicious software or intentionally damage the
                platform.
              </li>

              <li>
                Scrape, copy or misuse RouteX information in a manner that
                violates applicable law or RouteX's rights.
              </li>

              <li>
                Use RouteX to transport or facilitate unlawful goods or
                activities.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Ride-booking services">
            <p>
              RouteX may allow passengers to submit ride requests and
              participating drivers to accept those requests.
            </p>

            <p>
              Availability depends on participating drivers and other
              circumstances. RouteX does not guarantee acceptance of a ride
              request, pickup time or continuous service availability.
            </p>
          </LegalSection>

          <LegalSection title="7. Prices, promotions and rewards">
            <p>
              Prices, fares, discounts, referral rewards and promotional
              offers may be subject to conditions displayed or communicated
              through RouteX.
            </p>

            <p>
              RouteX may correct genuine pricing or technical errors where
              permitted by law.
            </p>

            <p>
              Promotions may have eligibility requirements, usage limits and
              expiry dates.
            </p>
          </LegalSection>

          <LegalSection title="8. Third-party services">
            <p>
              RouteX may depend on third-party technology or services,
              including hosting, messaging, communications, payment,
              navigation or other infrastructure.
            </p>

            <p>
              Those services may be governed by their own terms and privacy
              policies.
            </p>
          </LegalSection>

          <LegalSection title="9. Intellectual property">
            <p>
              The RouteX name, branding, platform design, software, original
              content and other RouteX materials may be protected by
              intellectual-property laws.
            </p>

            <p>
              You may not reproduce, distribute, sell or commercially exploit
              protected RouteX materials without permission except where
              permitted by law.
            </p>
          </LegalSection>

          <LegalSection title="10. Electronic communications">
            <p>
              By using RouteX, you acknowledge that certain communications
              and agreements may take place electronically.
            </p>

            <p>
              Electronic notices, confirmations and records may be used where
              permitted under South African law, including applicable
              electronic-transactions legislation.
            </p>
          </LegalSection>

          <LegalSection title="11. Platform availability">
            <p>
              RouteX aims to provide a reliable service but cannot guarantee
              that the platform will always be available or free from
              interruptions, delays or technical errors.
            </p>

            <p>
              RouteX may perform maintenance, update features, correct
              technical problems or temporarily restrict access where
              reasonably necessary.
            </p>
          </LegalSection>

          <LegalSection title="12. Suspension or termination">
            <p>
              RouteX may restrict or suspend access where reasonably
              necessary because of suspected fraud, serious misconduct,
              safety concerns, unlawful use, security threats or material
              breaches of applicable RouteX terms.
            </p>

            <p>
              Where appropriate, RouteX may investigate the circumstances
              before taking permanent action.
            </p>
          </LegalSection>

          <LegalSection title="13. Consumer rights">
            <p>
              Nothing in these Terms of Use is intended to remove or limit
              rights that cannot lawfully be excluded under the Consumer
              Protection Act or other applicable South African legislation.
            </p>
          </LegalSection>

          <LegalSection title="14. Limitation of liability">
            <p>
              To the extent permitted by law, RouteX is not responsible for
              loss resulting solely from circumstances outside its reasonable
              control, third-party service failures, inaccurate information
              supplied by users, or unlawful or negligent conduct of an
              independent platform participant.
            </p>

            <p>
              Nothing in these terms excludes liability where exclusion is
              prohibited by applicable law.
            </p>
          </LegalSection>

          <LegalSection title="15. Privacy">
            <p>
              Personal information collected through RouteX is handled in
              accordance with the RouteX Privacy Policy and applicable South
              African privacy law.
            </p>

            <a
              href="/privacy"
              className="inline-block font-bold text-[#ff6a00]"
            >
              Read the Privacy Policy →
            </a>
          </LegalSection>

          <LegalSection title="16. Changes to these terms">
            <p>
              RouteX may update these Terms of Use when the service, business
              operations or legal requirements change.
            </p>

            <p>
              The current version will show its effective date. Where a
              material change requires additional notice or consent, RouteX
              will take reasonable steps to provide it.
            </p>
          </LegalSection>

          <LegalSection title="17. Governing law">
            <p>
              These Terms of Use are governed by the laws of the Republic of
              South Africa.
            </p>

            <p>
              Nothing in these terms prevents a person from approaching a
              competent regulator, tribunal or court where legally entitled
              to do so.
            </p>
          </LegalSection>

          <LegalSection title="18. Contact RouteX">
            <p>
              For questions or concerns regarding the RouteX platform,
              contact RouteX Support.
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