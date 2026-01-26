import Link from "next/link";
import WaitlistForm from "./form";
import { Github } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export default function WaitlistPage() {
  return (
    <section>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center border border-[#5eead4]/50">
            <div className="h-2 w-2 rotate-45 bg-[#5eead4]" />
          </div>
          <span className="text-sm font-medium tracking-tight">beakcrypt</span>
        </Link>

        <Button variant="outline" asChild>
          <Link href="https://github.com/prudentbird/beakcrypt">
            <Github className="h-4 w-4" />
            Star on GitHub
          </Link>
        </Button>
      </nav>

      <main className="flex flex-col items-center gap-10 px-6 mt-10">
        <div className="flex flex-col items-center w-full gap-4">
          <Badge
            variant="outline"
            className="gap-2 border-[#5eead4]/20 bg-[#5eead4]/5 px-4 py-1.5 text-[#5eead4]"
          >
            Join The Waitlist
          </Badge>

          <h1 className="font-sans text-5xl text-center font-medium leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            Be First to join the <span className="text-[#5eead4]">Vault</span>
          </h1>

          <p className="max-w-xl text-center text-xl leading-relaxed text-white/50">
            The open-source standard for managing and sharing environment
            variables securely across your entire development workflow.
          </p>
          <WaitlistForm />
        </div>

        <Card className="p-0 border-white/10 bg-[#0c0c0f] w-full max-w-3xl">
          <div className="flex items-center gap-2 border-b border-white/5 px-6 py-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <span className="ml-2 text-xs text-white/30">terminal</span>
          </div>

          <CardContent className="px-6 pb-6 font-mono text-sm leading-loose">
            <div className="text-white/30">
              <span className="text-[#5eead4]">$</span> beakcrypt init
            </div>
            <div className="text-white/40">
              <span className="text-[#5eead4]">→</span> Project detected:
              acme-app
            </div>
            <div className="text-white/40">
              <span className="text-[#22c55e]">✓</span> Vault created
              successfully
            </div>

            <div className="text-white/30">
              <span className="text-[#5eead4]">$</span> beakcrypt invite
              user@acme.com
            </div>
            <div className="text-white/40">
              <span className="text-[#22c55e]">✓</span> Invitation sent to
              user@acme.com
            </div>

            <div className="text-white/30">
              <span className="text-[#5eead4]">$</span> beakcrypt push
              .env.local
            </div>
            <div className="text-white/40">
              <span className="text-[#5eead4]">→</span> Encrypting 12
              variables...
            </div>
            <div className="text-white/40">
              <span className="text-[#22c55e]">✓</span> Synced to vault
            </div>
          </CardContent>
        </Card>
      </main>
    </section>
  );
}
