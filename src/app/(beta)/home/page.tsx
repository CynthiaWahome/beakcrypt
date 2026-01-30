import Nav from "~/components/home/nav";
import Hero from "~/components/home/hero";
import Footer from "~/components/home/footer";
import Features from "~/components/home/features";
import TrustedBy from "~/components/home/trusted-by";
import HowItWorks from "~/components/home/how-it-works";
import CallToAction from "~/components/home/call-to-action";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#fafafa]">
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

      <Nav />
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <CallToAction />
      <Footer />
    </div>
  );
}
