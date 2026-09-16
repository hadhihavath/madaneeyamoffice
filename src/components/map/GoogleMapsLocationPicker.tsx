"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Navigation,
  ExternalLink,
  Search,
  Building2,
  Sparkles,
  Info,
} from "lucide-react";

export interface OfficeData {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  attendanceRadius: number;
}

interface GoogleMapsLocationPickerProps {
  office: OfficeData;
  onSaveSuccess?: () => void;
}

export function GoogleMapsLocationPicker({
  office: initialOffice,
  onSaveSuccess,
}: GoogleMapsLocationPickerProps) {
  const [office, setOffice] = useState<OfficeData>(initialOffice);
  const [radius, setRadius] = useState<number>(initialOffice.attendanceRadius || 100);
  const [lat, setLat] = useState<number>(initialOffice.latitude || 11.422415);
  const [lng, setLng] = useState<number>(initialOffice.longitude || 75.898374);
  const [address, setAddress] = useState<string>(initialOffice.address || "Career helps, Calicut, Kerala");
  const [pasteInput, setPasteInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setOffice(initialOffice);
    setRadius(initialOffice.attendanceRadius);
    setLat(initialOffice.latitude);
    setLng(initialOffice.longitude);
    setAddress(initialOffice.address || "Career helps, Calicut, Kerala");
  }, [initialOffice]);

  // Construct dynamic Google Maps Embed URL based on current coordinates
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=17&output=embed`;

  // Parse pasted Google Maps link, iframe embed, or coordinates
  const handleParseGoogleMapsInput = (input: string) => {
    setPasteInput(input);
    setErrorMsg(null);
    if (!input.trim()) return;

    try {
      // 1. Check for iframe embed code
      const iframeMatch = input.match(/!2d([0-9.]+)!3d([0-9.]+)/);
      if (iframeMatch && iframeMatch[1] && iframeMatch[2]) {
        const parsedLng = parseFloat(iframeMatch[1]);
        const parsedLat = parseFloat(iframeMatch[2]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          setLat(parsedLat);
          setLng(parsedLng);
          setHasUnsavedChanges(true);
          return;
        }
      }

      // 2. Check for @lat,lng in google.com/maps/place/.../@lat,lng,zoom
      const atMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch && atMatch[1] && atMatch[2]) {
        const parsedLat = parseFloat(atMatch[1]);
        const parsedLng = parseFloat(atMatch[2]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          setLat(parsedLat);
          setLng(parsedLng);
          setHasUnsavedChanges(true);
          return;
        }
      }

      // 3. Check for q=lat,lng
      const qMatch = input.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch && qMatch[1] && qMatch[2]) {
        const parsedLat = parseFloat(qMatch[1]);
        const parsedLng = parseFloat(qMatch[2]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          setLat(parsedLat);
          setLng(parsedLng);
          setHasUnsavedChanges(true);
          return;
        }
      }

      // 4. Check for direct comma-separated coordinates: "11.422415, 75.898374"
      const directCoords = input.trim().split(/[\s,]+/);
      if (directCoords.length === 2) {
        const parsedLat = parseFloat(directCoords[0]);
        const parsedLng = parseFloat(directCoords[1]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          setLat(parsedLat);
          setLng(parsedLng);
          setHasUnsavedChanges(true);
          return;
        }
      }

      setErrorMsg("Could not detect coordinates from the pasted text. Please paste coordinates like '11.422415, 75.898374' or a Google Maps link/iframe.");
    } catch (e: any) {
      setErrorMsg("Error parsing Google Maps input: " + e.message);
    }
  };

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(Number(latitude.toFixed(6)));
        setLng(Number(longitude.toFixed(6)));
        setHasUnsavedChanges(true);
      },
      (err) => {
        setErrorMsg(`Unable to retrieve GPS: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleReset = () => {
    setRadius(initialOffice.attendanceRadius);
    setLat(initialOffice.latitude);
    setLng(initialOffice.longitude);
    setAddress(initialOffice.address);
    setPasteInput("");
    setHasUnsavedChanges(false);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeGeofences: [
            {
              officeId: office.id,
              radius,
              latitude: lat,
              longitude: lng,
            },
          ],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update office location.");
      }

      // Also update office name/address if changed
      await fetch(`/api/offices/${office.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: office.name,
          address,
          latitude: lat,
          longitude: lng,
          attendanceRadius: radius,
        }),
      });

      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 4000);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save geofence.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden space-y-4">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Google Maps Location &amp; Geofence Selector
                {hasUnsavedChanges && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Unsaved Changes
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Calicut Headquarters location boundary &amp; high-precision attendance perimeter
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
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
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving Changes..." : "Save Office Geofence"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="mx-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Calicut Office location &amp; attendance geofence updated successfully! Audit log created.
        </div>
      )}

      {errorMsg && (
        <div className="mx-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Google Maps Frame + Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Google Maps Embed Container */}
        <div className="lg:col-span-8 p-4 bg-slate-50 relative min-h-[440px] flex flex-col justify-between">
          <div className="w-full h-[400px] lg:h-[460px] rounded-xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100">
            <iframe
              title="Google Maps Location"
              src={googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />

            {/* Circular Perimeter Overlay Badge */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Attendance Perimeter
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Radius: <strong className="text-emerald-700">{radius} meters</strong> around ({lat.toFixed(5)}, {lng.toFixed(5)})
              </p>
            </div>

            {/* External Google Maps Button */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in Google Maps
            </a>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Location: <strong>{address}</strong></span>
            <span className="font-mono text-[11px]">Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</span>
          </div>
        </div>

        {/* Configuration Controls Sidebar */}
        <div className="lg:col-span-4 p-5 space-y-5 border-t lg:border-t-0 lg:border-l border-slate-100 bg-white">
          {/* Active Calicut Office Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-md">
                Primary Headquarters
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {office.code}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">{office.name}</h3>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              />
            </div>
          </div>

          {/* Paste Google Maps Link or Embed Code */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Paste Google Maps Link, Embed or Coords
            </label>
            <input
              type="text"
              placeholder="Paste Google Maps link, iframe code, or 11.422415, 75.898374"
              value={pasteInput}
              onChange={(e) => handleParseGoogleMapsInput(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
            />
            <p className="text-[10px] text-slate-400">
              Paste directly from Google Maps (Share &rarr; Embed map / Copy link).
            </p>
          </div>

          {/* Radius Controller */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Attendance Geofence Radius
              </label>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {radius} meters
              </span>
            </div>

            <input
              type="range"
              min="25"
              max="600"
              step="5"
              value={radius}
              onChange={(e) => {
                setRadius(Number(e.target.value));
                setHasUnsavedChanges(true);
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />

            {/* Quick Radius Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: "50m", val: 50 },
                { label: "100m", val: 100 },
                { label: "150m", val: 150 },
                { label: "300m", val: 300 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => {
                    setRadius(preset.val);
                    setHasUnsavedChanges(true);
                  }}
                  className={`px-2 py-1 text-[11px] rounded-lg font-semibold border transition ${
                    radius === preset.val
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* GPS Coordinates Fine-Tuning */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Exact Coordinates</span>
              <button
                type="button"
                onClick={handleUseDeviceLocation}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition"
                title="Calibrate using current device location"
              >
                <Navigation className="w-3 h-3" /> Use Device GPS
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
                  value={lat}
                  onChange={(e) => {
                    setLat(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
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
                  value={lng}
                  onChange={(e) => {
                    setLng(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
