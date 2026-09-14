import { describe, it, expect } from "vitest";
import {
  calculateDistanceMeters,
  validateAttendanceLocation,
} from "../src/lib/geofence";

describe("Geofence & Haversine Distance Service", () => {
  const KOZHIKODE_OFFICE = {
    lat: 11.2588,
    lon: 75.7804,
    radius: 100, // 100 meters
  };

  const MALAPPURAM_OFFICE = {
    lat: 11.0732,
    lon: 76.074,
    radius: 150, // 150 meters
  };

  it("calculates 0 meters for identical coordinates", () => {
    const dist = calculateDistanceMeters(
      KOZHIKODE_OFFICE.lat,
      KOZHIKODE_OFFICE.lon,
      KOZHIKODE_OFFICE.lat,
      KOZHIKODE_OFFICE.lon
    );
    expect(dist).toBe(0);
  });

  it("accurately calculates distance for inside office location (~40-45m)", () => {
    const clientLat = 11.2591;
    const clientLon = 75.7806;
    const dist = calculateDistanceMeters(
      clientLat,
      clientLon,
      KOZHIKODE_OFFICE.lat,
      KOZHIKODE_OFFICE.lon
    );

    expect(dist).toBeGreaterThan(30);
    expect(dist).toBeLessThan(60);
  });

  it("allows check-in when employee is inside Kozhikode office radius (42m <= 100m)", () => {
    const result = validateAttendanceLocation({
      clientLat: 11.2591,
      clientLon: 75.7806,
      clientAccuracy: 10,
      officeLat: KOZHIKODE_OFFICE.lat,
      officeLon: KOZHIKODE_OFFICE.lon,
      allowedRadiusMeters: KOZHIKODE_OFFICE.radius,
    });

    expect(result.isAllowed).toBe(true);
    expect(result.distanceMeters).toBeLessThanOrEqual(100);
    expect(result.message).toContain("Location verified");
  });

  it("STRICTLY REJECTS check-in when employee is outside permitted radius (450m > 100m)", () => {
    // 450m away from Kozhikode Office
    const outsideLat = 11.2623;
    const outsideLon = 75.7832;

    const result = validateAttendanceLocation({
      clientLat: outsideLat,
      clientLon: outsideLon,
      clientAccuracy: 12,
      officeLat: KOZHIKODE_OFFICE.lat,
      officeLon: KOZHIKODE_OFFICE.lon,
      allowedRadiusMeters: KOZHIKODE_OFFICE.radius,
    });

    expect(result.isAllowed).toBe(false);
    expect(result.distanceMeters).toBeGreaterThan(100);
    expect(result.message).toContain("You are currently outside the permitted attendance area");
  });

  it("validates Malappuram custom 150m radius (120m allowed, 250m rejected)", () => {
    // 120m away from Malappuram office
    const insideResult = validateAttendanceLocation({
      clientLat: 11.074,
      clientLon: 76.0745,
      clientAccuracy: 15,
      officeLat: MALAPPURAM_OFFICE.lat,
      officeLon: MALAPPURAM_OFFICE.lon,
      allowedRadiusMeters: MALAPPURAM_OFFICE.radius, // 150m
    });
    expect(insideResult.isAllowed).toBe(true);

    // 350m away
    const outsideResult = validateAttendanceLocation({
      clientLat: 11.076,
      clientLon: 76.0765,
      clientAccuracy: 15,
      officeLat: MALAPPURAM_OFFICE.lat,
      officeLon: MALAPPURAM_OFFICE.lon,
      allowedRadiusMeters: MALAPPURAM_OFFICE.radius,
    });
    expect(outsideResult.isAllowed).toBe(false);
  });

  it("flags anti-fraud suspicious status when GPS accuracy is degraded (>250m)", () => {
    const result = validateAttendanceLocation({
      clientLat: 11.259,
      clientLon: 75.7805,
      clientAccuracy: 320, // Low GPS accuracy
      officeLat: KOZHIKODE_OFFICE.lat,
      officeLon: KOZHIKODE_OFFICE.lon,
      allowedRadiusMeters: 100,
    });

    expect(result.isSuspicious).toBe(true);
    expect(result.suspiciousReason).toContain("High GPS inaccuracy");
  });

  it("rejects invalid or corrupted GPS coordinates", () => {
    const result = validateAttendanceLocation({
      clientLat: 195.0, // Invalid lat
      clientLon: 75.78,
      officeLat: KOZHIKODE_OFFICE.lat,
      officeLon: KOZHIKODE_OFFICE.lon,
      allowedRadiusMeters: 100,
    });

    expect(result.isAllowed).toBe(false);
    expect(result.message).toContain("Unable to determine your location");
  });
});
