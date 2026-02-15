"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, PhoneCall, Radio } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const tabs = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/dashboard/queue", label: "Current Queue", icon: PhoneCall },
  { href: "/dashboard/simulator", label: "Call Simulator", icon: Radio },
];

export function DashboardNav() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  return (
    <SidebarMenu>
      {tabs.map((tab) => {
        const active = isActiveRoute(tab.href);
        const Icon = tab.icon;

        return (
          <SidebarMenuItem key={tab.href}>
            <SidebarMenuButton
              isActive={active}
              render={<Link href={tab.href} />}
              className={`h-10 rounded-md border text-sm tracking-wide ${
                active
                  ? "border-slate-400 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
