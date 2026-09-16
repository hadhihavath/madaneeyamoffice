"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AttendanceWidget } from "@/components/attendance/AttendanceWidget";
import {
  MapPin,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  Edit,
  Download,
  FileSpreadsheet,
} from "lucide-react";

export default function AttendancePage() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"MY" | "ADMIN">("MY");
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>({});
  const [adminRecords, setAdminRecords] = useState<any[]>([]);
  const [adminSummary, setAdminSummary] = useState<any>({});
  const [offices, setOffices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterOffice, setFilterOffice] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal
  const [editModalRecord, setEditModalRecord] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("PRESENT");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchSessionAndInit = async () => {
    try {
      const [meRes, offRes, deptRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/offices"),
        fetch("/api/departments"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
        if (["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"].includes(meData.user?.role)) {
          setActiveTab("ADMIN");
        }
      }

      if (offRes.ok) {
        const offData = await offRes.json();
        setOffices(offData.offices || []);
      }

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.departments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyHistory = async () => {
    try {
      const res = await fetch("/api/attendance/my");
      if (res.ok) {
        const data = await res.json();
        setMyHistory(data.history || []);
        setMyStats(data.stats || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (filterOffice && filterOffice !== "ALL") params.set("officeId", filterOffice);
      if (filterDept && filterDept !== "ALL") params.set("departmentId", filterDept);
      if (filterStatus && filterStatus !== "ALL") params.set("status", filterStatus);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAdminRecords(data.attendances || []);
        setAdminSummary(data.summary || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessionAndInit();
    fetchMyHistory();
  }, []);

  useEffect(() => {
    if (activeTab === "ADMIN") {
      fetchAdminRecords();
    }
  }, [activeTab, filterDate, filterOffice, filterDept, filterStatus, searchQuery]);

  const handleSaveCorrection = async () => {
    if (!editModalRecord) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: editModalRecord.id,
          status: editStatus,
          notes: editNotes,
        }),
      });

      if (res.ok) {
        setEditModalRecord(null);
        fetchAdminRecords();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const canViewAdminTab =
    session &&
    ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"].includes(session.role);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Location-Based Attendance Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict Haversine GPS geofence validation for multi-office staff
            </p>
          </div>

          {/* Tab Switcher */}
          {canViewAdminTab && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("MY")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "MY"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                My Attendance
              </button>
              <button
                onClick={() => setActiveTab("ADMIN")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "ADMIN"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Admin Review Panel
              </button>
            </div>
          )}
        </div>

        {/* 1-Tap Geofence Attendance Widget */}
        <AttendanceWidget
          user={session}
          onAttendanceChanged={() => {
            fetchMyHistory();
            if (activeTab === "ADMIN") fetchAdminRecords();
          }}
        />

        {/* Personal History Tab */}
        {activeTab === "MY" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  My Recent Attendance History (Last 30 Days)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Summary: {myStats.presentCount || 0} Present • {myStats.lateCount || 0} Late • {myStats.leaveCount || 0} On Leave
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Office Location</th>
                    <th className="py-2.5 px-3">Check In</th>
                    <th className="py-2.5 px-3">Check Out</th>
                    <th className="py-2.5 px-3">Working Duration</th>
                    <th className="py-2.5 px-3">Distance Recorded</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No previous attendance records found.
                      </td>
                    </tr>
                  ) : (
                    myHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {rec.date}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {rec.office?.name || "Assigned Office"}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {rec.checkInTime
                            ? new Date(rec.checkInTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {rec.checkOutTime
                            ? new Date(rec.checkOutTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {rec.workDurationMinutes
                            ? `${Math.floor(rec.workDurationMinutes / 60)}h ${rec.workDurationMinutes % 60}m`
                            : "--"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {rec.distanceMeters !== null
                            ? `${Math.round(rec.distanceMeters)}m`
                            : "N/A"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : rec.status === "LATE"
                                ? "bg-amber-100 text-amber-800"
                                : rec.status === "LEAVE"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Review Tab */}
        {activeTab === "ADMIN" && canViewAdminTab && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5 space-y-4">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Office Branch
                </label>
                <select
                  value={filterOffice}
                  onChange={(e) => setFilterOffice(e.target.value)}
                  disabled={session?.role === "OFFICE_MANAGER"}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                >
                  <option value="ALL">All Offices</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Department
                </label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="LEAVE">LEAVE</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="SUSPICIOUS">SUSPICIOUS</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Search Staff
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name/ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar for Selected Date */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 block">Total Staff</span>
                <span className="text-sm font-bold text-slate-800">
                  {adminSummary.totalRecords || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-700 block">Present</span>
                <span className="text-sm font-bold text-emerald-800">
                  {adminSummary.present || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
                <span className="text-[10px] text-amber-700 block">Late</span>
                <span className="text-sm font-bold text-amber-800">
                  {adminSummary.late || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
                <span className="text-[10px] text-blue-700 block">On Leave</span>
                <span className="text-sm font-bold text-blue-800">
                  {adminSummary.leave || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-center">
                <span className="text-[10px] text-red-700 block">Suspicious Flags</span>
                <span className="text-sm font-bold text-red-800">
                  {adminSummary.suspicious || 0}
                </span>
              </div>
            </div>

            {/* Admin Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Office Branch</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Check In</th>
                    <th className="py-2.5 px-3">Check Out</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Distance</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No attendance records matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    adminRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {item.employee.firstName} {item.employee.lastName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.employee.employeeId}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {item.office.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.employee.department?.name}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {item.checkInTime
                            ? new Date(item.checkInTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {item.checkOutTime
                            ? new Date(item.checkOutTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {item.workDurationMinutes
                            ? `${Math.floor(item.workDurationMinutes / 60)}h ${item.workDurationMinutes % 60}m`
                            : "--"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.distanceMeters !== null
                            ? `${Math.round(item.distanceMeters)}m`
                            : "N/A"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "LATE"
                                ? "bg-amber-100 text-amber-800"
                                : item.status === "LEAVE"
                                ? "bg-blue-100 text-blue-800"
                                : item.status === "SUSPICIOUS"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.modifiedByAdmin && (
                            <span className="block text-[9px] text-purple-600 font-medium mt-0.5">
                              Admin Adjusted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setEditModalRecord(item);
                              setEditStatus(item.status);
                              setEditNotes(item.notes || "");
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 transition-colors"
                            title="Review / Adjust Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Correction Modal */}
        {editModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Administrative Attendance Adjustment
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Adjust record for {editModalRecord.employee.firstName} {editModalRecord.employee.lastName} on {editModalRecord.date}. Every modification creates an immutable audit log.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="HALF_DAY">HALF DAY</option>
                    <option value="REMOTE">REMOTE</option>
                    <option value="LEAVE">LEAVE</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Audit Note / Reason for Adjustment
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Employee was on sanctioned official field duty."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditModalRecord(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  disabled={editLoading}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save & Audit Log"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
