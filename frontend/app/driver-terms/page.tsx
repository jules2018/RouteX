"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function DriverTermsPage() {
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
            href="/become-a-driver"
            className="rounded-full border border-[#e8e8e8] px-4 py-2 text-[14px] font-bold"
          >
            Back
          </a>
        </header>

        {/* TITLE */}
        <section className="border-b border-[#eeeeee] pb-6 pt-4">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#ff6a00]">
            Drivers
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.04em]">
            Driver Terms
            <br />
            & Agreement
          </h1>

          <p className="mt-3 text-[15px] leading-relaxed text-[#666666]">
            Driver Terms & Conditions and Independent Contractor Agreement
          </p>

          <p className="mt-2 text-[14px] font-medium text-[#999999]">
            Effective 14 September 2026
          </p>
        </section>

        {/* INTRO */}
        <section className="mt-6 rounded-[20px] bg-[#fff4ec] p-5">
          <p className="text-[14px] font-bold leading-relaxed text-[#111111]">
            Important
          </p>

          <p className="mt-2 text-[14px] leading-relaxed text-[#555555]">
            By registering as a RouteX driver and accepting these terms, you
            agree to both the Driver Terms & Conditions and the Independent
            Contractor Agreement below.
          </p>
        </section>

        {/* DRIVER TERMS */}
        <div className="space-y-8 pt-8 text-[16px] leading-[1.7] text-[#555555]">

          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#ff6a00]">
              Part A
            </p>

            <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-[#111111]">
              Driver Terms & Conditions
            </h2>
          </div>

          <LegalSection title="1. About RouteX">
            <p>
              RouteX is a technology-enabled platform that connects passengers
              seeking transportation with participating drivers.
            </p>

            <p>
              These terms govern your access to and use of RouteX as a driver.
            </p>
          </LegalSection>

          <LegalSection title="2. Driver eligibility">
            <p>
              To provide rides through RouteX, you must be legally permitted to
              provide the relevant transport service and satisfy applicable
              RouteX onboarding requirements.
            </p>

            <p>You are responsible for maintaining, where legally required:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>A valid driver's licence.</li>
              <li>A legally compliant and roadworthy vehicle.</li>
              <li>
                Any professional driving permit, operating licence, permit or
                authorisation required by law.
              </li>
              <li>
                Appropriate vehicle and insurance cover required for the
                services you provide.
              </li>
              <li>
                Any other documents legally required for passenger transport.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Accurate driver information">
            <p>
              Information and documents submitted to RouteX must be accurate,
              current and authentic.
            </p>

            <p>
              You must notify RouteX if a licence, permit, vehicle document,
              insurance policy or other required authorisation expires, is
              suspended, cancelled or otherwise becomes invalid.
            </p>
          </LegalSection>

          <LegalSection title="4. Using the RouteX platform">
            <p>
              Drivers may choose when to make themselves available on RouteX,
              subject to the platform's functionality and applicable law.
            </p>

            <p>
              RouteX does not guarantee any minimum number of ride requests,
              passengers, working hours or income.
            </p>

            <p>
              A driver should only indicate that they are available when they
              are reasonably able and legally permitted to accept rides.
            </p>
          </LegalSection>

          <LegalSection title="5. Accepting rides">
            <p>
              When you accept a passenger's ride request, you are expected to
              make a reasonable effort to complete that trip safely and
              professionally.
            </p>

            <p>
              You may refuse or cancel a ride where there is a legitimate
              safety, legal, vehicle or operational reason.
            </p>

            <p>
              Drivers may not discriminate unlawfully when deciding whether to
              provide a service.
            </p>
          </LegalSection>

          <LegalSection title="6. Driver conduct">
            <p>RouteX drivers must:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Drive lawfully and responsibly.</li>

              <li>
                Treat passengers respectfully and professionally.
              </li>

              <li>
                Not threaten, harass, discriminate against or assault a
                passenger.
              </li>

              <li>
                Not drive while impaired by alcohol, drugs, fatigue or another
                condition that makes driving unsafe.
              </li>

              <li>
                Not use a mobile device in an unlawful or dangerous manner
                while driving.
              </li>

              <li>
                Carry only the number of passengers the vehicle can lawfully
                accommodate.
              </li>

              <li>
                Take reasonable steps to keep the vehicle safe, clean and
                roadworthy.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="7. Passenger information">
            <p>
              Passenger names, telephone numbers, pickup locations,
              destinations and other booking information may only be used for
              legitimate RouteX ride, safety and support purposes.
            </p>

            <p>
              A driver may not use passenger information for harassment,
              unsolicited contact, independent marketing or another unrelated
              purpose.
            </p>
          </LegalSection>

          <LegalSection title="8. Fares and driver earnings">
            <p>
              RouteX may display or communicate the fare applicable to a
              booking and any platform fee, promotional adjustment or other
              amount that applies.
            </p>

            <p>
              Drivers should review the applicable fare information before
              accepting or completing a booking.
            </p>

            <p>
              RouteX does not guarantee a particular level of earnings or
              number of bookings.
            </p>
          </LegalSection>

          <LegalSection title="9. Promotions">
            <p>
              RouteX may offer passenger discounts or promotional campaigns
              from time to time.
            </p>

            <p>
              Where RouteX funds a promotion without reducing the driver's
              agreed fare, the driver's booking information should reflect the
              applicable arrangement.
            </p>

            <p>
              Promotional rules may vary between campaigns.
            </p>
          </LegalSection>

          <LegalSection title="10. Safety incidents">
            <p>
              Drivers should promptly report serious accidents, passenger
              safety incidents, threats, suspected fraud or other significant
              incidents connected to a RouteX trip.
            </p>

            <p>
              In an emergency, contact the appropriate emergency service or
              law-enforcement authority first.
            </p>

            <a
              href="/safety"
              className="inline-block font-bold text-[#ff6a00]"
            >
              Read RouteX Safety Guidelines →
            </a>
          </LegalSection>

          <LegalSection title="11. Vehicle responsibility">
            <p>
              The driver is responsible for the vehicle used to provide
              services, including its maintenance, fuel, repairs, tyres,
              licensing, cleanliness and roadworthiness unless RouteX
              expressly agrees otherwise in writing.
            </p>
          </LegalSection>

          <LegalSection title="12. Insurance">
            <p>
              Drivers are responsible for maintaining insurance required by
              applicable law and any additional cover reasonably necessary for
              the passenger transport activities they perform.
            </p>

            <p>
              Drivers should confirm with their insurer that their policy is
              suitable for the way in which the vehicle is being used.
            </p>
          </LegalSection>

          <LegalSection title="13. Suspension or removal">
            <p>
              RouteX may temporarily restrict or suspend a driver's access
              where reasonably necessary to investigate safety concerns,
              suspected fraud, invalid documentation, serious passenger
              complaints or potential breaches of these terms.
            </p>

            <p>
              Serious or repeated violations may result in removal from the
              RouteX platform, subject to applicable law.
            </p>
          </LegalSection>

          {/* CONTRACTOR AGREEMENT */}
          <div className="border-t border-[#eeeeee] pt-9">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#ff6a00]">
              Part B
            </p>

            <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-[#111111]">
              Independent Contractor Agreement
            </h2>
          </div>

          <LegalSection title="14. Intended relationship">
            <p>
              RouteX and the driver intend their relationship to be that of
              independent contracting parties rather than employer and
              employee.
            </p>

            <p>
              This description does not override South African law. The legal
              nature of the relationship will depend on the actual facts and
              circumstances and any applicable labour or other legislation.
            </p>
          </LegalSection>

          <LegalSection title="15. Independence">
            <p>
              Subject to applicable law and these terms, a driver generally
              determines whether and when to make themselves available to
              receive RouteX ride requests.
            </p>

            <p>
              RouteX does not guarantee working hours, minimum earnings or a
              minimum volume of work.
            </p>

            <p>
              Nothing in this agreement prevents a driver from using other
              lawful sources of work unless a specific lawful restriction is
              separately agreed in writing.
            </p>
          </LegalSection>

          <LegalSection title="16. Driver expenses">
            <p>
              Unless RouteX expressly agrees otherwise in writing, drivers are
              responsible for their own operating expenses, including fuel,
              vehicle maintenance, repairs, mobile data, licences, permits and
              insurance.
            </p>
          </LegalSection>

          <LegalSection title="17. Taxes">
            <p>
              Drivers are responsible for understanding and complying with
              their own tax obligations arising from income earned through
              their activities.
            </p>

            <p>
              Nothing in this clause prevents RouteX from complying with a tax
              reporting, withholding or disclosure obligation imposed by law.
            </p>
          </LegalSection>

          <LegalSection title="18. No employment benefits">
            <p>
              To the extent that the relationship is lawfully classified as an
              independent-contractor relationship, the driver is not entitled
              to employee benefits from RouteX merely because they use the
              RouteX platform.
            </p>

            <p>
              This clause does not remove any right that a driver may have
              under applicable South African law if the relationship is legally
              classified differently.
            </p>
          </LegalSection>

          <LegalSection title="19. Confidentiality">
            <p>
              Drivers must protect confidential RouteX information and
              passenger personal information obtained through the platform.
            </p>

            <p>
              Confidential or personal information may not be disclosed or
              used for unrelated purposes except where authorised or legally
              required.
            </p>
          </LegalSection>

          <LegalSection title="20. Responsibility for driving">
            <p>
              The driver remains responsible for their driving decisions,
              compliance with road laws and the safe operation of the vehicle.
            </p>

            <p>
              RouteX does not authorise or require a driver to speed, drive
              dangerously or violate any law in order to complete a booking.
            </p>
          </LegalSection>

          <LegalSection title="21. Liability">
            <p>
              Each party remains responsible for its own acts and omissions to
              the extent provided by applicable law.
            </p>

            <p>
              Nothing in this agreement is intended to exclude liability or
              legal rights that cannot lawfully be excluded.
            </p>
          </LegalSection>

          <LegalSection title="22. Ending platform access">
            <p>
              A driver may stop using RouteX subject to any outstanding
              bookings, payments, investigations or legal obligations.
            </p>

            <p>
              RouteX may terminate or restrict platform access for serious or
              repeated violations, fraud, safety concerns, invalid legal
              documentation or other lawful reasons.
            </p>
          </LegalSection>

          <LegalSection title="23. Privacy">
            <p>
              RouteX processes driver personal information in accordance with
              its Privacy Policy and applicable South African privacy law.
            </p>

            <a
              href="/privacy"
              className="inline-block font-bold text-[#ff6a00]"
            >
              Read the Privacy Policy →
            </a>
          </LegalSection>

          <LegalSection title="24. Electronic acceptance">
            <p>
              Selecting the acceptance checkbox during RouteX driver
              registration and submitting the application constitutes an
              electronic indication that the driver agrees to these Driver
              Terms & Conditions and this Independent Contractor Agreement.
            </p>

            <p>
              RouteX may retain an electronic record of the acceptance,
              including the date, time and version of the agreement accepted.
            </p>
          </LegalSection>

          <LegalSection title="25. Governing law">
            <p>
              These terms and this agreement are governed by the laws of the
              Republic of South Africa.
            </p>

            <p>
              Nothing in this agreement prevents either party from exercising
              rights available under applicable South African law.
            </p>
          </LegalSection>

          <LegalSection title="26. Contact RouteX">
            <p>
              Drivers can contact RouteX Support regarding these terms,
              bookings or their RouteX account.
            </p>

            <a
              href="https://wa.me/27799132513"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex rounded-full bg-[#111111] px-5 py-3 text-[14px] font-bold text-white"
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
            <a href="/privacy" className="hover:text-[#ff6a00]">
              Privacy
            </a>

            <a href="/terms-of-use" className="hover:text-[#ff6a00]">
              Terms of Use
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