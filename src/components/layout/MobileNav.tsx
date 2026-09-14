"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, CheckSquare, MessageSquare, Menu } from "lucide-react";

interface MobileNavProps {
  onOpenDrawer: () => void;
}

export function MobileNav({ onOpenDrawer }: MobileNavProps) {
  const pathname = usePathname();

  const items = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Attendance", href: "/attendance", icon: MapPin, highlight: true },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Chat", href: "/communication", icon: MessageSquare },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-40 shadow-lg"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.highlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? "bg-brand-700 text-white ring-4 ring-brand-100"
                    : "bg-brand-600 text-white"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold text-brand-700 mt-1">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
              isActive ? "text-brand-700 font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-500 hover:text-slate-800"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">More</span>
      </button>
    </nav>
  );
}
