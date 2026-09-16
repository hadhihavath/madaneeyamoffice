"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DemoBar } from "./DemoBar";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { X, ShieldAlert } from "lucide-react";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Automatically prompt users logging in with default password
        if (data.user?.isDefaultPassword) {
          setChangePasswordOpen(true);
        }
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
          Loading CEEM Madaneeyam Office...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* 1-Click Role Switcher Demo Bar (Only in explicit demo mode) */}
      {process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" && (
        <DemoBar
          currentEmail={user?.email}
          onPersonaSwitched={() => {
            fetchSession();
            window.location.reload();
          }}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar user={user} onLogout={handleLogout} />
        </div>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar user={user} onLogout={handleLogout} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Default Password Notice Banner */}
          {user?.isDefaultPassword && (
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm z-20">
              <div className="flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-200 flex-shrink-0" />
                <span>
                  <strong>Security Alert:</strong> You are using the default temporary password (Password123!). Please create a personal password.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="px-3 py-1 bg-white text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-50 active:bg-amber-100 shadow-2xs transition-all"
              >
                Change Password Now
              </button>
            </div>
          )}

          <Header
            user={user}
            onToggleMobileMenu={() => setMobileDrawerOpen(true)}
            onOpenChangePassword={() => setChangePasswordOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        isMandatory={Boolean(user?.isDefaultPassword)}
        onPasswordChanged={() => {
          fetchSession();
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenDrawer={() => setMobileDrawerOpen(true)} />
    </div>
  );
}
