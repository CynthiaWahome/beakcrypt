import { ReactNode, Suspense } from "react";
import AppSidebar from "~/components/app/sidebar";
import DeviceKeyProvider from "~/components/app/device-key-provider";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={null}>
          <DeviceKeyProvider />
        </Suspense>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
