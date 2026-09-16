"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AttendanceWidget } from "@/components/attendance/AttendanceWidget";
import { OfficeMap } from "@/components/map/OfficeMap";
import {
  Users,
  UserCheck,
  CalendarDays,
  UserX,
  Clock,
  Building2,
  CheckSquare,
  Megaphone,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [offices, setOffices] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 1,
    presentToday: 0,
    onLeave: 0,
    absent: 0,
    lateToday: 0,
    activeOffices: 1,
  });

  const loadData = async () => {
    try {
      // Parallelize all requests to eliminate waterfall delay
      const [meRes, officeRes, annRes, taskRes, calRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/offices"),
        fetch("/api/announcements"),
        fetch("/api/tasks?scope=MY"),
        fetch("/api/calendar"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      if (officeRes.ok) {
        const officeData = await officeRes.json();
        const officeList = officeData.offices || [];
        setOffices(officeList);

        const totalEmps = officeList.reduce(
          (acc: number, o: any) => acc + (o.totalEmployees || 0),
          0
        );
        const totalPres = officeList.reduce(
          (acc: number, o: any) => acc + (o.presentCount || 0),
          0
        );
        setSummaryStats((prev) => ({
          ...prev,
          totalEmployees: totalEmps || prev.totalEmployees,
          presentToday: totalPres || prev.presentToday,
          activeOffices: officeList.length,
        }));
      }

      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData.announcements?.slice(0, 3) || []);
      }

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData.tasks?.slice(0, 4) || []);
      }

      if (calRes.ok) {
        const calData = await calRes.json();
        setEvents(calData.events?.slice(0, 3) || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statsCards = [
    {
      title: "Total Employees",
      value: summaryStats.totalEmployees,
      label: "Across all offices",
      icon: Users,
      color: "text-slate-800",
      bg: "bg-slate-50 border-slate-200",
      iconColor: "text-slate-600",
    },
    {
      title: "Present Today",
      value: summaryStats.presentToday,
      label: "Recorded attendance",
      icon: UserCheck,
      color: "text-brand-800",
      bg: "bg-emerald-50/70 border-emerald-200/80",
      iconColor: "text-brand-600",
    },
    {
      title: "On Leave",
      value: summaryStats.onLeave,
      label: "Approved time off",
      icon: CalendarDays,
      color: "text-blue-800",
      bg: "bg-blue-50/70 border-blue-200/80",
      iconColor: "text-blue-600",
    },
    {
      title: "Absent",
      value: summaryStats.absent,
      label: "Unaccounted today",
      icon: UserX,
      color: "text-amber-800",
      bg: "bg-amber-50/70 border-amber-200/80",
      iconColor: "text-amber-600",
    },
    {
      title: "Late Today",
      value: summaryStats.lateToday,
      label: "After 09:15 AM",
      icon: Clock,
      color: "text-orange-800",
      bg: "bg-orange-50/70 border-orange-200/80",
      iconColor: "text-orange-600",
    },
    {
      title: "Active Offices",
      value: summaryStats.activeOffices,
      label: "Kerala regional branches",
      icon: Building2,
      color: "text-purple-800",
      bg: "bg-purple-50/70 border-purple-200/80",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
              {session?.employee?.office?.name || "Global Headquarters"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Welcome back, {session?.employee?.firstName || session?.name || "Colleague"} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Here is your multi-office operational snapshot for today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/attendance"
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Attendance Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${card.bg} shadow-xs flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    {card.title}
                  </span>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <div>
                  <div className={`text-2xl font-black ${card.color} tracking-tight`}>
                    {card.value}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {card.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Geofenced Attendance Widget */}
        <AttendanceWidget user={session} onAttendanceChanged={loadData} />

        {/* Multi-Office Interactive Map */}
        {offices.length > 0 && <OfficeMap offices={offices} />}

        {/* Two-Column Collaboration Section: Announcements & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Announcements Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-brand-600" />
                Company & Office Announcements
              </h3>
              <Link
                href="/announcements"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  No announcements at this time.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {ann.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                          ann.priority === "URGENT"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : ann.priority === "IMPORTANT"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Audience: {ann.targetAudience.replace("_", " ")}</span>
                      <span>
                        {new Date(ann.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Tasks Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-600" />
                Active Assigned Tasks
              </h3>
              <Link
                href="/tasks"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  All caught up! No pending tasks assigned.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3 hover:border-slate-200 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span>Due: {task.dueDate || "No deadline"}</span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            task.priority === "URGENT"
                              ? "text-red-600"
                              : task.priority === "HIGH"
                              ? "text-amber-600"
                              : "text-slate-600"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Events / Shared Calendar Highlights */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              Upcoming Academic & Organization Events
            </h3>
            <Link
              href="/calendar"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Full Calendar →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 text-brand-800 inline-block mb-1.5">
                    {ev.eventType}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {ev.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {ev.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                  <span>📅 {ev.startDate}</span>
                  <span>{ev.startTime || "All Day"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
