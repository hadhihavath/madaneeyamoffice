"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CheckSquare,
  Plus,
  Clock,
  User,
  Building2,
  FolderGit2,
  Calendar,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";

export default function TasksPage() {
  const [session, setSession] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [scope, setScope] = useState<"MY" | "DEPARTMENT" | "OFFICE" | "ALL">("MY");
  const [loading, setLoading] = useState(true);

  // New Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      const res = await fetch(`/api/tasks?scope=${scope}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }

      const empRes = await fetch("/api/employees");
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
    fetchTasks();
  }, [scope]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate,
          assignedToId: assignedToId || undefined,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "TODO", label: "To Do", bg: "border-slate-300" },
    { key: "IN_PROGRESS", label: "In Progress", bg: "border-blue-400" },
    { key: "REVIEW", label: "In Review", bg: "border-purple-400" },
    { key: "COMPLETED", label: "Completed", bg: "border-emerald-400" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Task Management Board
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize projects, assign duties, and monitor office milestones
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Scope Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200 text-xs font-semibold">
          {[
            { key: "MY", label: "My Tasks" },
            { key: "DEPARTMENT", label: "Department Tasks" },
            { key: "OFFICE", label: "Office Tasks" },
            { key: "ALL", label: "All Tasks" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setScope(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                scope === tab.key
                  ? "bg-white text-brand-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div
                key={col.key}
                className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 space-y-3"
              >
                <div className={`flex items-center justify-between pb-2 border-b-2 ${col.bg}`}>
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                    {col.label}
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[300px]">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      No tasks in this stage
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:shadow-md transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              task.priority === "URGENT"
                                ? "bg-red-100 text-red-700"
                                : task.priority === "HIGH"
                                ? "bg-amber-100 text-amber-700"
                                : task.priority === "MEDIUM"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {task.priority}
                          </span>

                          {/* Quick Status Dropdown */}
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                            className="text-[10px] py-0.5 px-1 rounded bg-slate-50 border border-slate-200 text-slate-600 cursor-pointer"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Review</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span>
                            {task.assignedTo
                              ? `${task.assignedTo.firstName} ${task.assignedTo.lastName.charAt(0)}.`
                              : "Unassigned"}
                          </span>
                          <span className="font-mono">
                            {task.dueDate ? `📅 ${task.dueDate}` : "No deadline"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Task Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Create New Task
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Assign work to office staff with priority and due date.
              </p>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Audit student curriculum files"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assign To Employee
                    </label>
                    <select
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Task"}
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
