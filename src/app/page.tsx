import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090b] font-sans text-[#fafafa]">
      {/* Subtle geometric grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              x="0"
              y="0"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M60 0 L0 60"
                fill="none"
                stroke="#5eead4"
                strokeWidth="0.5"
              />
              <path
                d="M0 0 L60 60"
                fill="none"
                stroke="#5eead4"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="relative z-30 border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center border border-[#5eead4]/50">
              <div className="h-2 w-2 rotate-45 bg-[#5eead4]" />
            </div>
            <span className="text-sm font-medium tracking-tight">
              beakcrypt
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              How it works
            </Link>
            <Link
              href="#security"
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              Security
            </Link>
            <Link
              href="/docs"
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-sm text-white/50 hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="h-8 bg-[#5eead4] px-4 text-sm font-medium text-[#09090b] hover:bg-[#5eead4]/90"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                <span className="text-xs text-white/60">
                  v2.0 — Team sync available
                </span>
              </div>

              <h1 className="mb-5 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
                Stop sending .env files
                <span className="text-[#5eead4]"> over Slack</span>
              </h1>

              <p className="mb-8 max-w-md text-lg leading-relaxed text-white/60">
                Encrypted environment variables that sync across your entire
                team. One command. Zero plaintext exposure.
              </p>

              <div className="mb-8 flex flex-wrap items-center gap-4">
                <Link href="/signup">
                  <Button className="h-11 bg-[#5eead4] px-6 text-sm font-medium text-[#09090b] hover:bg-[#5eead4]/90">
                    Start for free
                  </Button>
                </Link>
                <Link
                  href="/docs"
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
                >
                  <span>Read the docs</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                    />
                  </svg>
                </Link>
              </div>

              <div className="flex items-center gap-6 border-t border-white/10 pt-6">
                <div>
                  <div className="text-2xl font-medium">2,400+</div>
                  <div className="text-xs text-white/40">Teams</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="text-2xl font-medium">14M+</div>
                  <div className="text-xs text-white/40">Secrets synced</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="text-2xl font-medium">99.99%</div>
                  <div className="text-xs text-white/40">Uptime</div>
                </div>
              </div>
            </div>

            {/* Terminal */}
            <div className="relative">
              <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0c0c0f]">
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="ml-2 text-xs text-white/30">Terminal</span>
                </div>
                <div className="p-5 font-mono text-[13px] leading-relaxed">
                  <div className="text-white/40">
                    <span className="text-[#5eead4]">$</span> npx beakcrypt pull
                    --env production
                  </div>
                  <div className="mt-4 space-y-1.5 text-white/50">
                    <div>
                      <span className="text-[#5eead4]">→</span> Connecting to
                      vault...
                    </div>
                    <div>
                      <span className="text-[#5eead4]">→</span> Fetching
                      encrypted bundle...
                    </div>
                    <div>
                      <span className="text-[#5eead4]">→</span> Decrypting with
                      local key...
                    </div>
                    <div>
                      <span className="text-[#22c55e]">✓</span> Written 18
                      variables to .env.local
                    </div>
                  </div>
                  <div className="mt-5 rounded border border-[#22c55e]/20 bg-[#22c55e]/5 p-3 text-sm">
                    <span className="text-[#22c55e]">Success!</span>
                    <span className="text-white/50">
                      {" "}
                      Environment synced in 1.2s
                    </span>
                  </div>
                </div>
              </div>

              {/* Geometric accent */}
              <div className="absolute -bottom-3 -right-3 h-24 w-24 border border-[#5eead4]/20" />
              <div className="absolute -bottom-6 -right-6 h-24 w-24 border border-[#5eead4]/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="relative z-10 border-y border-white/5 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-xs text-white/30">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              "Vercel",
              "Supabase",
              "Railway",
              "Planetscale",
              "Linear",
              "Resend",
            ].map((name) => (
              <span key={name} className="text-sm font-medium text-white/20">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#5eead4]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#5eead4]">
                Features
              </span>
            </div>
            <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight md:text-4xl">
              Everything you need to manage secrets
            </h2>
            <p className="text-white/50">
              Built for teams who ship fast but can&apos;t compromise on
              security.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                ),
                title: "End-to-end encryption",
                desc: "AES-256-GCM encryption. Secrets are encrypted on your machine before upload.",
              },
              {
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                ),
                title: "One command sync",
                desc: "Run `beakcrypt pull` and you're done. Works with npm, yarn, pnpm, and bun.",
              },
              {
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                ),
                title: "Team access control",
                desc: "Role-based permissions for developers, admins, and read-only users.",
              },
              {
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                    />
                  </svg>
                ),
                title: "Branch environments",
                desc: "Separate secrets for staging, production, and every feature branch.",
              },
              {
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: "Audit trail",
                desc: "Every access and change is logged. Exportable for compliance.",
              },
              {
                icon: (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
                    />
                  </svg>
                ),
                title: "Platform sync",
                desc: "Push to Vercel, Railway, Fly.io, and more. Keep platforms in sync.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-lg border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-[#5eead4]/20 hover:bg-white/[0.04]"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded border border-white/10 text-white/60 transition-colors group-hover:border-[#5eead4]/30 group-hover:text-[#5eead4]">
                  {feature.icon}
                </div>
                <h3 className="mb-1.5 font-medium">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 border-y border-white/5 bg-white/[0.01] px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-[#5eead4]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#5eead4]">
                How it works
              </span>
              <div className="h-px w-8 bg-[#5eead4]" />
            </div>
            <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight md:text-4xl">
              Get started in 3 minutes
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Connect your project",
                desc: "Link your repository. We detect your project and create a secure vault.",
                code: "npx beakcrypt init",
              },
              {
                step: "2",
                title: "Add your variables",
                desc: "Import from .env or add via dashboard. Encrypted client-side.",
                code: "npx beakcrypt push .env",
              },
              {
                step: "3",
                title: "Sync your team",
                desc: "Invite members. One command gets everyone the latest secrets.",
                code: "npx beakcrypt pull",
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded border border-[#5eead4]/50 text-sm font-medium text-[#5eead4]">
                    {item.step}
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <h3 className="mb-2 font-medium">{item.title}</h3>
                <p className="mb-4 text-sm text-white/50">{item.desc}</p>
                <div className="rounded border border-white/5 bg-[#09090b] px-4 py-2.5 font-mono text-sm text-white/60">
                  <span className="text-[#5eead4]">$</span> {item.code}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-8 bg-[#5eead4]" />
                <span className="text-xs font-medium uppercase tracking-wider text-[#5eead4]">
                  Security
                </span>
              </div>
              <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight md:text-4xl">
                We can&apos;t read your secrets
              </h2>
              <p className="mb-6 text-lg text-white/50">
                Zero-knowledge architecture. Your plaintext never touches our
                servers.
              </p>
              <Link
                href="/security"
                className="inline-flex items-center gap-2 text-sm text-[#5eead4] hover:underline"
              >
                <span>Security whitepaper</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                  />
                </svg>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { metric: "AES-256-GCM", label: "Encryption" },
                { metric: "Zero-knowledge", label: "Architecture" },
                { metric: "SOC 2 Type II", label: "Compliance" },
                { metric: "100%", label: "Client-side" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="mb-1 text-lg font-medium text-[#5eead4]">
                    {item.metric}
                  </div>
                  <div className="text-xs text-white/40">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-lg border border-white/10 bg-white/[0.02] p-10 text-center md:p-14">
            {/* Geometric corner accents */}
            <div className="absolute left-4 top-4 h-4 w-4 border-l border-t border-[#5eead4]/30" />
            <div className="absolute right-4 top-4 h-4 w-4 border-r border-t border-[#5eead4]/30" />
            <div className="absolute bottom-4 left-4 h-4 w-4 border-b border-l border-[#5eead4]/30" />
            <div className="absolute bottom-4 right-4 h-4 w-4 border-b border-r border-[#5eead4]/30" />

            <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight md:text-4xl">
              Ready to secure your secrets?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-white/50">
              Free for personal use. Team plans from $12/month per seat.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button className="h-11 bg-[#5eead4] px-7 text-sm font-medium text-[#09090b] hover:bg-[#5eead4]/90">
                  Start for free
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  className="h-11 border-white/10 bg-transparent px-7 text-sm text-white/70 hover:bg-white/5"
                >
                  View pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center border border-[#5eead4]/40">
                  <div className="h-1.5 w-1.5 rotate-45 bg-[#5eead4]" />
                </div>
                <span className="text-sm font-medium">beakcrypt</span>
              </div>
              <p className="text-sm text-white/40">
                Secure env management for modern teams.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Security", "Changelog"],
              },
              {
                title: "Resources",
                links: ["Docs", "API", "CLI Guide", "Examples"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                  {col.title}
                </div>
                <div className="space-y-2">
                  {col.links.map((link) => (
                    <div key={link}>
                      <Link
                        href="#"
                        className="text-sm text-white/50 hover:text-white"
                      >
                        {link}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
            <span className="text-xs text-white/30">© 2026 Beakcrypt</span>
            <div className="flex gap-6 text-xs text-white/40">
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
              <Link href="/status" className="hover:text-white">
                Status
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
