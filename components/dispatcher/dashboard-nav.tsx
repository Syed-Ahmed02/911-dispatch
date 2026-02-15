"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, PhoneCall, Radio } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/dashboard/queue", label: "Current Queue", icon: PhoneCall },
  { href: "/dashboard/simulator", label: "Call Simulator", icon: Radio },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2 sm:grid-cols-3">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-sm tracking-wide transition ${
              active
                ? "border-slate-400 bg-slate-200 text-slate-900"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
