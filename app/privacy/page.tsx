import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Fabletime',
  description: 'Privacy Policy for Fabletime, operated by DMCA Ventures Pty Ltd.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[var(--surface-page-via)] to-[var(--surface-page-to)]">
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors duration-200 mb-8"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Fabletime
        </Link>

        <div className="bg-[var(--surface-card)] rounded-3xl border-4 border-[var(--border-card)] shadow-[var(--clay-card)] p-8 md:p-12">
          <h1 className="font-heading text-4xl font-semibold text-primary mb-1">Privacy Policy</h1>
          <p className="text-sm text-secondary mb-2">
            Fable Time is operated by DMCA Ventures Pty Ltd (ACN: 694 545 536).
          </p>
          <p className="text-sm text-[var(--text-hint)] mb-8">Effective date: 9 May 2026</p>

          <div>

            <Section title="1. Who We Are">
              <p>
                DMCA Ventures Pty Ltd ("we", "us", "our") operates the website fabletime.co ("the
                Site"). We are committed to protecting your personal information in accordance with
                the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
              </p>
              <p>
                If you have any questions about this policy, you can{' '}
                <ContactLink />.
              </p>
            </Section>

            <Section title="2. What Information We Collect">
              <p>We may collect the following types of personal information:</p>
              <ul>
                <li>
                  <strong className="font-semibold text-foreground">Contact information</strong>{' '}
                  – such as your name and email address, if you subscribe to a newsletter or
                  contact us directly.
                </li>
                <li>
                  <strong className="font-semibold text-foreground">Usage data</strong> – such as
                  pages visited, time spent on the site, browser type, and device information,
                  collected automatically via analytics tools (e.g. Vercel Analytics).
                </li>
                <li>
                  <strong className="font-semibold text-foreground">Cookies</strong> – small data
                  files placed on your device to help us understand how the Site is used. See
                  Section 6 for more detail.
                </li>
              </ul>
              <p>
                We do not collect sensitive information (such as health, financial, or government
                identity information) unless you explicitly provide it.
              </p>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Operate and improve the Site</li>
                <li>Respond to your enquiries</li>
                <li>Send newsletters or updates (only where you have opted in)</li>
                <li>
                  Understand how visitors use the Site through aggregated analytics
                </li>
              </ul>
              <p>
                We do not sell, rent, or trade your personal information to third parties for
                marketing purposes.
              </p>
            </Section>

            <Section title="4. Disclosure of Your Information">
              <p>We may share your information with:</p>
              <ul>
                <li>
                  Service providers who help us operate the Site (e.g. hosting providers, email
                  platforms, analytics services), bound by confidentiality obligations
                </li>
                <li>
                  Authorities if required by law, court order, or to protect the rights and safety
                  of others
                </li>
              </ul>
              <p>
                Some of our service providers may be located outside Australia (for example, in
                the United States). Where this occurs, we take reasonable steps to ensure your
                information is handled in accordance with the APPs.
              </p>
            </Section>

            <Section title="5. Children's Privacy">
              <p>
                Fable Time is designed to be enjoyed by children, but this Site is intended to be
                accessed by parents and guardians on behalf of children. We do not knowingly
                collect personal information directly from children under the age of 13 without
                verifiable parental consent. If you believe we have inadvertently collected such
                information, please{' '}
                <ContactLink /> and we will promptly delete it.
              </p>
            </Section>

            <Section title="6. Cookies">
              <p>
                We use cookies and similar technologies to analyse traffic and improve your
                experience. By continuing to use the Site, you consent to our use of cookies.
              </p>
              <p>
                You can disable cookies in your browser settings, though some features of the
                Site may not function correctly as a result.
              </p>
            </Section>

            <Section title="7. Access and Correction">
              <p>
                You have the right to request access to the personal information we hold about
                you, and to ask us to correct it if it is inaccurate or out of date. To make a
                request, <ContactLink />. We will respond within 30 days.
              </p>
            </Section>

            <Section title="8. Security">
              <p>
                We take reasonable steps to protect your personal information from misuse,
                interference, loss, and unauthorised access, modification, or disclosure. However,
                no data transmission over the internet can be guaranteed to be completely secure.
              </p>
            </Section>

            <Section title="9. Links to Third-Party Sites">
              <p>
                The Site may contain links to external websites. We are not responsible for the
                privacy practices or content of those sites and encourage you to review their
                privacy policies.
              </p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. The updated version will be
                posted on this page with a revised effective date. We encourage you to review this
                page periodically.
              </p>
            </Section>

            <Section title="11. Contact Us" last>
              <p>
                For privacy-related enquiries or complaints, please use our{' '}
                <Link
                  href="/contact"
                  className="text-primary hover:text-primary-hover underline underline-offset-2"
                >
                  contact form
                </Link>
                .
              </p>
              <p>
                If you are not satisfied with our response, you may contact the Office of the
                Australian Information Commissioner (OAIC) at{' '}
                <a
                  href="https://www.oaic.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-hover underline underline-offset-2"
                >
                  oaic.gov.au
                </a>
                .
              </p>
            </Section>

          </div>
        </div>
      </main>
    </div>
  );
}

function ContactLink() {
  return (
    <Link
      href="/contact"
      className="text-primary hover:text-primary-hover underline underline-offset-2"
    >
      contact us
    </Link>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={last ? '' : 'mb-8'}>
      <h2 className="font-heading text-xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-secondary [&_ul]:mt-2 [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:marker:text-[var(--text-hint)]">
        {children}
      </div>
    </section>
  );
}
