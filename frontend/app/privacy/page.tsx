"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function PrivacyPage() {
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
            Privacy
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.04em]">
            Privacy Policy
          </h1>

          <p className="mt-3 text-[14px] font-medium text-[#777777]">
            Protection of Personal Information Act (POPIA)
          </p>

          <p className="mt-1 text-[14px] font-medium text-[#999999]">
            Effective 14 September 2026
          </p>
        </section>

        {/* CONTENT */}
        <div className="space-y-8 pt-7 text-[16px] leading-[1.7] text-[#555555]">

          <LegalSection title="1. About this Privacy Policy">
            <p>
              RouteX respects your privacy and is committed to handling
              personal information responsibly and in accordance with the
              Protection of Personal Information Act 4 of 2013 (POPIA).
            </p>

            <p>
              This Privacy Policy explains what personal information RouteX
              may collect, why it is collected, how it may be used or shared,
              and the rights available to you.
            </p>
          </LegalSection>

          <LegalSection title="2. Who is responsible for your information">
            <p>
              For purposes of POPIA, RouteX acts as the responsible party for
              personal information processed through the RouteX platform,
              unless another arrangement applies in a particular situation.
            </p>

            <p>
              RouteX's legal operator details and Information Officer contact
              information should be published here once finalised.
            </p>
          </LegalSection>

          <LegalSection title="3. Information RouteX may collect">
            <p>
              Depending on how you use RouteX, we may collect information such
              as:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                Your name, mobile number, email address and account details.
              </li>

              <li>
                Passenger booking information such as pickup address,
                destination, travel date, fare and booking history.
              </li>

              <li>
                Driver information including identity details, contact
                details, vehicle information and driver documents.
              </li>

              <li>
                Profile photographs and other information you choose to upload.
              </li>

              <li>
                Referral, ambassador and promotional information.
              </li>

              <li>
                Communications sent to RouteX support.
              </li>

              <li>
                Technical information such as browser, device, IP address,
                timestamps and security logs where these systems are used.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Why RouteX uses personal information">
            <p>RouteX may process personal information to:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Create and manage user accounts.</li>

              <li>
                Connect passengers with available drivers and manage bookings.
              </li>

              <li>
                Communicate trip, support and service information.
              </li>

              <li>
                Calculate fares, promotions, driver amounts or referral
                rewards.
              </li>

              <li>
                Verify driver details and help protect passenger and driver
                safety.
              </li>

              <li>
                Detect and prevent fraud, abuse and security incidents.
              </li>

              <li>
                Comply with legal obligations or protect legal rights.
              </li>

              <li>
                Improve and operate the RouteX platform.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="5. Lawful processing">
            <p>
              RouteX will process personal information only where there is a
              lawful reason to do so.
            </p>

            <p>
              Depending on the situation, this may include your consent,
              performance of a contract, compliance with a legal obligation,
              protection of legitimate interests, or another lawful basis
              permitted under POPIA.
            </p>
          </LegalSection>

          <LegalSection title="6. Sharing personal information">
            <p>
              RouteX may share personal information only where reasonably
              necessary for the operation of the service or where required by
              law.
            </p>

            <p>This may include sharing information with:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                A passenger or driver involved in a RouteX booking.
              </li>

              <li>
                Technology, hosting, storage, communication or other service
                providers used by RouteX.
              </li>

              <li>
                Payment service providers where payment systems are used.
              </li>

              <li>
                Insurers, professional advisers or service providers where
                reasonably necessary.
              </li>

              <li>
                Law-enforcement bodies, regulators or courts where disclosure
                is legally required or permitted.
              </li>
            </ul>

            <p>
              RouteX does not sell personal information as a product.
            </p>
          </LegalSection>

          <LegalSection title="7. Passenger and driver information">
            <p>
              Certain information must be shared between passengers and drivers
              in order for a ride to take place.
            </p>

            <p>
              For example, a driver may receive information needed to identify
              the passenger and complete the trip, while a passenger may
              receive the driver's name, vehicle details, contact information
              and booking information where necessary.
            </p>

            <p>
              Users may only use this information for legitimate RouteX
              booking, safety or support purposes.
            </p>
          </LegalSection>

          <LegalSection title="8. Profile photos and uploaded information">
            <p>
              If you upload a profile image or document to RouteX, it may be
              stored by RouteX or by a technology provider used to provide the
              service.
            </p>

            <p>
              Uploaded information should only be used for the purpose for
              which it was submitted and for related operational, verification
              or safety purposes.
            </p>
          </LegalSection>

          <LegalSection title="9. Storage outside South Africa">
            <p>
              Some technology providers used by RouteX may store or process
              information outside South Africa.
            </p>

            <p>
              Where personal information is transferred across borders,
              RouteX will take reasonable steps to ensure that the transfer
              complies with applicable POPIA requirements.
            </p>
          </LegalSection>

          <LegalSection title="10. How long information is kept">
            <p>
              RouteX will keep personal information only for as long as
              reasonably necessary for the purpose for which it was collected,
              to operate the service, resolve disputes, prevent fraud, or
              comply with legal and record-keeping obligations.
            </p>

            <p>
              Information that no longer needs to be retained should be
              securely deleted, destroyed or de-identified where appropriate.
            </p>
          </LegalSection>

          <LegalSection title="11. Security">
            <p>
              RouteX will take reasonable technical and organisational steps
              to protect personal information against loss, misuse,
              unauthorised access, alteration or disclosure.
            </p>

            <p>
              No website, database or internet-based service can guarantee
              complete security.
            </p>

            <p>
              If RouteX becomes aware of a qualifying security compromise,
              RouteX will follow applicable POPIA notification requirements.
            </p>
          </LegalSection>

          <LegalSection title="12. Your privacy rights">
            <p>
              Subject to applicable law, you may have the right to:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                Ask whether RouteX holds personal information about you.
              </li>

              <li>
                Request access to personal information held about you.
              </li>

              <li>
                Request correction of inaccurate or outdated information.
              </li>

              <li>
                Request deletion where the information should no longer
                lawfully be retained.
              </li>

              <li>
                Object to certain types of processing where permitted by law.
              </li>

              <li>
                Withdraw consent where processing depends on consent.
              </li>

              <li>
                Object to unsolicited electronic direct marketing.
              </li>

              <li>
                Lodge a complaint with the Information Regulator of South
                Africa.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="13. Direct marketing">
            <p>
              RouteX may send promotional messages only where permitted by
              applicable law.
            </p>

            <p>
              You may opt out of promotional communication using the available
              unsubscribe or opt-out method.
            </p>

            <p>
              Service messages relating to bookings, safety, account security
              or important operational matters may still be sent where
              necessary.
            </p>
          </LegalSection>

          <LegalSection title="14. Children">
            <p>
              RouteX does not intend to unlawfully process the personal
              information of children.
            </p>

            <p>
              Where information about a child must be processed, RouteX will
              apply the requirements of POPIA, including obtaining lawful
              authorisation where required.
            </p>
          </LegalSection>

          <LegalSection title="15. Changes to this Privacy Policy">
            <p>
              RouteX may update this Privacy Policy as the service, technology
              or legal requirements change.
            </p>

            <p>
              The latest version will display the date on which it became
              effective.
            </p>
          </LegalSection>

          <LegalSection title="16. Contact RouteX">
            <p>
              If you have a privacy question, access request, correction
              request or complaint, contact RouteX Support.
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