"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileText,
  Download,
  Upload,
  Folder,
  Shield,
  FileCheck,
} from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const categories = [
    { key: "ALL", label: "All Documents" },
    { key: "HR_POLICIES", label: "HR Policies" },
    { key: "OFFICE_DOCUMENTS", label: "Office Documents" },
    { key: "TRAINING_MATERIALS", label: "Training Materials" },
    { key: "COMPANY_FORMS", label: "Company Forms" },
  ];

  const filteredDocs =
    category === "ALL"
      ? documents
      : documents.filter((d) => d.category === category);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Secure Document Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Centralized organizational policies, handbook, forms, and instructional records
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200 text-xs font-semibold">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                category === c.key
                  ? "bg-white text-brand-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-100 text-brand-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {doc.fileSize}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug">
                  {doc.title}
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  {doc.fileName}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">
                  Role Access: <strong>{doc.accessRole}</strong>
                </span>

                <a
                  href={doc.fileUrl || "/brand/Madaneeyam_Logo.pdf"}
                  target="_blank"
                  download
                  className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-brand-200/60"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
