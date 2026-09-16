"use client";

import React, { useState } from "react";
import { UserCheck, Shield, Users, Briefcase, User } from "lucide-react";

interface DemoBarProps {
  currentEmail?: string;
  onPersonaSwitched?: () => void;
}

export function DemoBar({ currentEmail, onPersonaSwitched }: DemoBarProps) {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  const personas = [
    {
      name: "Hadi Havath (Super Admin)",
      email: "hadihavath921@gmail.com",
      role: "SUPER_ADMIN",
      icon: Shield,
      color: "bg-purple-100 text-purple-800 border-purple-300",
      activeColor: "bg-purple-700 text-white shadow-sm",
    },
  ];

  const handleSwitch = async (email: string) => {
    if (loadingEmail || currentEmail === email) return;
    setLoadingEmail(email);
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        if (onPersonaSwitched) {
          onPersonaSwitched();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Demo switch failed:", err);
    } finally {
      setLoadingEmail(null);
    }
  };

  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "true") {
    return null;
  }

  return (
    <aside
      aria-label="Demo role switcher"
      className="bg-slate-900 border-b border-slate-800 text-xs px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-50 text-slate-300"
    >
      <div className="flex items-center gap-1.5 font-medium text-slate-300">
        <UserCheck className="w-3.5 h-3.5 text-brand-400" />
        <span className="hidden sm:inline">Role Switcher:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {personas.map((p) => {
          const isActive = currentEmail === p.email;
          const Icon = p.icon;
          const isLoading = loadingEmail === p.email;

          return (
            <button
              key={p.email}
              onClick={() => handleSwitch(p.email)}
              disabled={isLoading || isActive}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                isActive
                  ? p.activeColor
                  : "bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60"
              } ${isLoading ? "opacity-60 cursor-wait" : ""}`}
            >
              <Icon className="w-3 h-3" />
              <span>{p.name}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
