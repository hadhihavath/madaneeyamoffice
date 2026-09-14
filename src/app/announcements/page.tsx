"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Megaphone,
  Plus,
  Pin,
  Calendar,
  Building2,
  FolderGit2,
  Users,
  AlertTriangle,
} from "lucide-react";

export default function AnnouncementsPage() {
  const [session, setSession] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [targetAudience, setTargetAudience] = useState("EVERYONE");
  const [officeId, setOfficeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }

      const offRes = await fetch("/api/offices");
      if (offRes.ok) {
        const offData = await offRes.json();
        setOffices(offData.offices || []);
        if (offData.offices?.length > 0) setOfficeId(offData.offices[0].id);
      }

      const deptRes = await fetch("/api/departments");
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.departments || []);
        if (deptData.departments?.length > 0) setDepartmentId(deptData.departments[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          priority,
          targetAudience,
          officeId: targetAudience === "SPECIFIC_OFFICE" ? officeId : undefined,
          departmentId: targetAudience === "SPECIFIC_DEPARTMENT" ? departmentId : undefined,
          isPinned,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle("");
        setContent("");
        setIsPinned(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate =
    session && ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"].includes(session.role);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Company & Office Announcements
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official bulletins, executive communications, and regional branch advisories
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Announcement</span>
            </button>
          )}
        </div>

        {/* Announcements Stream */}
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border p-5 shadow-soft transition-all ${
                ann.isPinned ? "border-brand-200 bg-brand-50/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.isPinned && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ann.priority === "URGENT"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : ann.priority === "IMPORTANT"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Audience: <strong>{ann.targetAudience.replace("_", " ")}</strong>
                    {ann.office && ` (${ann.office.name})`}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(ann.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {ann.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Published by:{" "}
                  <strong>
                    {ann.author?.employee
                      ? `${ann.author.employee.firstName} ${ann.author.employee.lastName}`
                      : "System Administration"}
                  </strong>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Publish Announcement
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Distribute information across all offices or targeted branches.
              </p>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Schedule for Academic Workshops"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Announcement Message Content
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Full announcement body..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="IMPORTANT">IMPORTANT</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Audience Scope
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="EVERYONE">Everyone (All Branches)</option>
                      <option value="SPECIFIC_OFFICE">Specific Office</option>
                      <option value="SPECIFIC_DEPARTMENT">Specific Department</option>
                    </select>
                  </div>
                </div>

                {targetAudience === "SPECIFIC_OFFICE" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Office
                    </label>
                    <select
                      value={officeId}
                      onChange={(e) => setOfficeId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pin"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="pin" className="text-xs font-semibold text-slate-700">
                    Pin announcement to the top of dashboard and feed
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {submitting ? "Publishing..." : "Publish Now"}
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
