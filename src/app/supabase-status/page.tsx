import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft, Database, Flame, Server } from "lucide-react";

export default async function SupabaseStatusPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let supabaseConnected = false;
  let supabaseMessage = "";
  let errorDetails: string | null = null;

  try {
    // Check connection by getting the current session or a lightweight request
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      supabaseMessage = error.message;
      errorDetails = JSON.stringify(error, null, 2);
    } else {
      supabaseConnected = true;
      supabaseMessage = "Connected successfully to Supabase Auth & Gateway!";
    }
  } catch (err: any) {
    supabaseMessage = "Failed to connect to Supabase";
    errorDetails = err?.message || String(err);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured";
  const firebaseProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "officeceem";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Backend Services Integration
              </h1>
              <p className="text-sm text-slate-500">
                CEEM Madaneeyam &bull; Supabase &amp; Firebase Diagnostics
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            {/* Supabase Status Card */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Server className="w-5 h-5 text-emerald-600" />
                  Supabase Client
                </div>
                {supabaseConnected ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Notice
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mb-2">
                <span className="font-medium">Project URL:</span>{" "}
                <code className="text-emerald-700">{supabaseUrl}</code>
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Status:</span> {supabaseMessage}
              </p>
              {errorDetails && (
                <pre className="mt-3 p-2 bg-slate-900 text-emerald-400 text-[11px] rounded overflow-x-auto">
                  {errorDetails}
                </pre>
              )}
            </div>

            {/* Firebase Status Card */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Firebase Project
                </div>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                <span className="font-medium">Project ID:</span>{" "}
                <code className="text-amber-700">{firebaseProject}</code>
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Deployment Target:</span> Firebase App Hosting / Hosting
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Next Steps for PostgreSQL &amp; Prisma (Optional)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              If you want your office database (Employees, Attendance, Offices, Leaves) to live directly in Supabase Postgres, retrieve your Postgres Connection URI from:
              <br />
              <strong>Supabase Dashboard &rarr; Project Settings &rarr; Database &rarr; Connection string (URI)</strong>
              <br />
              and set it in your <code className="bg-slate-100 px-1 py-0.5 rounded">.env.local</code> as <code className="bg-slate-100 px-1 py-0.5 rounded">DATABASE_URL</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
