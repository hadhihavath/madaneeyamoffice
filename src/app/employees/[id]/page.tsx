"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Building2,
  FolderGit2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  CheckSquare,
  FileText,
  Activity,
  ArrowLeft,
  Shield,
  Edit,
} from "lucide-react";

export default function EmployeeProfilePage() {
  const params = useParams();
  const employeeId = params?.id as string;

  const [employee, setEmployee] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "ATTENDANCE" | "LEAVE" | "TASKS" | "DOCUMENTS" | "ACTIVITY"
  >("OVERVIEW");

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await fetch(`/api/employees/${employeeId}`);
        if (res.ok) {
          const data = await res.json();
          setEmployee(data.employee);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) fetchEmployee();
  }, [employeeId]);

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 text-center text-xs text-slate-500">
          Loading profile...
        </div>
      </AppShell>
    );
  }

  if (!employee) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-3">
          <p className="text-sm font-bold text-slate-800">Employee not found.</p>
          <Link
            href="/employees"
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            ← Back to directory
          </Link>
        </div>
      </AppShell>
    );
  }

  const tabs = [
    { key: "OVERVIEW", label: "Overview", icon: Building2 },
    { key: "ATTENDANCE", label: "Attendance", icon: MapPin },
    { key: "LEAVE", label: "Leave Requests", icon: Calendar },
    { key: "TASKS", label: "Assigned Tasks", icon: CheckSquare },
    { key: "DOCUMENTS", label: "Documents", icon: FileText },
    { key: "ACTIVITY", label: "Activity Trail", icon: Activity },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Back Link */}
        <Link
          href="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employees</span>
        </Link>

        {/* Profile Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 relative" />

          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
              <div className="flex items-end gap-4">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white p-1 border-4 border-white shadow-md flex-shrink-0">
                  {employee.avatarUrl ? (
                    <Image
                      src={employee.avatarUrl}
                      alt={employee.firstName}
                      fill
                      sizes="96px"
                      className="object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 text-xl rounded-xl">
                      {employee.firstName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {employee.firstName} {employee.lastName}
                    </h1>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                      {employee.user?.role?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-brand-700 mt-0.5">
                    {employee.designation}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {employee.employeeId} • Office: {employee.office?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                  Status: {employee.employmentStatus}
                </span>
              </div>
            </div>

            {/* Tabs Header */}
            <div className="flex flex-wrap gap-1 mt-6 border-b border-slate-100 pt-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
                      isActive
                        ? "border-brand-600 text-brand-700 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
          {activeTab === "OVERVIEW" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm mb-2">
                  Official Details
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee ID:</span>
                    <span className="font-mono font-semibold">{employee.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold">{employee.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-semibold">{employee.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Joining Date:</span>
                    <span className="font-semibold">
                      {new Date(employee.joiningDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm mb-2">
                  Office & Geofence
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Office Branch:</span>
                    <span className="font-semibold">{employee.office?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Office Location:</span>
                    <span className="font-semibold">{employee.office?.city}, Kerala</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Geofence Radius:</span>
                    <span className="font-semibold text-brand-700">
                      {employee.office?.attendanceRadius} meters
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-semibold">{employee.department?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ATTENDANCE" && (
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">
                Recent Attendance Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Check In</th>
                      <th className="py-2 px-3">Check Out</th>
                      <th className="py-2 px-3">Working Time</th>
                      <th className="py-2 px-3">Distance</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employee.attendances?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No attendance records.
                        </td>
                      </tr>
                    ) : (
                      employee.attendances?.map((att: any) => (
                        <tr key={att.id}>
                          <td className="py-2.5 px-3 font-semibold">{att.date}</td>
                          <td className="py-2.5 px-3 font-mono">
                            {att.checkInTime
                              ? new Date(att.checkInTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--:--"}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {att.checkOutTime
                              ? new Date(att.checkOutTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--:--"}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {att.workDurationMinutes
                              ? `${Math.floor(att.workDurationMinutes / 60)}h ${att.workDurationMinutes % 60}m`
                              : "--"}
                          </td>
                          <td className="py-2.5 px-3">
                            {att.distanceMeters !== null
                              ? `${Math.round(att.distanceMeters)}m`
                              : "N/A"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {att.status}
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

          {activeTab === "LEAVE" && (
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">
                Leave Request History
              </h3>
              <div className="space-y-2">
                {employee.leaveRequests?.length === 0 ? (
                  <p className="text-slate-400 py-4">No leave requests on record.</p>
                ) : (
                  employee.leaveRequests?.map((lv: any) => (
                    <div
                      key={lv.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {lv.leaveType} Leave ({lv.totalDays} Days)
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          {lv.startDate} to {lv.endDate} • {lv.reason}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {lv.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "TASKS" && (
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">Assigned Tasks</h3>
              <div className="space-y-2">
                {employee.assignedTasks?.length === 0 ? (
                  <p className="text-slate-400 py-4">No tasks assigned currently.</p>
                ) : (
                  employee.assignedTasks?.map((tsk: any) => (
                    <div
                      key={tsk.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{tsk.title}</div>
                        <p className="text-slate-500 mt-0.5">{tsk.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                        {tsk.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "DOCUMENTS" && (
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">Employee Files & IDs</h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-brand-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Employment Verification & Office Contract.pdf
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Verified & Signed • 1.4 MB
                    </span>
                  </div>
                </div>
                <a
                  href="/brand/Madaneeyam_Logo.pdf"
                  target="_blank"
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  Download
                </a>
              </div>
            </div>
          )}

          {activeTab === "ACTIVITY" && (
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">Milestones & History</h3>
              <div className="border-l-2 border-slate-200 pl-4 space-y-4 py-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(employee.joiningDate).toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-slate-800">
                    Joined CEEM Madaneeyam E-Learning as {employee.designation}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Assigned to {employee.office?.name}
                  </span>
                  <span className="font-semibold text-slate-800">
                    Geofenced office perimeter active (radius {employee.office?.attendanceRadius}m)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
