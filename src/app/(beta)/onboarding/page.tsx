import OnboardingForm from "./form";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black/95 bg-grid-white/[0.02]">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      <div className="z-10 w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-transparent bg-clip-text bg-linear-to-br from-white to-zinc-500">
            Welcome to Beakcrypt
          </h1>
          <p className="text-zinc-400">
            Let&apos;s get your workspace ready. It only takes a few moments.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
}
