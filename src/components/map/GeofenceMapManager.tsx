"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Navigation,
  Layers,
  Building2,
  Sparkles,
  Info,
} from "lucide-react";

export interface OfficeGeofenceData {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  latitude: number;
  longitude: number;
  attendanceRadius: number;
}

interface GeofenceMapManagerProps {
  offices: OfficeGeofenceData[];
  onSaveSuccess?: () => void;
}

export function GeofenceMapManager({
  offices: initialOffices,
  onSaveSuccess,
}: GeofenceMapManagerProps) {
  const [offices, setOffices] = useState<OfficeGeofenceData[]>(initialOffices);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    initialOffices[0]?.id || ""
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bulkRadius, setBulkRadius] = useState<number>(100);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ [officeId: string]: { marker: any; circle: any } }>({});
  const LRef = useRef<any>(null);

  // Sync state if prop changes
  useEffect(() => {
    setOffices(initialOffices);
  }, [initialOffices]);

  const selectedOffice = offices.find((o) => o.id === selectedOfficeId) || offices[0];

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");
      LRef.current = L;

      if (!isMounted || !mapContainerRef.current) return;

      // Center around Kerala by default (Kozhikode coords: 11.2588, 75.7804)
      const initialCenter = selectedOffice
        ? [selectedOffice.latitude, selectedOffice.longitude]
        : [11.2588, 75.7804];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter as [number, number],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Map click handler to move selected office pin
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        updateSelectedOfficeCoords(lat, lng);
      });

      mapInstanceRef.current = map;
      renderOfficeLayers();
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Re-render markers and geofence circles whenever offices or selection changes
  useEffect(() => {
    renderOfficeLayers();
  }, [offices, selectedOfficeId]);

  const createCustomIcon = (code: string, isSelected: boolean) => {
    const L = LRef.current;
    if (!L) return undefined;

    const bgClass = isSelected ? "#059669" : "#1e293b";
    const borderClass = isSelected ? "#ffffff" : "#cbd5e1";
    const scale = isSelected ? "1.15" : "1.0";

    const html = `
      <div style="transform: scale(${scale}); transform-origin: bottom center; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background: ${bgClass}; color: white; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 700; font-family: monospace; border: 2px solid ${borderClass}; box-shadow: 0 4px 10px rgba(0,0,0,0.25); white-space: nowrap;">
          ${code}
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${bgClass}; margin-top: -1px;"></div>
        <div style="width: 8px; height: 8px; background: ${bgClass}; border-radius: 50%; margin-top: 1px; border: 2px solid #ffffff;"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "custom-office-pin",
      iconSize: [40, 42],
      iconAnchor: [20, 42],
    });
  };

  const renderOfficeLayers = () => {
    const L = LRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear previous layers
    Object.values(layersRef.current).forEach(({ marker, circle }) => {
      if (marker) map.removeLayer(marker);
      if (circle) map.removeLayer(circle);
    });
    layersRef.current = {};

    offices.forEach((office) => {
      const isSelected = office.id === selectedOfficeId;

      // Geofence Circle with accurate meter radius
      const circle = L.circle([office.latitude, office.longitude], {
        radius: office.attendanceRadius,
        color: isSelected ? "#059669" : "#64748b",
        weight: isSelected ? 2.5 : 1.5,
        dashArray: isSelected ? undefined : "4, 4",
        fillColor: isSelected ? "#10b981" : "#94a3b8",
        fillOpacity: isSelected ? 0.22 : 0.1,
      }).addTo(map);

      // Marker
      const icon = createCustomIcon(office.code, isSelected);
      const marker = L.marker([office.latitude, office.longitude], {
        icon,
        draggable: isSelected, // Only selected marker is draggable
      }).addTo(map);

      // Popup
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <b style="color: #0f172a; font-size: 13px;">${office.name}</b><br/>
          <span style="color: #64748b;">Code: ${office.code}</span><br/>
          <span style="color: #059669; font-weight: 600;">Geofence Radius: ${office.attendanceRadius}m</span><br/>
          <span style="color: #475569; font-size: 11px;">Lat: ${office.latitude.toFixed(5)}, Lng: ${office.longitude.toFixed(5)}</span>
        </div>
      `);

      // Event listener for click to select
      marker.on("click", () => {
        setSelectedOfficeId(office.id);
      });

      // Event listener for dragend to update coordinates
      if (isSelected) {
        marker.on("dragend", (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          updateSelectedOfficeCoords(lat, lng);
        });
      }

      layersRef.current[office.id] = { marker, circle };
    });
  };

  const updateSelectedOfficeCoords = (lat: number, lng: number) => {
    setOffices((prev) =>
      prev.map((o) =>
        o.id === selectedOfficeId
          ? { ...o, latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) }
          : o
      )
    );
    setHasUnsavedChanges(true);
  };

  const updateSelectedOfficeRadius = (radius: number) => {
    setOffices((prev) =>
      prev.map((o) => (o.id === selectedOfficeId ? { ...o, attendanceRadius: radius } : o))
    );
    setHasUnsavedChanges(true);
  };

  const handleSelectOffice = (officeId: string) => {
    setSelectedOfficeId(officeId);
    const target = offices.find((o) => o.id === officeId);
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 15, {
        duration: 0.8,
      });
    }
  };

  const handleApplyBulkRadius = () => {
    setOffices((prev) =>
      prev.map((o) => ({
        ...o,
        attendanceRadius: bulkRadius,
      }))
    );
    setHasUnsavedChanges(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateSelectedOfficeCoords(latitude, longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 0.8 });
        }
      },
      (err) => {
        setErrorMsg(`Unable to retrieve GPS location: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleReset = () => {
    setOffices(initialOffices);
    setHasUnsavedChanges(false);
    setErrorMsg(null);
  };

  const handleSaveAllGeofences = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      const officeGeofences = offices.map((o) => ({
        officeId: o.id,
        radius: o.attendanceRadius,
        latitude: o.latitude,
        longitude: o.longitude,
      }));

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officeGeofences }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update geofences");
      }

      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 4000);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save geofences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden space-y-4">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Multi-Office Geofence Map Control
                {hasUnsavedChanges && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Unsaved Changes
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Drag office pins or adjust perimeters. Attendance checks outside these radiuses are automatically rejected.
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAllGeofences}
            disabled={saving || !hasUnsavedChanges}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving Changes..." : "Save All Geofences"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="mx-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          All office coordinates &amp; attendance geofences saved successfully! Audit log entries generated.
        </div>
      )}

      {errorMsg && (
        <div className="mx-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Office Navigation Tabs */}
      <div className="px-5 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
        <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" /> Offices:
        </span>
        {offices.map((office) => {
          const isSelected = office.id === selectedOfficeId;
          return (
            <button
              key={office.id}
              type="button"
              onClick={() => handleSelectOffice(office.id)}
              className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition flex items-center gap-1.5 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <span>{office.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isSelected ? "bg-emerald-700 text-emerald-100" : "bg-white text-slate-500"
                }`}
              >
                {office.attendanceRadius}m
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Interactive Map + Configuration Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Interactive Map Viewport */}
        <div className="lg:col-span-8 p-4 bg-slate-50 relative min-h-[440px] flex flex-col justify-end">
          <div
            ref={mapContainerRef}
            className="w-full h-[420px] lg:h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0"
          />

          <div className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-slate-200 shadow-md text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              Tip:
            </div>
            <p className="max-w-[200px] leading-tight">
              Drag the green pin or click on the map to set office center coordinates.
            </p>
          </div>
        </div>

        {/* Configuration Controls Sidebar */}
        <div className="lg:col-span-4 p-5 space-y-5 border-t lg:border-t-0 lg:border-l border-slate-100 bg-white">
          {/* Selected Office Header */}
          {selectedOffice && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-md">
                  Active Office
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {selectedOffice.code}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{selectedOffice.name}</h3>
              {selectedOffice.address && (
                <p className="text-xs text-slate-500 leading-snug">{selectedOffice.address}</p>
              )}
            </div>
          )}

          {/* Radius Controller */}
          {selectedOffice && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Attendance Geofence Radius
                </label>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {selectedOffice.attendanceRadius} meters
                </span>
              </div>

              <input
                type="range"
                min="25"
                max="600"
                step="5"
                value={selectedOffice.attendanceRadius}
                onChange={(e) => updateSelectedOfficeRadius(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />

              {/* Quick Radius Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: "50m", val: 50, note: "Strict" },
                  { label: "100m", val: 100, note: "Standard" },
                  { label: "150m", val: 150, note: "Campus" },
                  { label: "300m", val: 300, note: "Extended" },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => updateSelectedOfficeRadius(preset.val)}
                    className={`px-2 py-1 text-[11px] rounded-lg font-semibold border transition ${
                      selectedOffice.attendanceRadius === preset.val
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GPS Coordinates Fine-Tuning */}
          {selectedOffice && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">GPS Coordinates</span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                  title="Calibrate using current device location"
                >
                  <Navigation className="w-3 h-3" /> Use My GPS
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={selectedOffice.latitude}
                    onChange={(e) =>
                      updateSelectedOfficeCoords(Number(e.target.value), selectedOffice.longitude)
                    }
                    className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={selectedOffice.longitude}
                    onChange={(e) =>
                      updateSelectedOfficeCoords(selectedOffice.latitude, Number(e.target.value))
                    }
                    className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bulk Action: Apply Radius to All Offices */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Bulk Set All Offices
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Set a uniform geofence perimeter across all {offices.length} branches simultaneously:
            </p>
            <div className="flex items-center gap-2">
              <select
                value={bulkRadius}
                onChange={(e) => setBulkRadius(Number(e.target.value))}
                className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-slate-700 flex-1"
              >
                <option value={50}>50 meters (Strict)</option>
                <option value={75}>75 meters (Compact)</option>
                <option value={100}>100 meters (Standard)</option>
                <option value={150}>150 meters (Campus)</option>
                <option value={200}>200 meters (Large)</option>
                <option value={300}>300 meters (Extended)</option>
              </select>
              <button
                type="button"
                onClick={handleApplyBulkRadius}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition shadow-xs whitespace-nowrap"
              >
                Apply to All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
