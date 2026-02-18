import type { Metadata } from "next";
import Link from "next/link";
import WaitlistForm from "./form";
import { Github } from "lucide-react";
import AnimatedTerminal from "./terminal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export const metadata: Metadata = {
  title: "Join the Waitlist - Beakcrypt",
  description:
    "Be first to join the vault. The open-source standard for managing and sharing environment variables securely.",
};

export default function WaitlistPage() {
  return (
    <section className="flex flex-col items-center justify-between gap-5 min-h-screen w-full">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center border border-[#5eead4]/50">
            <div className="h-2 w-2 rotate-45 bg-[#5eead4]" />
          </div>
          <span className="text-sm font-medium tracking-tight">beakcrypt</span>
        </Link>

        <Button variant="outline" asChild>
          <Link href="https://github.com/prudentbird/beakcrypt" target="_blank">
            <Github className="h-4 w-4" />
            Star on GitHub
          </Link>
        </Button>
      </nav>

      <main className="flex flex-col items-center gap-10 px-6">
        <div className="flex flex-col items-center w-full gap-4">
          <Badge
            variant="outline"
            className="gap-2 border-[#5eead4]/20 bg-[#5eead4]/5 px-4 py-1.5 text-[#5eead4]"
          >
            Join The Waitlist
          </Badge>

          <h1 className="font-serif text-5xl text-center font-medium leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            Be First to join the <span className="text-[#5eead4]">Vault</span>
          </h1>

          <p className="max-w-xl text-center text-lg lg:text-xl leading-relaxed text-white/50">
            The open-source standard for managing and sharing environment
            variables securely across your entire development workflow.
          </p>
          <WaitlistForm />
        </div>

        <AnimatedTerminal />
      </main>

      <footer className="w-full py-6 text-center text-sm text-white/50">
        Made with ❤️ by{" "}
        <Link
          target="_blank"
          href="https://prudentbird.com"
          className="text-white/50 hover:text-[#5eead4] transition-colors underline"
        >
          prudentbird
        </Link>
      </footer>
    </section>
  );
}
