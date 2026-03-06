"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const forgeTabs = [
  { label: "System", href: "/prototypes/idea-1/forge/system" },
  { label: "World", href: "/prototypes/idea-1/forge/world" },
  { label: "Campaign", href: "/prototypes/idea-1/forge/campaign" },
];

export function ForgeTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Forge sub navigation">
      {forgeTabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-amber-300/70 bg-amber-200/15 text-amber-100"
                : "border-slate-700/70 text-slate-200 hover:border-slate-500/80 hover:bg-slate-800/40",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
