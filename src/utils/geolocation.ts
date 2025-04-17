/**
 * Calculates the distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of the first point (in degrees)
 * @param lon1 Longitude of the first point (in degrees)
 * @param lat2 Latitude of the second point (in degrees)
 * @param lon2 Longitude of the second point (in degrees)
 * @returns The distance between the two points in meters.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180; // φ, λ in radians
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // Distance in meters
  return d;
}

/**
 * Formats a distance in meters into a human-readable string
 * using feet, yards, or miles.
 *
 * @param meters The distance in meters.
 * @returns A formatted string (e.g., "150 feet", "0.5 miles").
 */
export function formatDistance(meters: number): string {
  if (meters < 0) return "Unknown distance";

  const feet = meters * 3.28084;
  const yards = meters * 1.09361;
  const miles = meters * 0.000621371;

  if (feet < 1000) {
    // Use feet for shorter distances
    return `${Math.round(feet)} feet`;
  } else if (yards < 1760) { // Less than 1 mile
      // Use yards for intermediate distances
      // Round to nearest 10 or 50 yards for cleaner output
      const rounding = yards < 500 ? 10 : 50;
      const roundedYards = Math.round(yards / rounding) * rounding; 
      return `${roundedYards} yards`;
  } else {
    // Use miles for longer distances, show one decimal place
    return `${miles.toFixed(1)} miles`;
  }
} 