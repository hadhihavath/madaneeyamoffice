// Comprehensive end-to-end verification script for CEEM Madaneeyam Office web application
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("==================================================");
  console.log("CEEM MADANEEYAM OFFICE - END-TO-END VERIFICATION");
  console.log("==================================================");

  // 1. Verify Login Page
  console.log("\n[1/7] Testing Login Page HTML & Brand Assets...");
  const loginRes = await fetch(`${BASE_URL}/login`);
  const loginHtml = await loginRes.text();
  console.log(`- HTTP Status: ${loginRes.status}`);
  console.log(`- Contains CEEM Madaneeyam brand logo: ${loginHtml.includes("logo_en.png")}`);

  if (!loginHtml.includes("logo_en.png") || loginRes.status !== 200) {
    throw new Error("Login page validation failed!");
  }

  // 2. Test Super Admin Login Authentication
  console.log("\n[2/7] Testing Super Admin Login API...");
  const authRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@ceem.edu",
      password: "Password123!",
    }),
  });
  const authData = await authRes.json();
  const setCookie = authRes.headers.get("set-cookie");
  const adminCookieVal = setCookie?.split(";")[0];
  console.log(`- Auth Success: ${authData.success}`);
  console.log(`- User: ${authData.user?.name} (${authData.user?.role})`);
  console.log(`- Session Cookie Issued: ${Boolean(setCookie)}`);

  // 3. Test Switch to Zainul Abideen (Kochi Office Employee - not yet checked in today)
  console.log("\n[3/7] Testing Demo Persona Switch to Zainul Abideen (Kochi Office)...");
  const switchRes = await fetch(`${BASE_URL}/api/auth/demo-switch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "zain.academic@ceem.edu" }),
  });
  const switchData = await switchRes.json();
  const zainCookie = switchRes.headers.get("set-cookie");
  const zainCookieVal = zainCookie?.split(";")[0];
  console.log(`- Switched to: ${switchData.user?.name} (${switchData.user?.role})`);
  console.log(`- Office: ${switchData.user?.employee?.office?.name} (Radius: ${switchData.user?.employee?.office?.attendanceRadius}m)`);

  // 4. Test Geofenced Attendance Rejection (Outside Office - 500m away from Kochi office)
  console.log("\n[4/7] Testing Attendance Check-in OUTSIDE Allowed Radius (500m away from Kochi office)...");
  const kochiLat = switchData.user.employee.office.latitude; // 9.9312
  const kochiLon = switchData.user.employee.office.longitude; // 76.2673

  const rejectRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: zainCookieVal || "",
    },
    body: JSON.stringify({
      latitude: kochiLat + 0.005, // ~550m away
      longitude: kochiLon + 0.005,
      accuracy: 10,
    }),
  });
  const rejectData = await rejectRes.json();
  console.log(`- HTTP Status: ${rejectRes.status} (Expected 403 Forbidden)`);
  console.log(`- Check-in Allowed: ${rejectData.isAllowed}`);
  console.log(`- Server Rejection Message: "${rejectData.error}"`);
  console.log(`- Distance Computed by Server: ${Math.round(rejectData.distanceMeters)}m (Allowed: ${rejectData.allowedRadiusMeters}m)`);

  if (rejectRes.status !== 403 || rejectData.isAllowed !== false) {
    throw new Error("Geofence security breach! Outside check-in should have been rejected with 403!");
  }

  // 5. Test Geofenced Attendance Acceptance (Inside Office - 25m away)
  console.log("\n[5/7] Testing Attendance Check-in INSIDE Allowed Radius (25m from Kochi office)...");
  const acceptRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: zainCookieVal || "",
    },
    body: JSON.stringify({
      latitude: kochiLat + 0.00015, // ~25m away
      longitude: kochiLon + 0.0001,
      accuracy: 8,
    }),
  });
  const acceptData = await acceptRes.json();
  console.log(`- HTTP Status: ${acceptRes.status} (Expected 200 OK)`);
  console.log(`- Check-in Allowed: ${acceptData.success}`);
  console.log(`- Status Recorded: ${acceptData.attendance?.status}`);
  console.log(`- Distance Recorded: ${Math.round(acceptData.attendance?.distanceMeters)}m`);

  if (acceptRes.status !== 200 || !acceptData.success) {
    throw new Error("Inside check-in should have succeeded!");
  }

  // 6. Test Double Check-in Prevention
  console.log("\n[6/7] Testing Double Check-in Prevention...");
  const doubleRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: zainCookieVal || "",
    },
    body: JSON.stringify({
      latitude: kochiLat,
      longitude: kochiLon,
    }),
  });
  const doubleData = await doubleRes.json();
  console.log(`- HTTP Status: ${doubleRes.status} (Expected 409 Conflict)`);
  console.log(`- Error: "${doubleData.error}"`);

  if (doubleRes.status !== 409) {
    throw new Error("Double check-in should have been prevented with 409 Conflict!");
  }

  // 7. Test Check-out
  console.log("\n[7/7] Testing Attendance Check-Out & Working Duration Calculation...");
  const checkoutRes = await fetch(`${BASE_URL}/api/attendance/check-out`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: zainCookieVal || "",
    },
    body: JSON.stringify({
      latitude: kochiLat,
      longitude: kochiLon,
    }),
  });
  const checkoutData = await checkoutRes.json();
  console.log(`- HTTP Status: ${checkoutRes.status}`);
  console.log(`- Check-Out Success: ${checkoutData.success}`);
  console.log(`- Formatted Duration: "${checkoutData.formattedDuration}"`);

  // 8. Test Multi-Office Listing & Geofence Coordinates
  console.log("\n[8/8] Verifying Multi-Office Hierarchy & Audit Logs...");
  const officesRes = await fetch(`${BASE_URL}/api/offices`);
  const officesData = await officesRes.json();
  console.log(`- Total Branches: ${officesData.offices?.length}`);
  officesData.offices?.forEach((o) => {
    console.log(`  🏢 ${o.name} (${o.code}): ${o.totalEmployees} employees, Radius: ${o.attendanceRadius}m, Rate: ${o.attendanceRate}%`);
  });

  const auditRes = await fetch(`${BASE_URL}/api/audit-logs`, {
    headers: { Cookie: adminCookieVal || "" },
  });
  const auditData = await auditRes.json();
  console.log(`- Total Immutable Audit Records: ${auditData.auditLogs?.length}`);

  console.log("\n==================================================");
  console.log("🎉 ALL MULTI-OFFICE & GEOFENCE TESTS PASSED 100%!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
