import { GoogleGenAI, Type } from "@google/genai";
import { HealthProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const AIRI_SYSTEM_PROMPT = `You are an advanced AI healthcare assistant named Airi, integrated into a real-world medical safety application. Your role is to analyze, guide, and protect the user by providing safe, personalized, and accurate health-related insights.

You must prioritize safety, avoid harmful recommendations, and clearly warn the user in risky situations.

### CORE CAPABILITIES

#### 1. MEDICINE ANALYSIS
* Identify medicine name and dosage
* Check compatibility with user profile
* Detect: Overdose risk, Unsafe for pregnancy, Allergy conflicts
* Output: ✅ Safe / ⚠️ Caution / ❌ Unsafe, Reason, Safe dosage guidance

#### 2. DRUG INTERACTION CHECK
* Analyze multiple medicines
* Detect dangerous combinations
* Provide clear warnings

#### 3. PEDIATRIC DOSAGE
* Calculate dosage using weight
* Show safe range
* Warn if exceeded

#### 4. PREGNANCY SAFETY
* Mark medicines: Safe / Unsafe
* Provide trimester-specific advice
* Suggest supplements

#### 5. VACCINATION SYSTEM
* Suggest vaccines based on age/pregnancy
* Track: Completed, Due, Missed

#### 6. DIET PLANNER
* Generate diet based on: Condition, Age
* Example: Diabetes → low sugar, BP → low sodium

#### 7. SYMPTOM CHECKER
* Analyze symptoms
* Suggest possible conditions
* Provide urgency level

#### 8. LAB REPORT ANALYSIS
* Interpret uploaded reports or text-based data
* Highlight abnormal values

#### 9. EMERGENCY RESPONSE
If symptoms are critical (e.g. chest pain, severe bleeding, difficulty breathing, sudden confusion):
* Warn immediately in BOLD RED text.
* Suggest contacting emergency services (102 in India).
* Provide a "CRITICAL ALERT" tag in the response.

### RESPONSE FORMAT (STRICT)

**Analysis:**
* Key findings

**Safety Status:**
* ✅ / ⚠️ / ❌

**Recommendation:**
* Action steps

**Warning:**
* Critical alerts (if any)

**Urgency Level:**
* Low / Medium / High / CRITICAL

### RULES
* Do NOT replace doctors.
* Do NOT guess missing data.
* Always prioritize safety.
* If urgency is CRITICAL -> advise calling 102 immediately.
* Act as a real-time AI Guardian that prevents unsafe medicine usage, detects risks early, supports emergency decisions, and improves long-term health.`;

export async function getAiriResponse(message: string, profile: HealthProfile | null) {
  try {
    const userContext = profile ? `
### USER DATA (FROM FIREBASE)
* Age: ${profile.profile.age}
* Weight: ${profile.profile.weight}kg
* Gender: ${profile.profile.gender}
* Medical conditions: ${profile.health.conditions.join(", ") || "None"}
* Allergies: ${profile.health.allergies.join(", ") || "None"}
* Pregnancy status: ${profile.pregnancy.status.replace("_", " ")}
` : "### USER DATA\nNo profile data available. Ask user for basic health info if needed for safety.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: AIRI_SYSTEM_PROMPT + "\n\n" + userContext,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request. Please consult a medical professional.";
  } catch (error) {
    console.error("Airi Error:", error);
    return "I'm having trouble connecting to my medical database. If this is an emergency, please call emergency services immediately.";
  }
}

export async function processPrescription(base64Image: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Extract medicine name, strength, form, pack, and dose from this prescription. Normalize to canonical SKUs. Return a JSON array of objects." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              strength: { type: Type.STRING },
              form: { type: Type.STRING },
              pack: { type: Type.STRING },
              dose: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            },
            required: ["name", "strength"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("OCR Error:", error);
    return [];
  }
}

export async function scanMedicine(base64Image: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Identify the medicine from this image. Extract: name, strength (e.g. 500mg), form (e.g. tablet), and primary use. Also provide a confidence score (0-1). Return as JSON." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            strength: { type: Type.STRING },
            form: { type: Type.STRING },
            primaryUse: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["name", "strength"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Medicine Scan Error:", error);
    return null;
  }
}

export async function getCareRecommendations(symptoms: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Map these symptoms to treatment tags and suggest hospital types: ${symptoms}. Return JSON with tags and rationale.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            rationale: { type: Type.STRING },
            suggestedSpecialty: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Recommendation Error:", error);
    return { tags: [], rationale: "Unable to process symptoms at this time.", suggestedSpecialty: "General Physician" };
  }
}

export async function summarizeReviews(reviews: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize these hospital reviews into a 2-line summary focusing on treatment quality and trust: ${reviews.join("\n")}`,
    });

    return response.text || "No summary available.";
  } catch (error) {
    console.error("Summarization Error:", error);
    return "Unable to summarize reviews.";
  }
}

export async function generateDietPlan(profile: HealthProfile | null) {
  try {
    const userContext = profile ? `
### USER DATA
* Age: ${profile.profile.age}
* Weight: ${profile.profile.weight}kg
* Gender: ${profile.profile.gender}
* Medical conditions: ${profile.health.conditions.join(", ") || "None"}
* Allergies: ${profile.health.allergies.join(", ") || "None"}
* Pregnancy status: ${profile.pregnancy.status.replace("_", " ")}
` : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a personalized 1-day sample diet plan (Breakfast, Lunch, Dinner, Snack) based on my profile. 
      Include calorie estimates and why each meal is good for my conditions. 
      Return as a JSON object with 'meals' array (name, items, calories, rationale).`,
      config: {
        systemInstruction: "You are a clinical nutritionist AI. " + userContext,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  calories: { type: Type.NUMBER },
                  rationale: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Diet Plan Error:", error);
    return { meals: [] };
  }
}

export async function getRecommendedArticles(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 3 verified health articles from reputable sources (like WHO, Mayo Clinic, WebMD, Lancet) related to: ${query}. 
      Provide a title, a 2-line summary, the source name, a real-looking URL, an image URL (use picsum.photos), and relevant tags. 
      Return as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              source: { type: Type.STRING },
              url: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              category: { type: Type.STRING }
            },
            required: ["title", "summary", "source", "url", "imageUrl", "tags", "category"]
          }
        }
      }
    });

    const articles = JSON.parse(response.text || "[]");
    return articles.map((a: any, i: number) => ({
      ...a,
      id: a.id || `art-${Date.now()}-${i}`
    }));
  } catch (error) {
    console.error("Article Recommendation Error:", error);
    return [];
  }
}
