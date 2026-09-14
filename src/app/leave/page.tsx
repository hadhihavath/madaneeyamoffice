"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

export default function LeavePage() {
  const [session, setSession] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);

  // Approval/Rejection action state
  const [actionTargetLeave, setActionTargetLeave] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [decisionNote, setDecisionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== "ALL") params.set("status", filterStatus);

      const res = await fetch(`/api/leave?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data.leaveRequests || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveType, startDate, endDate, reason }),
      });

      if (res.ok) {
        setShowApplyModal(false);
        setReason("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to apply leave");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyLoading(false);
    }
  };

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTargetLeave) return;
    setActionLoading(true);
    try {
      const endpoint =
        actionType === "APPROVE"
          ? `/api/leave/${actionTargetLeave.id}/approve`
          : `/api/leave/${actionTargetLeave.id}/reject`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionNote }),
      });

      if (res.ok) {
        setActionTargetLeave(null);
        setDecisionNote("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove =
    session && ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"].includes(session.role);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Leave & Absence Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit time-off requests, view approval balances, and process team applications
            </p>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Apply For Leave</span>
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-semibold text-amber-700 block">Pending Review</span>
            <span className="text-2xl font-black text-amber-900">{stats.pending || 0}</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-semibold text-emerald-700 block">Approved</span>
            <span className="text-2xl font-black text-emerald-900">{stats.approved || 0}</span>
          </div>
          <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80">
            <span className="text-[11px] font-semibold text-red-700 block">Rejected</span>
            <span className="text-2xl font-black text-red-900">{stats.rejected || 0}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 block">Total Requests</span>
            <span className="text-2xl font-black text-slate-800">{stats.total || 0}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
            <div className="flex gap-1">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === st
                      ? "bg-brand-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Office Branch</th>
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3">Date Range</th>
                  <th className="py-2.5 px-3">Days</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  {canApprove && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No leave requests found for this filter.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">
                          {req.employee?.firstName} {req.employee?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {req.employee?.department?.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {req.office?.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">
                          {req.leaveType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {req.startDate} to {req.endDate}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {req.totalDays}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="py-3 px-3 text-right">
                          {req.status === "PENDING" && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setActionTargetLeave(req);
                                  setActionType("APPROVE");
                                  setDecisionNote("Approved");
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                title="Approve Request"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setActionTargetLeave(req);
                                  setActionType("REJECT");
                                  setDecisionNote("Unavailable due to staffing requirement");
                                }}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                                title="Reject Request"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Apply Leave Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Apply For Leave
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Submit time-off application for manager & HR review.
              </p>

              <form onSubmit={handleApply} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="MATERNITY">Maternity / Paternity</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason & Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Brief explanation for leave request..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyLoading}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {applyLoading ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Process Approval/Rejection Modal */}
        {actionTargetLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {actionType === "APPROVE" ? "Approve" : "Reject"} Leave Application
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Employee: {actionTargetLeave.employee?.firstName} {actionTargetLeave.employee?.lastName} ({actionTargetLeave.startDate} to {actionTargetLeave.endDate})
              </p>

              <form onSubmit={handleProcessAction} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Decision Note / Comments
                  </label>
                  <textarea
                    rows={3}
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="Note to employee..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActionTargetLeave(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs disabled:opacity-50 ${
                      actionType === "APPROVE"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {actionLoading ? "Processing..." : `Confirm ${actionType === "APPROVE" ? "Approval" : "Rejection"}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
