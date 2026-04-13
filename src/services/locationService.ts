import { Hospital } from '../types';

async function callAiApi(payload: any) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to call AI API");
  }
  return await response.json();
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        resolve(null);
      }
    );
  });
}

export async function findNearbyHospitals(lat: number, lng: number): Promise<Hospital[]> {
  try {
    const result = await callAiApi({
      prompt: `Find 5 realistic hospitals near coordinates (${lat}, ${lng}). 
      Provide: name, capabilityScore (0-100), costRange ($, $$, $$$), bedAvailability (number), distance (e.g. 1.2 km), and 3 badges (e.g. 24/7, ICU, Trauma Center).
      Return as a JSON array of objects.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            capabilityScore: { type: "number" },
            costRange: { type: "string" },
            bedAvailability: { type: "number" },
            distance: { type: "string" },
            badges: { type: "array", items: { type: "string" } },
            reviewSummary: { type: "string" }
          },
          required: ["name", "capabilityScore", "costRange", "bedAvailability", "distance", "badges"]
        }
      }
    });

    const hospitals = JSON.parse(result.text || "[]");
    return hospitals.map((h: any, i: number) => ({
      ...h,
      id: h.id || `hosp-${Date.now()}-${i}`,
      bestFit: i === 0,
      reviewSummary: h.reviewSummary || "Highly rated for emergency care."
    }));
  } catch (error) {
    console.error("Hospital Search Error:", error);
    return [];
  }
}
