import { api } from "conv/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";

export default async function OrganizationHandler({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  const organization = await fetchQuery(api.organizations.getBySlug, { slug });

  if (!organization) {
    return notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black selection:bg-zinc-800">
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#222_1px,transparent_1px)] bg-size:[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      <div className="z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <h1 className="text-5xl font-extrabold tracking-tighter sm:text-7xl">
          <span className="bg-linear-to-b from-white to-white/60 bg-clip-text text-transparent">
            {organization.name}
          </span>
        </h1>
      </div>

      <div className="z-10 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 ease-out fill-mode-backwards">
        <div className="rounded-full bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-500 ring-1 ring-zinc-800 backdrop-blur-md">
          /{organization.slug}
        </div>
      </div>
    </div>
  );
}
