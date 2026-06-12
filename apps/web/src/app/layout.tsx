import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HireFlow AI — From Resume to Interview, Fully Optimized",
  description:
    "ATS-optimized resumes, tailored cover letters, a job-match engine, and an application tracker — everything you need to land more interviews.",
};

const NAV_LINKS = [
  { href: "/editor", label: "Resume Builder" },
  { href: "/cover-letters", label: "Cover Letters" },
  { href: "/jobs", label: "Jobs" },
  { href: "/tracker", label: "Tracker" },
  { href: "/interview", label: "Interview Prep" },
];

const FOOTER_COLS = [
  {
    heading: "Product",
    links: [
      { href: "/editor", label: "Resume Builder" },
      { href: "/cover-letters", label: "Cover Letters" },
      { href: "/jobs", label: "Job Board" },
      { href: "/tracker", label: "Application Tracker" },
      { href: "/interview", label: "Interview Prep" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    heading: "Plans",
    links: [
      { href: "/#pricing", label: "Free plan" },
      { href: "/#pricing", label: "Pro — $20/mo" },
      { href: "/#pricing", label: "Expert — $40/mo" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {/* ── HEADER ── */}
          <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-8 py-3.5">

          {/* EXTREME LEFT — Logo */}
          <Link href="/" className="font-display text-xl font-bold tracking-tight shrink-0">
          HireFlow<span className="text-signal">AI</span>
          </Link>

          {/* EXTREME RIGHT — Nav links + Auth + CTA */}
          <div className="flex items-center gap-1">
          {/* Nav links (hidden on smaller screens) */}
          <nav className="hidden lg:flex items-center gap-0.5 mr-3">
          {NAV_LINKS.map(l => (
          <Link
          key={l.href}
          href={l.href}
          className="px-3 py-1.5 text-sm font-medium text-ink/55 hover:text-ink hover:bg-signalSoft/50 rounded-lg transition-all whitespace-nowrap"
          >
          {l.label}
          </Link>
          ))}
          </nav>

          {/* Divider */}
          <div className="hidden lg:block h-5 w-px bg-line mx-2" />

          {/* Auth buttons */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="hidden sm:inline-flex btn-ghost py-1.5 px-4 text-sm font-medium">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="hidden sm:inline-flex border border-line rounded-lg px-4 py-1.5 text-sm font-medium text-ink/70 hover:bg-signalSoft/40 transition-colors">Sign up</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="hidden sm:inline-flex btn-ghost py-1.5 px-4 text-sm font-medium">Dashboard</Link>
            <UserButton />
          </Show>
          <Link href="/editor" className="btn-primary py-1.5 px-4 text-sm font-semibold whitespace-nowrap ml-1">
          Build resume
          </Link>
          </div>
          </div>
          </header>

          <main>{children}</main>

          {/* ── FOOTER ── */}
          <footer className="mt-16 border-t border-line bg-paper">
          <div className="mx-auto max-w-7xl px-8 py-14">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
          <Link href="/" className="font-display text-xl font-bold tracking-tight">
          HireFlow<span className="text-signal">AI</span>
          </Link>
          <p className="mt-3 text-sm text-ink/60 max-w-xs leading-relaxed">
          ATS-optimized resumes, AI-powered bullet rewrites, and a job-match engine built on official job-board APIs.
          </p>
          <p className="mt-4 text-xs text-ink/30">Built with ♥ for job seekers everywhere</p>
          </div>
          {FOOTER_COLS.map(col => (
          <div key={col.heading}>
          <h4 className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-4">{col.heading}</h4>
          <ul className="space-y-2.5">
          {col.links.map(l => (
          <li key={l.href}>
          <Link href={l.href} className="text-sm text-ink/60 hover:text-signal transition-colors">{l.label}</Link>
          </li>
          ))}
          </ul>
          </div>
          ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-line pt-8">
          <p className="text-xs text-ink/40">
          © {new Date().getFullYear()} HireFlow AI · Built on official job-board APIs · Your data stays yours
          </p>
          <div className="flex gap-5 text-xs text-ink/40">
          <span className="hover:text-ink cursor-pointer">Privacy Policy</span>
          <span className="hover:text-ink cursor-pointer">Terms of Service</span>
          <span className="hover:text-ink cursor-pointer">GDPR</span>
          </div>
          </div>
          </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}