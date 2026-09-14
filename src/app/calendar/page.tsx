"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Calendar as CalendarIcon,
  Plus,
  Building2,
  Clock,
  MapPin,
} from "lucide-react";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [filterOffice, setFilterOffice] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Add Event Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("MEETING");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/calendar?officeId=${filterOffice === "ALL" ? "" : filterOffice}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }

      const offRes = await fetch("/api/offices");
      if (offRes.ok) {
        const offData = await offRes.json();
        setOffices(offData.offices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filterOffice]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          eventType,
          startDate,
          startTime,
          location,
          officeId: selectedOfficeId || undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle("");
        setDescription("");
        setStartDate("");
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Shared Organization Calendar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Coordinated academic reviews, branch workshops, deadlines, and state holidays
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Filter Office:</span>
            <select
              value={filterOffice}
              onChange={(e) => setFilterOffice(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="ALL">All Branches & Organization-wide</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      ev.eventType === "HOLIDAY"
                        ? "bg-purple-100 text-purple-800"
                        : ev.eventType === "TRAINING"
                        ? "bg-blue-100 text-blue-800"
                        : ev.eventType === "DEADLINE"
                        ? "bg-red-100 text-red-800"
                        : "bg-brand-100 text-brand-800"
                    }`}
                  >
                    {ev.eventType}
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-700">
                    {ev.startDate}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
                  {ev.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {ev.description || "No additional description."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ev.startTime ? `${ev.startTime} - ${ev.endTime || "TBD"}` : "All Day"}</span>
                </div>
                {ev.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ev.office ? ev.office.name : "All CEEM Offices"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Create Calendar Event
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Schedule meetings, workshops, or holidays.
              </p>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Q4 Platform Demonstration"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Event Type
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="MEETING">Meeting</option>
                      <option value="TRAINING">Training</option>
                      <option value="HOLIDAY">Holiday</option>
                      <option value="OFFICE_EVENT">Office Event</option>
                      <option value="DEADLINE">Deadline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Branch Scope
                    </label>
                    <select
                      value={selectedOfficeId}
                      onChange={(e) => setSelectedOfficeId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="">All Offices</option>
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date
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
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / Link
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Conference Room B / Video Conference"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800"
                  />
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
                    {submitting ? "Saving..." : "Save Event"}
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
