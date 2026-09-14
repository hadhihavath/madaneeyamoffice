"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  Search,
  UserPlus,
  ArrowRightLeft,
  Filter,
  Building2,
  FolderGit2,
  Mail,
  Phone,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function EmployeesPage() {
  const [session, setSession] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterOffice, setFilterOffice] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newOfficeId, setNewOfficeId] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newRole, setNewRole] = useState("EMPLOYEE");
  const [createLoading, setCreateLoading] = useState(false);

  // Transfer Modal State
  const [transferTargetEmp, setTransferTargetEmp] = useState<any | null>(null);
  const [transferOfficeId, setTransferOfficeId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      const offRes = await fetch("/api/offices");
      if (offRes.ok) {
        const offData = await offRes.json();
        setOffices(offData.offices || []);
        if (offData.offices?.length > 0) {
          setNewOfficeId(offData.offices[0].id);
          setTransferOfficeId(offData.offices[0].id);
        }
      }

      const deptRes = await fetch("/api/departments");
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.departments || []);
        if (deptData.departments?.length > 0) {
          setNewDeptId(deptData.departments[0].id);
        }
      }

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterOffice && filterOffice !== "ALL") params.set("officeId", filterOffice);
      if (filterDept && filterDept !== "ALL") params.set("departmentId", filterDept);
      if (filterRole && filterRole !== "ALL") params.set("role", filterRole);

      const empRes = await fetch(`/api/employees?${params.toString()}`);
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterOffice, filterDept, filterRole]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail,
          phone: newPhone,
          designation: newDesignation,
          officeId: newOfficeId,
          departmentId: newDeptId,
          role: newRole,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewFirstName("");
        setNewLastName("");
        setNewEmail("");
        setNewPhone("");
        setNewDesignation("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create employee");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTransferEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetEmp || !transferOfficeId) return;
    setTransferLoading(true);
    try {
      const res = await fetch(`/api/employees/${transferTargetEmp.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetOfficeId: transferOfficeId,
          reason: transferReason,
        }),
      });

      if (res.ok) {
        setTransferTargetEmp(null);
        setTransferReason("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to transfer employee");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransferLoading(false);
    }
  };

  const canManage =
    session && ["SUPER_ADMIN", "ADMIN", "HR"].includes(session.role);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Employee Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-office staff management, profiles, and inter-office transfers
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, ID, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
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
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="HR">HR</option>
                <option value="OFFICE_MANAGER">OFFICE MANAGER</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-100 border border-brand-200 flex-shrink-0">
                      {emp.avatarUrl ? (
                        <Image
                          src={emp.avatarUrl}
                          alt={emp.firstName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-brand-700 text-sm">
                          {emp.firstName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <p className="text-[11px] text-brand-700 font-semibold">
                        {emp.designation}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {emp.employeeId}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      emp.user?.role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : emp.user?.role === "HR"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : emp.user?.role === "OFFICE_MANAGER"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {emp.user?.role?.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{emp.office?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.department?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/employees/${emp.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </Link>

                {canManage && (
                  <button
                    onClick={() => {
                      setTransferTargetEmp(emp);
                      const otherOffice = offices.find((o) => o.id !== emp.officeId);
                      if (otherOffice) setTransferOfficeId(otherOffice.id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1 transition-colors border border-amber-200/60"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Employee Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Add New Staff Member
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Assign employee to an office branch and department with role authorization.
              </p>

              <form onSubmit={handleCreateEmployee} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+91 98470 ..."
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Designation / Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    placeholder="e.g. Senior E-Learning Instructor"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Assigned Office
                    </label>
                    <select
                      value={newOfficeId}
                      onChange={(e) => setNewOfficeId(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                    >
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Department
                    </label>
                    <select
                      value={newDeptId}
                      onChange={(e) => setNewDeptId(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      System Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="OFFICE_MANAGER">OFFICE MANAGER</option>
                      <option value="HR">HR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {createLoading ? "Creating..." : "Save Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer Employee Modal */}
        {transferTargetEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Transfer Employee Office
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Transferring <strong>{transferTargetEmp.firstName} {transferTargetEmp.lastName}</strong> from <strong>{transferTargetEmp.office?.name}</strong>.
              </p>

              <form onSubmit={handleTransferEmployee} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Office
                  </label>
                  <select
                    value={transferOfficeId}
                    onChange={(e) => setTransferOfficeId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {offices
                      .filter((o) => o.id !== transferTargetEmp.officeId)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.city}) - Radius {o.attendanceRadius}m
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Reason / Justification (Audit Logged)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Branch expansion or employee relocation request"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTransferTargetEmp(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transferLoading}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {transferLoading ? "Transferring..." : "Confirm Transfer"}
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
