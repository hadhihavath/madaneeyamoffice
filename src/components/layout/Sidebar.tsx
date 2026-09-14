"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Building2,
  FolderGit2,
  CalendarDays,
  CheckSquare,
  MessageSquare,
  Megaphone,
  Calendar,
  FileText,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const role = user?.role || "EMPLOYEE";
  const isEmployee = role === "EMPLOYEE";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdminOrHR = role === "ADMIN" || role === "HR" || isSuperAdmin;
  const isOfficeManager = role === "OFFICE_MANAGER";

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: MapPin,
      badge: "GPS",
      show: true,
    },
    {
      name: "Employees",
      href: "/employees",
      icon: Users,
      show: isAdminOrHR || isOfficeManager,
    },
    {
      name: "Offices & Map",
      href: "/offices",
      icon: Building2,
      show: isAdminOrHR || isOfficeManager,
    },
    {
      name: "Departments",
      href: "/departments",
      icon: FolderGit2,
      show: isAdminOrHR,
    },
    {
      name: "Leave Requests",
      href: "/leave",
      icon: CalendarDays,
      show: true,
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      show: true,
    },
    {
      name: "Communication",
      href: "/communication",
      icon: MessageSquare,
      show: true,
    },
    {
      name: "Announcements",
      href: "/announcements",
      icon: Megaphone,
      show: true,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: Calendar,
      show: true,
    },
    {
      name: "Documents",
      href: "/documents",
      icon: FileText,
      show: true,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      show: isAdminOrHR || isOfficeManager,
    },
    {
      name: "Audit Logs",
      href: "/audit-logs",
      icon: ShieldAlert,
      show: isSuperAdmin || role === "ADMIN",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      show: isSuperAdmin,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 select-none">
      {/* Brand Header with Exact CEEM Madaneeyam Logo */}
      <div className="p-4 border-b border-slate-100 flex flex-col items-center text-center bg-white">
        <Link href="/" className="group flex flex-col items-center transition-opacity hover:opacity-95">
          <div className="relative w-44 h-16 mb-1">
            <Image
              src="/brand/logo_en.png"
              alt="CEEM Madaneeyam E-Learning"
              fill
              sizes="176px"
              priority
              className="object-contain"
            />
          </div>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60 mt-1">
            CEEM MADANEEYAM OFFICE
          </div>
          <span className="text-[10px] text-brandgray-500 mt-0.5 font-medium">
            Office Management & Communication
          </span>
        </Link>
      </div>

      {/* Office & User Scoping Badge */}
      {user?.employee?.office && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
            <Building2 className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
            <span className="truncate">{user.employee.office.name}</span>
          </div>
          <span className="text-[10px] uppercase font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            {user.employee.office.code}
          </span>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-brand-50 text-brand-800 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-brand-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-brand-100 border border-brand-200 flex-shrink-0">
            {user?.employee?.avatarUrl ? (
              <Image
                src={user.employee.avatarUrl}
                alt={user.name || "User"}
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-brand-700 text-xs">
                {(user?.name || "U").charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {user?.employee?.designation || user?.role}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
