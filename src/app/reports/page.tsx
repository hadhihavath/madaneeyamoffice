"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  BarChart3,
  Download,
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  Filter,
} from "lucide-react";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    window.open("/api/reports?format=csv", "_blank");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Reports & Executive Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Attendance ratios, branch utilization, and workforce performance telemetry
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export Attendance CSV</span>
          </button>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <span className="text-xs font-semibold text-slate-500 block">Total Active Offices</span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {reportData?.totalOffices || 0}
            </div>
            <span className="text-[11px] text-brand-700 font-semibold mt-1 block">
              Kerala regional headquarters & branches
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <span className="text-xs font-semibold text-slate-500 block">Organization Staff Count</span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {reportData?.totalEmployees || 0}
            </div>
            <span className="text-[11px] text-blue-700 font-semibold mt-1 block">
              Across 10 academic and technical departments
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <span className="text-xs font-semibold text-slate-500 block">Geofence Verified Records</span>
            <div className="text-3xl font-black text-brand-800 mt-1">
              {reportData?.totalAttendanceRecords || 0}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              100% server-side Haversine validated
            </span>
          </div>
        </div>

        {/* Office Performance Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Office-Wise Attendance Comparison & Performance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                  <th className="py-2.5 px-3">Branch Office</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Headcount</th>
                  <th className="py-2.5 px-3">Present Today</th>
                  <th className="py-2.5 px-3">Late Today</th>
                  <th className="py-2.5 px-3">Approved Leave</th>
                  <th className="py-2.5 px-3">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.officeMetrics?.map((m: any) => (
                  <tr key={m.officeId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {m.officeName}
                      <span className="text-[10px] text-slate-400 font-mono ml-2">
                        ({m.officeCode})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{m.city}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {m.employeeCount}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                      {m.presentCount}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-700 font-bold">
                      {m.lateCount}
                    </td>
                    <td className="py-3 px-3 font-mono text-blue-700 font-bold">
                      {m.leaveCount}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-brand-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(m.attendanceRate, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">
                          {m.attendanceRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
