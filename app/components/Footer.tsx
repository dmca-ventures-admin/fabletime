import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-footer)] bg-[var(--surface-footer)] py-5 mt-auto">
      <div className="container mx-auto px-6 max-w-3xl flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/terms"
            className="text-xs text-secondary hover:text-primary transition-colors duration-200 underline-offset-2 hover:underline"
          >
            Terms of Use
          </Link>
          <span className="text-xs text-[var(--text-hint)]" aria-hidden="true">·</span>
          <Link
            href="/privacy"
            className="text-xs text-secondary hover:text-primary transition-colors duration-200 underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          <span className="text-xs text-[var(--text-hint)]" aria-hidden="true">·</span>
          <Link
            href="/contact"
            className="text-xs text-secondary hover:text-primary transition-colors duration-200 underline-offset-2 hover:underline"
          >
            Contact Us
          </Link>
        </div>
        <p className="text-xs text-[var(--text-hint)]">
          © 2026 DMCA Ventures Pty Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
