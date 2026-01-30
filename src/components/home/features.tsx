import {
  Lock,
  SquareTerminal,
  Users,
  Split,
  Footprints,
  Router,
} from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "End-to-end encryption",
    desc: "AES-256-GCM encryption. Secrets are encrypted on your machine before upload.",
  },
  {
    icon: SquareTerminal,
    title: "One command sync",
    desc: "Run `beakcrypt pull` and you're done. Works with npm, yarn, pnpm, and bun.",
  },
  {
    icon: Users,
    title: "Team access control",
    desc: "Role-based permissions for developers, admins, and read-only users.",
  },
  {
    icon: Split,
    title: "Branch environments",
    desc: "Separate secrets for staging, production, and every feature branch.",
  },
  {
    icon: Footprints,
    title: "Audit trail",
    desc: "Every access and change is logged. Exportable for compliance.",
  },
  {
    icon: Router,
    title: "Platform sync",
    desc: "Push to Vercel, Railway, Fly.io, and more. Keep platforms in sync.",
  },
];

export default function Features() {
  return (
    <section id="features" className="px-6 py-24 mx-auto max-w-6xl">
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
          Built for teams who ship fast but can&apos;t compromise on security.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-lg border border-white/5 bg-white/2 p-5 transition-all hover:border-[#5eead4]/20 hover:bg-white/4"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded border border-white/10 text-white/60 transition-colors group-hover:border-[#5eead4]/30 group-hover:text-[#5eead4]">
              <feature.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
            </div>
            <h3 className="mb-1.5 font-medium">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-white/50">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
