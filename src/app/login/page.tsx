"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Shield, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ceem.edu");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/");
      } else {
        setError(data.error || "Invalid credentials.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail }),
      });
      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to switch persona.");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left Brand Showcase Section */}
      <div className="lg:w-1/2 bg-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-r border-slate-200">
        <div>
          {/* Official Brand Logo */}
          <div className="relative w-64 h-24 mb-6">
            <Image
              src="/brand/logo_en.png"
              alt="CEEM Madaneeyam E-Learning"
              fill
              sizes="256px"
              priority
              className="object-contain object-left"
            />
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200/60 mb-4">
            CEEM MADANEEYAM OFFICE
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Office Management & Communication System
          </h1>

          <p className="text-sm text-slate-600 mt-4 leading-relaxed max-w-md">
            The unified enterprise platform for CEEM Madaneeyam E-Learning to manage
            multi-office operations, location-based geofenced attendance, staff collaboration, and administrative governance.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="my-8 space-y-3">
          {[
            "Multi-Office Isolation (Kozhikode, Malappuram, Kannur, Kochi, Wayanad)",
            "Strict Server-side Haversine GPS Geofencing (100m / 150m)",
            "Integrated Team Chat, Direct Messages & Announcements",
            "Leave Requests, Task Board, Document Vault & Audit Trail",
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          © 2026 CEEM Madaneeyam E-Learning. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-200 shadow-soft">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with your organization account to continue
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800"
                  placeholder="name@ceem.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick 1-Click Demo Personas
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("admin@ceem.edu")}
                className="p-2 text-left bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <span className="text-[11px] font-bold text-slate-800 group-hover:text-purple-800 block truncate">
                  Dr. Havath
                </span>
                <span className="text-[10px] text-purple-700 font-semibold block">
                  Super Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("hr@ceem.edu")}
                className="p-2 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-800 block truncate">
                  Fatima Zahra
                </span>
                <span className="text-[10px] text-blue-700 font-semibold block">
                  HR Manager
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("kozhikode.manager@ceem.edu")}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <span className="text-[11px] font-bold text-slate-800 group-hover:text-amber-800 block truncate">
                  Tariq Al-Mansoor
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block">
                  Kozhikode Mgr
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("ahmed.employee@ceem.edu")}
                className="p-2 text-left bg-slate-50 hover:bg-brand-50 hover:border-brand-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <span className="text-[11px] font-bold text-slate-800 group-hover:text-brand-800 block truncate">
                  Ahmed Farooqui
                </span>
                <span className="text-[10px] text-brand-700 font-semibold block">
                  Employee (Dev)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
