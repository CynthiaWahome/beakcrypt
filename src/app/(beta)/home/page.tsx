import { Suspense } from "react";
import HomeHandler from "./handler";
import AppLoader from "~/components/loader";

export default function Home() {
  return (
    <Suspense fallback={<AppLoader />}>
      <HomeHandler />
    </Suspense>
  );
}
