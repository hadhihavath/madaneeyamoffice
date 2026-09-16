"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Shield, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

          {/* Quick Admin Access Bar (Only in explicit demo mode) */}
          {process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                1-Click Super Admin Access (Demo Mode)
              </span>
              <button
                type="button"
                onClick={() => handleQuickDemo("hadihavath921@gmail.com")}
                className="w-full p-2.5 text-left bg-purple-50/70 hover:bg-purple-100/80 hover:border-purple-300 border border-purple-200 rounded-xl transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-700" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-purple-900 block">
                      Hadi Havath
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold block">
                      hadihavath921@gmail.com
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900">
                  Super Admin
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
