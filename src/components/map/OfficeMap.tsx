"use client";

import React, { useState } from "react";
import { Building2, MapPin, Users, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

interface OfficeData {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  attendanceRadius: number;
  totalEmployees: number;
  presentCount: number;
  attendanceRate: number;
}

interface OfficeMapProps {
  offices: OfficeData[];
  onSelectOffice?: (office: OfficeData) => void;
}

export function OfficeMap({ offices, onSelectOffice }: OfficeMapProps) {
  const [selectedOffice, setSelectedOffice] = useState<OfficeData | null>(
    offices[0] || null
  );

  // Geographic bounds for Kerala region map representation
  // Lat: 8.5 to 12.5, Lon: 74.8 to 77.5
  const mapWidth = 600;
  const mapHeight = 520;

  const latToY = (lat: number) => {
    // 12.5 is top, 8.5 is bottom
    const minLat = 9.0;
    const maxLat = 12.3;
    const norm = (maxLat - lat) / (maxLat - minLat);
    return 40 + norm * (mapHeight - 80);
  };

  const lonToX = (lon: number) => {
    // 74.8 is left, 77.2 is right
    const minLon = 75.0;
    const maxLon = 76.8;
    const norm = (lon - minLon) / (maxLon - minLon);
    return 40 + norm * (mapWidth - 80);
  };

  const handleMarkerClick = (office: OfficeData) => {
    setSelectedOffice(office);
    if (onSelectOffice) onSelectOffice(office);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            CEEM Madaneeyam Multi-Office Geolocation Map
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geofenced office branches across Kerala
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200/60">
          {offices.length} Active Offices
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Visual Map Canvas */}
        <div className="lg:col-span-8 p-4 bg-slate-50/50 flex items-center justify-center relative min-h-[380px] overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full h-auto max-h-[460px] select-none"
          >
            {/* Kerala Stylized Coastal Territory Outline */}
            <path
              d="M 120 40 
                 Q 180 80 230 140 
                 T 320 280 
                 T 380 400 
                 T 420 500 
                 L 350 510 
                 Q 280 420 220 310 
                 T 140 180 
                 Z"
              fill="#f1f5f9"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Connection Network Lines */}
            {offices.map((office, idx) => {
              if (idx === 0) return null;
              const x1 = lonToX(offices[0].longitude);
              const y1 = latToY(offices[0].latitude);
              const x2 = lonToX(office.longitude);
              const y2 = latToY(office.latitude);
              return (
                <line
                  key={office.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Office Markers */}
            {offices.map((office) => {
              const x = lonToX(office.longitude);
              const y = latToY(office.latitude);
              const isSelected = selectedOffice?.id === office.id;

              return (
                <g
                  key={office.id}
                  onClick={() => handleMarkerClick(office)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  {/* Attendance Geofence Radius Circle Indicator */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 28 : 22}
                    fill={isSelected ? "rgba(63, 163, 77, 0.18)" : "rgba(100, 116, 139, 0.1)"}
                    stroke={isSelected ? "#3fa34d" : "#94a3b8"}
                    strokeWidth={isSelected ? "2" : "1"}
                    className={isSelected ? "animate-pulse" : ""}
                  />

                  {/* Marker Pin Center */}
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={isSelected ? "#2e7d32" : "#3fa34d"}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="shadow-sm"
                  />

                  {/* Office Code Label Pill */}
                  <rect
                    x={x - 22}
                    y={y + 12}
                    width="44"
                    height="18"
                    rx="4"
                    fill={isSelected ? "#1e293b" : "#ffffff"}
                    stroke={isSelected ? "#1e293b" : "#cbd5e1"}
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={y + 24}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#334155"}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {office.code}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Office Detail Sidebar */}
        <div className="lg:col-span-4 p-5 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col justify-between bg-white">
          {selectedOffice ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {selectedOffice.code}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {selectedOffice.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedOffice.address}</p>
                </div>
              </div>

              {/* Stat Pills */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Headcount</span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedOffice.totalEmployees} Employees
                  </span>
                </div>

                <div className="p-2.5 bg-brand-50/60 rounded-xl border border-brand-100">
                  <span className="text-[10px] text-brand-700 block">Attendance Today</span>
                  <span className="text-sm font-bold text-brand-800">
                    {selectedOffice.attendanceRate}% ({selectedOffice.presentCount} present)
                  </span>
                </div>
              </div>

              {/* GPS Specs */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>GPS Latitude:</span>
                  <span className="font-mono font-semibold">{selectedOffice.latitude}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GPS Longitude:</span>
                  <span className="font-mono font-semibold">{selectedOffice.longitude}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Geofence Radius:</span>
                  <span className="font-semibold text-brand-700">
                    {selectedOffice.attendanceRadius} meters
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select an office pin to view branch details
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-400 text-center">
              All boundaries strictly enforced by Haversine geofence verification
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
