import type { ReactNode } from "react";
import { IBM_Plex_Sans } from "next/font/google";
import { DashboardNav } from "@/components/dispatcher/dashboard-nav";
import { DispatchProvider } from "@/components/dispatcher/dispatch-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarToggle,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dashboard-body",
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DispatchProvider>
      <SidebarProvider defaultOpen>
        <div
          className={`${plexSans.variable} min-h-screen bg-emerald-50/80 text-slate-900`}
          style={{ fontFamily: "var(--font-dashboard-body)" }}
        >
          <div className="pointer-events-none fixed inset-0 opacity-60 [background:radial-gradient(circle_at_10%_8%,rgba(16,185,129,.06),transparent_34%),radial-gradient(circle_at_82%_4%,rgba(16,185,129,.04),transparent_30%)]" />
          <div className="pointer-events-none fixed inset-0 opacity-20 [background-image:linear-gradient(rgba(16,185,129,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,.12)_1px,transparent_1px)] [background-size:40px_40px]" />

          <div className="relative z-10 flex min-h-screen w-full">
            <Sidebar className="border-r border-emerald-200 bg-white/95 backdrop-blur"  >
              <SidebarHeader className="border-b border-emerald-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                      City Ops Grid
                    </p>
                    <h1 className="text-xl tracking-[0.08em] text-slate-900">
                      911 Dispatch Center
                    </h1>
                    <p className="text-xs text-slate-500">
                      AI Voice Operations Dashboard
                    </p>
                  </div>
                  <SidebarToggle className="shrink-0 text-emerald-700 hover:bg-emerald-100 hover:text-slate-900" />
                </div>
              </SidebarHeader>
              <SidebarContent className="p-2">
                <SidebarGroup>
                  <SidebarGroupLabel>Dashboard Views</SidebarGroupLabel>
                  <DashboardNav />
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>

            <SidebarInset className="min-w-0 bg-transparent md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-6 md:px-6 lg:px-8">
                <header className="mb-6 rounded-2xl border border-emerald-200 bg-white/95 p-5 shadow-[0_16px_36px_rgba(16,185,129,.06)] backdrop-blur">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-emerald-100 pb-4">
                    <div className="flex items-start gap-3">
                      <SidebarTrigger className="mt-1 border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">
                          City Ops Grid
                        </p>
                        <h2 className="mt-1 text-2xl tracking-[0.08em] text-slate-900 md:text-3xl">
                          911 Dispatch
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          AI Voice Operations
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs uppercase tracking-[0.14em] text-emerald-800">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                </header>
                <main className="flex min-w-0 flex-1 flex-col">{children}</main>
              </div>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </DispatchProvider>
  );
}
