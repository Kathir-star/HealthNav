import { Hospital } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 5 realistic hospitals near coordinates (${lat}, ${lng}). 
      Provide: name, capabilityScore (0-100), costRange ($, $$, $$$), bedAvailability (number), distance (e.g. 1.2 km), and 3 badges (e.g. 24/7, ICU, Trauma Center).
      Return as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              capabilityScore: { type: Type.NUMBER },
              costRange: { type: Type.STRING },
              bedAvailability: { type: Type.NUMBER },
              distance: { type: Type.STRING },
              badges: { type: Type.ARRAY, items: { type: Type.STRING } },
              reviewSummary: { type: Type.STRING }
            },
            required: ["name", "capabilityScore", "costRange", "bedAvailability", "distance", "badges"]
          }
        }
      }
    });

    const hospitals = JSON.parse(response.text || "[]");
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
