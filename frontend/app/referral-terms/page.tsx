"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function ReferralTermsPage() {
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
            RouteX Rewards
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.04em]">
            Ambassador &
            <br />
            Referral Terms
          </h1>

          <p className="mt-3 text-[14px] font-medium text-[#777777]">
            Effective 14 September 2026
          </p>
        </section>

        {/* CONTENT */}
        <div className="space-y-8 pt-7 text-[16px] leading-[1.7] text-[#555555]">

          <LegalSection title="1. About the programs">
            <p>
              RouteX may operate referral, ambassador, promotional and
              community-growth programs from time to time.
            </p>

            <p>
              These terms apply together with any specific campaign rules,
              reward amounts, qualifying actions, dates or limits communicated
              by RouteX for a particular program.
            </p>
          </LegalSection>

          <LegalSection title="2. Eligibility">
            <p>
              Participation may be limited to eligible RouteX passengers,
              drivers, ambassadors or other approved participants.
            </p>

            <p>
              RouteX may require participants to have a valid RouteX account
              and provide accurate information before rewards are issued.
            </p>
          </LegalSection>

          <LegalSection title="3. Referral codes">
            <p>
              RouteX may issue referral codes or links that allow eligible
              participants to refer new passengers, drivers, businesses or
              other participants.
            </p>

            <p>
              Referral codes are intended for legitimate referrals and may not
              be manipulated, duplicated or used to create false qualifying
              activity.
            </p>
          </LegalSection>

          <LegalSection title="4. Qualifying referrals">
            <p>
              A referral only qualifies for a reward if it satisfies the rules
              of the applicable RouteX campaign.
            </p>

            <p>
              A campaign may require an action such as registration, approval,
              a first completed trip or another stated milestone before a
              reward becomes payable.
            </p>

            <p>
              Registration alone does not necessarily qualify for a reward
              unless the applicable campaign specifically says that it does.
            </p>
          </LegalSection>

          <LegalSection title="5. Rewards and bonuses">
            <p>
              Reward amounts, allowances, bonuses and qualifying milestones
              may differ between RouteX campaigns.
            </p>

            <p>
              The applicable reward will be the amount communicated by RouteX
              for that specific campaign at the time of participation.
            </p>

            <p>
              RouteX may place reasonable limits on the number or value of
              rewards available under a campaign.
            </p>
          </LegalSection>

          <LegalSection title="6. Verification">
            <p>
              RouteX may verify referrals and qualifying activity before
              approving a reward.
            </p>

            <p>
              Verification may include checking RouteX account records,
              booking records, referral codes, driver approvals, completed
              trips or other relevant information.
            </p>
          </LegalSection>

          <LegalSection title="7. Prohibited activity">
            <p>Participants may not:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Create fake or duplicate accounts to earn rewards.</li>

              <li>
                Submit false passenger, driver, business or referral
                information.
              </li>

              <li>
                Claim credit for a referral that they did not legitimately
                generate.
              </li>

              <li>
                Manipulate bookings, trips or account activity solely to
                trigger a reward.
              </li>

              <li>
                Use bots, scripts or other automated methods to generate
                fraudulent referrals.
              </li>

              <li>
                Misrepresent themselves as an employee or authorised legal
                representative of RouteX.
              </li>

              <li>
                Send unlawful spam or use misleading advertising to promote
                RouteX.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="8. Ambassador conduct">
            <p>
              RouteX ambassadors must represent the program accurately and
              professionally.
            </p>

            <p>
              Ambassadors may explain RouteX, distribute approved promotional
              material and assist potential users with legitimate registration
              information.
            </p>

            <p>
              Ambassadors may not make guarantees about earnings, ride
              availability, employment, safety, promotions or services that
              RouteX has not authorised.
            </p>
          </LegalSection>

          <LegalSection title="9. RouteX branding">
            <p>
              RouteX may permit ambassadors or participants to use approved
              RouteX logos, QR codes, links or promotional material for the
              purpose of the program.
            </p>

            <p>
              RouteX branding may not be altered or used in a misleading,
              unlawful or damaging manner.
            </p>
          </LegalSection>

          <LegalSection title="10. Independent participation">
            <p>
              Participation in a RouteX ambassador or referral program does
              not automatically create an employment relationship,
              partnership, franchise or agency relationship.
            </p>

            <p>
              The legal nature of any relationship will depend on the actual
              circumstances and applicable South African law, regardless of
              the label used by the parties.
            </p>
          </LegalSection>

          <LegalSection title="11. Personal information">
            <p>
              Participants must respect the privacy of passengers, drivers,
              businesses and other people they refer.
            </p>

            <p>
              Personal information may not be collected, published, sold or
              misused for unrelated purposes.
            </p>

            <a
              href="/privacy"
              className="inline-block font-bold text-[#ff6a00]"
            >
              Read the RouteX Privacy Policy →
            </a>
          </LegalSection>

          <LegalSection title="12. Reward withholding">
            <p>
              RouteX may delay or withhold a reward while investigating
              suspected fraud, duplicate referrals, manipulated activity or a
              breach of these terms.
            </p>

            <p>
              A reward may be refused where the qualifying requirements were
              not met or the referral activity was fraudulent or materially
              misleading.
            </p>
          </LegalSection>

          <LegalSection title="13. Changes to a program">
            <p>
              RouteX may change, pause or end a referral or ambassador
              campaign, including future reward amounts and eligibility rules.
            </p>

            <p>
              Changes should not unfairly remove a reward that was already
              legitimately earned under the applicable campaign rules, subject
              to verification and applicable law.
            </p>
          </LegalSection>

          <LegalSection title="14. Taxes">
            <p>
              Participants are responsible for understanding any personal tax
              obligations that may arise from rewards, allowances or other
              amounts received through a RouteX program.
            </p>
          </LegalSection>

          <LegalSection title="15. Suspension from a program">
            <p>
              RouteX may suspend or remove a participant from a referral or
              ambassador program for fraud, serious misconduct, abuse of the
              program, unlawful activity or material breaches of these terms.
            </p>
          </LegalSection>

          <LegalSection title="16. Governing law">
            <p>
              These terms are governed by the laws of the Republic of South
              Africa.
            </p>

            <p>
              Nothing in these terms removes rights or remedies that cannot
              lawfully be excluded.
            </p>
          </LegalSection>

          <LegalSection title="17. Contact RouteX">
            <p>
              For questions about a referral, ambassador reward or qualifying
              activity, contact RouteX Support.
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