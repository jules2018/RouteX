"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RefundPolicyPage() {
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
            Payments
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.04em]">
            Refund &
            <br />
            Cancellation Policy
          </h1>

          <p className="mt-3 text-[14px] font-medium text-[#777777]">
            Effective 14 September 2026
          </p>
        </section>

        {/* CONTENT */}
        <div className="space-y-8 pt-7 text-[16px] leading-[1.7] text-[#555555]">

          <LegalSection title="1. About this policy">
            <p>
              This policy explains how RouteX handles ride cancellations,
              disputed charges, duplicate payments, refunds and promotional
              credits.
            </p>

            <p>
              Nothing in this policy is intended to remove any right or remedy
              that a passenger has under applicable South African consumer
              law.
            </p>
          </LegalSection>

          <LegalSection title="2. Cancelling a ride">
            <p>
              A passenger may cancel a ride request if the ride is no longer
              required.
            </p>

            <p>
              Passengers should cancel as soon as reasonably possible so that
              the driver is not unnecessarily travelling to the pickup
              location or waiting for the passenger.
            </p>
          </LegalSection>

          <LegalSection title="3. Cancellation fees">
            <p>
              RouteX may introduce a cancellation or no-show fee where
              reasonably necessary.
            </p>

            <p>
              Any cancellation or no-show fee must be clearly communicated or
              displayed to the passenger before it becomes applicable.
            </p>

            <p>
              RouteX will not charge a cancellation fee merely because this
              policy exists.
            </p>
          </LegalSection>

          <LegalSection title="4. Driver cancellations">
            <p>
              If a driver cancels a booking before the trip begins, the
              passenger will generally not be responsible for paying for a
              trip that was not provided.
            </p>

            <p>
              RouteX may attempt to connect the passenger with another
              available driver, but another driver cannot be guaranteed.
            </p>
          </LegalSection>

          <LegalSection title="5. When a refund may be considered">
            <p>
              A refund or payment adjustment may be considered where, for
              example:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>A passenger was charged more than once for the same ride.</li>

              <li>
                Payment was collected for a ride that did not take place.
              </li>

              <li>
                A technical error resulted in an incorrect charge.
              </li>

              <li>
                The fare charged materially differs from the applicable fare
                without a valid reason.
              </li>

              <li>
                Another refund or remedy is required under applicable South
                African law.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Completed rides">
            <p>
              A passenger is not automatically entitled to a full refund
              simply because they were dissatisfied with a completed ride.
            </p>

            <p>
              RouteX may review complaints involving significant service
              failures, incorrect charges, safety incidents or other relevant
              circumstances and determine an appropriate response subject to
              applicable law.
            </p>
          </LegalSection>

          <LegalSection title="7. Cash payments">
            <p>
              Where a ride was paid directly to a driver in cash, RouteX may
              investigate a payment dispute but may not physically hold the
              funds that were paid.
            </p>

            <p>
              RouteX may contact the driver and passenger and review available
              booking information when assisting with the dispute.
            </p>
          </LegalSection>

          <LegalSection title="8. Electronic payments">
            <p>
              Where RouteX supports electronic payments, an approved refund
              will normally be processed using an appropriate available
              payment method.
            </p>

            <p>
              The time required for a refund to appear may depend on the
              payment provider, bank or other financial institution involved.
            </p>
          </LegalSection>

          <LegalSection title="9. Promotions and credits">
            <p>
              Promotional discounts, referral rewards, vouchers or RouteX
              credits may be subject to separate campaign terms.
            </p>

            <p>
              Unless required by law or expressly stated otherwise, unused
              promotional value is not automatically exchangeable for cash.
            </p>

            <p>
              If a qualifying booking is cancelled, RouteX may restore an
              eligible promotional credit where appropriate and technically
              possible.
            </p>
          </LegalSection>

          <LegalSection title="10. Incorrect trip information">
            <p>
              Refunds may be reduced or refused where an additional amount
              arose because the passenger materially changed the trip,
              provided an incorrect pickup or destination, requested
              additional stops, or caused additional waiting time, provided
              the charge was lawful and properly applicable.
            </p>
          </LegalSection>

          <LegalSection title="11. Fraud and abuse">
            <p>
              RouteX may refuse a refund or promotional adjustment where there
              is reasonable evidence of fraud, manipulation, repeated misuse
              of promotions or another attempt to obtain money or benefits
              dishonestly.
            </p>

            <p>
              RouteX may investigate suspicious refund requests before making
              a decision.
            </p>
          </LegalSection>

          <LegalSection title="12. Reporting a payment problem">
            <p>
              Contact RouteX Support as soon as reasonably possible if you
              believe you were charged incorrectly.
            </p>

            <p>
              Please provide your name, booking details, the amount involved
              and a short explanation of the problem.
            </p>

            <p>
              RouteX may request additional information reasonably necessary
              to investigate the matter.
            </p>
          </LegalSection>

          <LegalSection title="13. Consumer rights">
            <p>
              This policy operates subject to applicable South African law,
              including consumer-protection requirements.
            </p>

            <p>
              Nothing in this policy limits a right or remedy that cannot
              lawfully be excluded or restricted.
            </p>
          </LegalSection>

          <LegalSection title="14. Contact RouteX">
            <p>
              For cancellations, fare disputes or refund queries, contact
              RouteX Support.
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
            <a href="/terms" className="hover:text-[#ff6a00]">
              Passenger Terms
            </a>

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