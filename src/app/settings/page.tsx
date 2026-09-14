"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import {
  Settings as SettingsIcon,
  Building2,
  Sliders,
  Shield,
  Clock,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const [orgData, setOrgData] = useState<any | null>(null);
  const [radiuses, setRadiuses] = useState<Record<string, number>>({});
  const [workHours, setWorkHours] = useState(8);
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setOrgData(data.organization);
        const radMap: Record<string, number> = {};
        data.organization?.offices?.forEach((o: any) => {
          radMap[o.id] = o.attendanceRadius;
        });
        setRadiuses(radMap);
        if (data.settings?.defaultWorkHours) setWorkHours(data.settings.defaultWorkHours);
        if (data.settings?.checkInGraceMinutes) setGraceMinutes(data.settings.checkInGraceMinutes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const officeRadiuses = Object.entries(radiuses).map(([officeId, radius]) => ({
        officeId,
        radius,
      }));

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            defaultWorkHours: Number(workHours),
            checkInGraceMinutes: Number(graceMinutes),
          },
          officeRadiuses,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-brand-700" />
            System Governance & Attendance Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Super Administrator controls for organizational identity, work shifts, and branch geofences
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings and geofence parameters updated successfully! Audit log created.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Organization Identity Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-brand-600" />
              Organization Identity & Brand
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-44 h-20 bg-slate-50 rounded-xl p-2 border border-slate-200 flex items-center justify-center">
                <Image
                  src="/brand/logo_en.png"
                  alt="CEEM Madaneeyam Logo"
                  fill
                  sizes="176px"
                  className="object-contain p-2"
                />
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-800 block text-sm">
                  {orgData?.name || "CEEM Madaneeyam E-Learning"}
                </span>
                <span className="text-slate-500 block">
                  Slug: <code className="font-mono text-slate-700">ceem-madaneeyam</code>
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block">
                  Official high-resolution vector branding active across all modules
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Geofence Configuration per Office */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-600" />
                Office Attendance Geofence Radius Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set individual meter perimeters. Check-ins outside this distance are rejected by the Haversine calculator.
              </p>
            </div>

            <div className="space-y-3">
              {orgData?.offices?.map((office: any) => (
                <div
                  key={office.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {office.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">
                      ({office.code}) • Coords: {office.latitude}, {office.longitude}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600">
                      Allowed Radius:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="50"
                        max="500"
                        step="10"
                        value={radiuses[office.id] ?? office.attendanceRadius}
                        onChange={(e) =>
                          setRadiuses({
                            ...radiuses,
                            [office.id]: Number(e.target.value),
                          })
                        }
                        className="w-20 text-xs p-1.5 rounded-lg border border-slate-200 font-mono font-bold text-brand-800 text-center bg-white"
                      />
                      <span className="text-xs font-semibold text-slate-500">meters</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Work Hours & Policies */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-brand-600" />
              Work Shifts & Anti-Fraud Heuristics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Daily Standard Work Hours
                </label>
                <input
                  type="number"
                  min="4"
                  max="12"
                  value={workHours}
                  onChange={(e) => setWorkHours(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Late Check-in Grace Period (Minutes past 09:00 AM)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Updating System..." : "Save Configuration & Audit"}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
