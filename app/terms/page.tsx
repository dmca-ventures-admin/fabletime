import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use — Fabletime',
  description: 'Terms of Use for Fabletime, operated by DMCA Ventures Pty Ltd.',
};

export default function TermsPage() {
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
          <h1 className="font-heading text-4xl font-semibold text-primary mb-1">Terms of Use</h1>
          <p className="text-sm text-secondary mb-2">
            Fable Time is operated by DMCA Ventures Pty Ltd (ACN: 694 545 536).
          </p>
          <p className="text-sm text-[var(--text-hint)] mb-8">Effective date: 9 May 2026</p>

          <div className="prose-legal">

            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using fabletime.co ("the Site"), you agree to be bound by these
                Terms of Use ("Terms"). If you do not agree, please do not use the Site.
              </p>
              <p>
                These Terms are governed by the laws of New South Wales, Australia. Any disputes
                will be subject to the exclusive jurisdiction of the courts of New South Wales.
              </p>
            </Section>

            <Section title="2. About the Site">
              <p>
                Fable Time provides children's stories and related content for the enjoyment of
                families. The content on this Site is intended for personal, non-commercial use
                only.
              </p>
            </Section>

            <Section title="3. Use of the Site">
              <p>
                You agree to use the Site only for lawful purposes and in a manner that does not
                infringe the rights of others or restrict or inhibit their use and enjoyment of
                the Site.
              </p>
              <p>You must not:</p>
              <ul>
                <li>
                  Copy, reproduce, distribute, or commercially exploit any content from the Site
                  without our written permission
                </li>
                <li>
                  Use the Site to transmit any unsolicited or unauthorised communications
                </li>
                <li>
                  Attempt to gain unauthorised access to any part of the Site or its related
                  systems
                </li>
                <li>
                  Use the Site in any way that could damage, disable, or impair its functionality
                </li>
              </ul>
            </Section>

            <Section title="4. Intellectual Property">
              <p>
                All content on the Site — including stories, illustrations, text, graphics, logos,
                and design — is owned by or licensed to DMCA Ventures Pty Ltd and is protected by
                Australian and international copyright law.
              </p>
              <p>© 2026 DMCA Ventures Pty Ltd. All rights reserved.</p>
              <p>
                You may print or download content from the Site for your personal, non-commercial
                use only. Any other use requires our prior written consent.
              </p>
            </Section>

            <Section title="5. User-Submitted Content">
              <p>
                If the Site allows you to submit comments, stories, or other content, you grant
                DMCA Ventures Pty Ltd a non-exclusive, royalty-free, perpetual licence to use,
                display, and distribute that content on the Site. You represent that you own or
                have the right to submit any content you provide, and that it does not infringe
                any third-party rights.
              </p>
              <p>
                We reserve the right to remove any user-submitted content at our sole discretion.
              </p>
            </Section>

            <Section title="6. Disclaimer">
              <p>
                The content on this Site is provided for general information and entertainment
                purposes only. While we take care to ensure accuracy, we make no representations
                or warranties of any kind, express or implied, about the completeness, accuracy,
                reliability, or suitability of the content.
              </p>
              <p>
                To the fullest extent permitted by law, DMCA Ventures Pty Ltd excludes all
                liability for any loss or damage arising from your use of the Site or reliance on
                its content.
              </p>
              <p>
                Nothing in these Terms excludes any rights you may have under the Australian
                Consumer Law.
              </p>
            </Section>

            <Section title="7. Children">
              <p>
                Fable Time is designed for children to enjoy with parental supervision. We
                encourage parents and guardians to be involved in their children's online
                activities. We are not responsible for any content accessed via third-party links
                from the Site.
              </p>
            </Section>

            <Section title="8. Third-Party Links">
              <p>
                The Site may contain links to third-party websites. These links are provided for
                convenience only. We do not endorse or take responsibility for the content,
                privacy practices, or availability of those sites.
              </p>
            </Section>

            <Section title="9. Changes to the Site and Terms">
              <p>
                We reserve the right to modify, suspend, or discontinue the Site (or any part of
                it) at any time without notice. We may also update these Terms from time to time.
                Continued use of the Site after changes are posted constitutes your acceptance of
                the updated Terms.
              </p>
            </Section>

            <Section title="10. Contact Us" last>
              <p>
                For questions about these Terms, please use the{' '}
                <Link href="/contact" className="text-primary hover:text-primary-hover underline underline-offset-2">
                  contact form
                </Link>
                .
              </p>
            </Section>

          </div>
        </div>
      </main>
    </div>
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
