"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  ShieldCheck,
} from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [resourceType, setResourceType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (resourceType && resourceType !== "ALL") params.set("resourceType", resourceType);
      if (search) params.set("search", search);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [resourceType, search]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-purple-700" />
              Immutable System Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically timestamped audit records for all administrative, geofence, and employee mutations
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit actions, actors, reasons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800"
              >
                <option value="ALL">All Resource Types</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ATTENDANCE">ATTENDANCE</option>
                <option value="LEAVE">LEAVE</option>
                <option value="OFFICE">OFFICE</option>
                <option value="SETTINGS">SETTINGS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Authorized Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Details & Audit Log</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      No audit events recorded.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-bold text-slate-900 block">
                          {log.actorName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.actorEmail}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-bold">
                        {log.resourceType}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-700 max-w-md leading-relaxed text-xs">
                        {log.details}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
