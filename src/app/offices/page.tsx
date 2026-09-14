"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { OfficeMap } from "@/components/map/OfficeMap";
import {
  Building2,
  MapPin,
  Users,
  Shield,
  Plus,
  Edit2,
  Sliders,
  CheckCircle2,
  Phone,
  Mail,
} from "lucide-react";

export default function OfficesPage() {
  const [session, setSession] = useState<any>(null);
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Radius Modal
  const [editOffice, setEditOffice] = useState<any | null>(null);
  const [editRadius, setEditRadius] = useState<number>(100);
  const [editLoading, setEditLoading] = useState(false);

  // Create Office Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newLat, setNewLat] = useState("11.2588");
  const [newLon, setNewLon] = useState("75.7804");
  const [newRadius, setNewRadius] = useState("100");
  const [createLoading, setCreateLoading] = useState(false);

  const fetchOffices = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      const res = await fetch("/api/offices");
      if (res.ok) {
        const data = await res.json();
        setOffices(data.offices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  const handleUpdateRadius = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOffice) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/offices/${editOffice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceRadius: editRadius }),
      });

      if (res.ok) {
        setEditOffice(null);
        fetchOffices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          code: newCode,
          address: newAddress,
          city: newCity,
          latitude: parseFloat(newLat),
          longitude: parseFloat(newLon),
          attendanceRadius: parseInt(newRadius),
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewName("");
        setNewCode("");
        setNewAddress("");
        setNewCity("");
        fetchOffices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const isSuperAdmin = session?.role === "SUPER_ADMIN";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Multi-Office Network & Geofences
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure office branches, GPS geofence radiuses, and location tracking boundaries
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Office Branch</span>
            </button>
          )}
        </div>

        {/* Interactive Geolocation Map */}
        {offices.length > 0 && <OfficeMap offices={offices} />}

        {/* Office Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {offices.map((office) => (
            <div
              key={office.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                      {office.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {office.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{office.address}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {office.status}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Total Staff</span>
                    <span className="text-sm font-bold text-slate-800">
                      {office.totalEmployees} Employees
                    </span>
                  </div>
                  <div className="p-2.5 bg-brand-50/60 rounded-xl">
                    <span className="text-[10px] text-brand-700 block">Attendance Rate</span>
                    <span className="text-sm font-bold text-brand-800">
                      {office.attendanceRate}% ({office.presentCount} present)
                    </span>
                  </div>
                </div>

                {/* GPS Boundary Info */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>GPS Coordinates:</span>
                    <span className="font-mono font-medium">
                      {office.latitude}, {office.longitude}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowed Attendance Radius:</span>
                    <span className="font-bold text-brand-700">
                      {office.attendanceRadius} meters
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isSuperAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setEditOffice(office);
                      setEditRadius(office.attendanceRadius);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configure Geofence</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Edit Geofence Radius Modal */}
        {editOffice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Configure Geofence Radius
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Set permitted attendance perimeter for <strong>{editOffice.name}</strong>. Employees outside this radius will be rejected.
              </p>

              <form onSubmit={handleUpdateRadius} className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>Perimeter Radius:</span>
                    <span className="text-brand-700 font-bold">{editRadius} meters</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={editRadius}
                    onChange={(e) => setEditRadius(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>50m (Strict)</span>
                    <span>100m (Standard)</span>
                    <span>150m (Campus)</span>
                    <span>500m (Extended)</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  Changing the radius triggers an immutable audit log and alters attendance boundary validation immediately.
                </div>

                <div className="flex items-center justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditOffice(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {editLoading ? "Saving..." : "Save Geofence Radius"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Office Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Add New Office Branch
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Register a new physical office location with GPS coordinates for attendance.
              </p>

              <form onSubmit={handleCreateOffice} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Office Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Palakkad Office"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Office Code
                    </label>
                    <input
                      type="text"
                      required
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="e.g. PLK"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="e.g. Palakkad"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. Near Stadium Junction"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      required
                      value={newLat}
                      onChange={(e) => setNewLat(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      required
                      value={newLon}
                      onChange={(e) => setNewLon(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Radius (m)
                    </label>
                    <input
                      type="number"
                      required
                      value={newRadius}
                      onChange={(e) => setNewRadius(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono text-slate-800"
                    />
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
                    {createLoading ? "Creating..." : "Create Office"}
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
