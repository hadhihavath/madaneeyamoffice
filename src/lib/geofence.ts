/**
 * Geofencing & Haversine Distance Calculation Service
 * Evaluates GPS coordinates server-side to guarantee attendance boundary integrity.
 */

export interface GeofenceValidationResult {
  isAllowed: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  isSuspicious: boolean;
  suspiciousReason?: string;
  message: string;
}

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 * @returns Distance in meters rounded to 1 decimal place.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

/**
 * Validates check-in/check-out against office boundaries and anti-fraud heuristics.
 */
export function validateAttendanceLocation({
  clientLat,
  clientLon,
  clientAccuracy,
  officeLat,
  officeLon,
  allowedRadiusMeters,
  previousCheckIn,
}: {
  clientLat: number;
  clientLon: number;
  clientAccuracy?: number;
  officeLat: number;
  officeLon: number;
  allowedRadiusMeters: number;
  previousCheckIn?: {
    lat: number;
    lon: number;
    timestamp: Date;
  };
}): GeofenceValidationResult {
  // 1. Basic coordinate sanity
  if (
    typeof clientLat !== "number" ||
    typeof clientLon !== "number" ||
    isNaN(clientLat) ||
    isNaN(clientLon) ||
    clientLat < -90 ||
    clientLat > 90 ||
    clientLon < -180 ||
    clientLon > 180
  ) {
    return {
      isAllowed: false,
      distanceMeters: -1,
      allowedRadiusMeters,
      isSuspicious: true,
      suspiciousReason: "Invalid GPS coordinates supplied.",
      message: "Unable to determine your location. Coordinates are invalid.",
    };
  }

  // 2. Server-side distance calculation
  const distanceMeters = calculateDistanceMeters(
    clientLat,
    clientLon,
    officeLat,
    officeLon
  );

  let isSuspicious = false;
  const suspiciousReasons: string[] = [];

  // 3. Accuracy anomaly check
  if (clientAccuracy && clientAccuracy > 250) {
    isSuspicious = true;
    suspiciousReasons.push(`High GPS inaccuracy (${Math.round(clientAccuracy)}m)`);
  }

  // 4. Impossible speed / location teleport check
  if (previousCheckIn) {
    const timeDiffMinutes =
      (Date.now() - new Date(previousCheckIn.timestamp).getTime()) / (1000 * 60);
    const jumpDistanceMeters = calculateDistanceMeters(
      clientLat,
      clientLon,
      previousCheckIn.lat,
      previousCheckIn.lon
    );

    // If speed exceeds 500 km/h (e.g. 50km jump in 5 minutes)
    if (timeDiffMinutes > 0 && timeDiffMinutes < 30) {
      const speedKmH = (jumpDistanceMeters / 1000) / (timeDiffMinutes / 60);
      if (speedKmH > 350) {
        isSuspicious = true;
        suspiciousReasons.push(
          `Impossible location jump detected (${Math.round(jumpDistanceMeters / 1000)}km in ${Math.round(timeDiffMinutes)}m)`
        );
      }
    }
  }

  // 5. Permitted radius determination
  // Allow a small grace margin (e.g. 5m) if accuracy is slightly degraded
  const effectiveRadius = allowedRadiusMeters;
  const isAllowed = distanceMeters <= effectiveRadius;

  let message = "";
  if (isAllowed) {
    message = `Location verified. You are ${Math.round(distanceMeters)}m from the office (Allowed: ${allowedRadiusMeters}m).`;
  } else {
    message = `You are currently outside the permitted attendance area. Detected: ${Math.round(distanceMeters)}m away, Allowed radius: ${allowedRadiusMeters}m.`;
  }

  return {
    isAllowed,
    distanceMeters,
    allowedRadiusMeters,
    isSuspicious,
    suspiciousReason: isSuspicious ? suspiciousReasons.join("; ") : undefined,
    message,
  };
}
