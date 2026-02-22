const steps = [
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
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-white/5 bg-white/1 py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
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
          {steps.map((item) => (
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
  );
}
