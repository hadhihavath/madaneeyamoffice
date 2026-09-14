"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Navigation,
  Compass,
  Building2,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

interface AttendanceWidgetProps {
  user: any;
  onAttendanceChanged?: () => void;
}

export function AttendanceWidget({ user, onAttendanceChanged }: AttendanceWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<"LOCATING" | "READY" | "ERROR">("LOCATING");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number; accuracy: number } | null>(
    null
  );
  const [simulationMode, setSimulationMode] = useState<"DEVICE" | "INSIDE_OFFICE" | "OUTSIDE_OFFICE">("INSIDE_OFFICE");
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    null
  );
  const [elapsedWorkingSeconds, setElapsedWorkingSeconds] = useState(0);

  const office = user?.employee?.office || {
    name: "Kozhikode Office (HQ)",
    latitude: 11.2588,
    longitude: 75.7804,
    attendanceRadius: 100,
  };

  // Fetch today's attendance status
  const fetchTodayStatus = async () => {
    try {
      const res = await fetch("/api/attendance/my");
      if (res.ok) {
        const data = await res.json();
        setTodayAttendance(data.today);
        if (data.today?.checkInTime && !data.today?.checkOutTime) {
          const startTime = new Date(data.today.checkInTime).getTime();
          setElapsedWorkingSeconds(Math.floor((Date.now() - startTime) / 1000));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  // Update working duration timer every second when checked in
  useEffect(() => {
    if (todayAttendance?.checkInTime && !todayAttendance?.checkOutTime) {
      const interval = setInterval(() => {
        const startTime = new Date(todayAttendance.checkInTime).getTime();
        setElapsedWorkingSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [todayAttendance]);

  // Coordinate resolution based on simulation mode or device GPS
  useEffect(() => {
    if (simulationMode === "INSIDE_OFFICE") {
      // 42 meters north-east of Kozhikode office
      setCurrentCoords({
        lat: office.latitude + 0.0003,
        lon: office.longitude + 0.0002,
        accuracy: 10,
      });
      setGpsStatus("READY");
    } else if (simulationMode === "OUTSIDE_OFFICE") {
      // ~450 meters away (outside 100m radius)
      setCurrentCoords({
        lat: office.latitude + 0.0035,
        lon: office.longitude + 0.0028,
        accuracy: 12,
      });
      setGpsStatus("READY");
    } else {
      // Browser Device GPS
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        setGpsStatus("LOCATING");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCurrentCoords({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
            setGpsStatus("READY");
          },
          (err) => {
            console.warn("Device geolocation error:", err.message);
            // Graceful fallback to inside office simulation
            setSimulationMode("INSIDE_OFFICE");
            setCurrentCoords({
              lat: office.latitude + 0.0003,
              lon: office.longitude + 0.0002,
              accuracy: 10,
            });
            setGpsStatus("READY");
            setAlertMessage({
              type: "info",
              text: "Device GPS unavailable or permission denied. Switched to Office Simulator mode.",
            });
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setSimulationMode("INSIDE_OFFICE");
      }
    }
  }, [simulationMode, office.latitude, office.longitude]);

  const handleCheckIn = async () => {
    if (!currentCoords) return;
    setLoading(true);
    setAlertMessage(null);

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: currentCoords.lat,
          longitude: currentCoords.lon,
          accuracy: currentCoords.accuracy,
          notes: simulationMode === "INSIDE_OFFICE" ? "Office simulation verified" : "Mobile device GPS check-in",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTodayAttendance(data.attendance);
        setAlertMessage({ type: "success", text: data.message });
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        if (onAttendanceChanged) onAttendanceChanged();
      } else {
        setAlertMessage({
          type: "error",
          text: data.error || "Check-in rejected by office geofence validator.",
        });
      }
    } catch (err) {
      setAlertMessage({ type: "error", text: "Network error during check-in." });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentCoords) return;
    setLoading(true);
    setAlertMessage(null);

    try {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: currentCoords.lat,
          longitude: currentCoords.lon,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTodayAttendance(data.attendance);
        setAlertMessage({ type: "success", text: data.message });
        if (onAttendanceChanged) onAttendanceChanged();
      } else {
        setAlertMessage({ type: "error", text: data.error || "Check-out failed." });
      }
    } catch (err) {
      setAlertMessage({ type: "error", text: "Network error during check-out." });
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const isCheckedIn = !!todayAttendance?.checkInTime;
  const isCheckedOut = !!todayAttendance?.checkOutTime;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
      {/* Widget Header */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-100/90 mb-0.5">
              CEEM MADANEEYAM OFFICE
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},{" "}
              {user?.employee?.firstName || user?.name || "Colleague"} 👋
            </h2>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold border border-white/20">
            <Building2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>{office.name}</span>
          </div>
        </div>

        {/* GPS Detection Bar */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </div>
            <span className="font-medium text-emerald-50">
              {gpsStatus === "READY"
                ? simulationMode === "INSIDE_OFFICE"
                  ? "Location detected: Inside office perimeter (42m away)"
                  : simulationMode === "OUTSIDE_OFFICE"
                  ? "Location detected: Outside office area (~450m away)"
                  : "Live Device GPS Active"
                : "Acquiring GPS fix..."}
            </span>
          </div>

          <div className="text-emerald-100 text-[11px] font-mono">
            Radius: {office.attendanceRadius}m
          </div>
        </div>
      </div>

      {/* Simulator / Test Controls Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Location Simulator:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSimulationMode("INSIDE_OFFICE")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              simulationMode === "INSIDE_OFFICE"
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            ✓ Inside Office (42m)
          </button>
          <button
            onClick={() => setSimulationMode("OUTSIDE_OFFICE")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              simulationMode === "OUTSIDE_OFFICE"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            ✕ Outside Office (450m)
          </button>
          <button
            onClick={() => setSimulationMode("DEVICE")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              simulationMode === "DEVICE"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Compass className="w-3 h-3 inline mr-1" />
            Device GPS
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`px-5 py-3 text-xs flex items-center gap-2.5 border-b ${
            alertMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : alertMessage.type === "error"
              ? "bg-red-50 text-red-800 border-red-200 font-medium"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {alertMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : alertMessage.type === "error" ? (
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Main Attendance Interaction Card */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Status Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Today's Attendance Status
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isCheckedOut
                    ? "bg-slate-100 text-slate-700 border border-slate-300"
                    : isCheckedIn
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {isCheckedOut
                  ? "CHECKED OUT"
                  : isCheckedIn
                  ? `CHECKED IN (${todayAttendance?.status || "PRESENT"})`
                  : "NOT CHECKED IN"}
              </span>
            </div>

            {/* Time Indicators */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Check In</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {todayAttendance?.checkInTime
                    ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Check Out</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {todayAttendance?.checkOutTime
                    ? new Date(todayAttendance.checkOutTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </span>
              </div>

              <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100">
                <span className="text-[11px] text-brand-700 font-medium block">Working Duration</span>
                <span className="text-sm font-bold text-brand-900 font-mono">
                  {isCheckedOut
                    ? `${Math.floor((todayAttendance.workDurationMinutes || 0) / 60)}h ${(todayAttendance.workDurationMinutes || 0) % 60}m`
                    : isCheckedIn
                    ? formatSeconds(elapsedWorkingSeconds)
                    : "0h 0m"}
                </span>
              </div>
            </div>

            {/* Location Details */}
            {todayAttendance?.distanceMeters !== undefined && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>
                  Recorded distance:{" "}
                  <strong className="text-slate-700">
                    {Math.round(todayAttendance.distanceMeters)} meters
                  </strong>{" "}
                  from office center (Accuracy: ±{Math.round(todayAttendance.locationAccuracy || 8)}m)
                </span>
              </div>
            )}
          </div>

          {/* Action Column */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>CHECK IN NOW</span>
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span>CHECK OUT</span>
              </button>
            ) : (
              <div className="text-center py-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-700 block">
                  Completed For Today
                </span>
                <span className="text-[11px] text-slate-500">
                  Great work! Have a restful evening.
                </span>
              </div>
            )}

            <span className="text-[10px] text-slate-400 mt-2 text-center">
              Verified by CEEM Madaneeyam Geofencing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
