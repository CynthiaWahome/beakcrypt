import type { Metadata } from "next";
import { Suspense } from "react";
import HomeHandler from "./handler";
import AppLoader from "~/components/loader";

export const metadata: Metadata = {
  title: "Home - Beakcrypt",
  description: "Your Beakcrypt dashboard.",
};

export default function Home() {
  return (
    <Suspense fallback={<AppLoader />}>
      <HomeHandler />
    </Suspense>
  );
}
