import { HealthProfile, AIStructuredResponse } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export async function analyzeWithHealthNavigator(
  query: string, 
  profile: HealthProfile | null,
  history?: { role: string; content: string }[]
): Promise<AIStructuredResponse> {
  try {
    const userContext = profile ? {
      age: profile.profile?.age,
      gender: profile.profile?.gender,
      weight: profile.profile?.weight,
      conditions: profile.health?.conditions || [],
      allergies: profile.health?.allergies || [],
      pregnancy: profile.pregnancy?.status
    } : null;

    const response = await fetch("/api/gemini/navigator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, userContext, history })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return {
      summary: data.summary || "Health navigation insight provided based on available clinical references.",
      keyTakeaway: data.keyTakeaway,
      possibleConsiderations: Array.isArray(data.possibleConsiderations) && data.possibleConsiderations.length > 0 
        ? data.possibleConsiderations 
        : [
          "Health parameters should be interpreted in the context of comprehensive clinical evaluations.",
          "Individual variation is common across different age groups and lifestyles."
        ],
      recommendedNextSteps: Array.isArray(data.recommendedNextSteps) && data.recommendedNextSteps.length > 0 
        ? data.recommendedNextSteps 
        : [
          "Track frequency, severity, and any associated changes in daily habits.",
          "Consult your physician for personalized medical advice."
        ],
      whenToSeekCare: Array.isArray(data.whenToSeekCare) && data.whenToSeekCare.length > 0 
        ? data.whenToSeekCare 
        : [
          "If you experience persistent or worsening symptoms.",
          "During regularly scheduled annual checkups."
        ],
      warningSigns: Array.isArray(data.warningSigns) && data.warningSigns.length > 0 
        ? data.warningSigns 
        : [
          "Severe acute pain, shortness of breath, sudden weakness, or high fever."
        ],
      suggestedFollowUps: Array.isArray(data.suggestedFollowUps) 
        ? data.suggestedFollowUps 
        : [
          "What questions should I ask my doctor about this?",
          "Are there lifestyle modifications that can help?",
          "How can I track my symptoms effectively before my appointment?"
        ],
      disclaimer: data.disclaimer || "HealthNav provides AI-assisted health information and navigation. It does not diagnose conditions or replace professional medical advice."
    };
  } catch (error) {
    console.error("Health Navigator Error:", error);
    return {
      summary: `Educational summary regarding "${query}".`,
      keyTakeaway: "Track your symptoms and consult your healthcare provider for individualized care.",
      possibleConsiderations: [
        "Health concerns benefit from structured documentation and clinical evaluation.",
        "Every individual has unique physiological baseline metrics."
      ],
      recommendedNextSteps: [
        "Keep a log of symptoms, timestamps, and current medications.",
        "Present your log to your healthcare provider during your next consultation."
      ],
      whenToSeekCare: [
        "Seek medical consultation if symptoms interfere with daily living or fail to improve."
      ],
      warningSigns: [
        "Chest pain or pressure, severe breathing difficulty, sudden confusion, or acute injury."
      ],
      suggestedFollowUps: [
        "What questions should I ask my doctor about this?",
        "Are there lifestyle modifications that can help?",
        "How can I track my symptoms effectively before my appointment?"
      ],
      disclaimer: "HealthNav provides AI-assisted health information and navigation. It does not diagnose conditions or replace professional medical advice."
    };
  }
}

async function callAiApi(payload: any) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "AI request failed" }));
    throw new Error(error.error || "Failed to call AI API");
  }
  return await response.json();
}

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

export async function getChatResponse(message: string, conversationId: string | null, profile: HealthProfile | null) {
  let token: string | undefined = undefined;
  if (isSupabaseConfigured) {
    try {
      const session = await supabase.auth.getSession();
      token = session.data.session?.access_token;
    } catch {
      // Ignore
    }
  }

  const headers: Record<string, string> = { 
    "Content-Type": "application/json" 
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ message, conversation_id: conversationId, profile }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Chat endpoint failed" }));
    throw new Error(error.error || "Failed to call Chat API");
  }
  return await response.json();
}

export async function getAiriResponse(message: string, profile: HealthProfile | null) {
  try {
    const userContext = profile ? `
### USER DATA (CLINICAL PROFILE)
* Age: ${profile.profile?.age ?? 28}
* Weight: ${profile.profile?.weight ?? 70}kg
* Gender: ${profile.profile?.gender ?? 'male'}
* Medical conditions: ${profile.health?.conditions?.join?.(", ") || "None reported"}
* Allergies: ${profile.health?.allergies?.join?.(", ") || "None reported"}
* Pregnancy status: ${profile.pregnancy?.status?.replace?.("_", " ") || "not pregnant"}
` : "### USER DATA\nNo profile data available. Ask user for basic health info if needed for safety.";

    const result = await callAiApi({
      prompt: message,
      systemInstruction: AIRI_SYSTEM_PROMPT + "\n\n" + userContext,
    });

    return result.text || "I'm sorry, I couldn't process that request. Please consult a medical professional.";
  } catch (error) {
    console.error("Airi Error:", error);
    return "I'm having trouble connecting to my medical database. If this is an emergency, please call emergency services immediately.";
  }
}

export async function processPrescription(base64Image: string) {
  try {
    const result = await callAiApi({
      contents: [
        {
          parts: [
            { text: "Extract medicine name, strength, form, pack, and dose from this prescription. Normalize to canonical SKUs. Return a JSON array of objects." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            strength: { type: "string" },
            form: { type: "string" },
            pack: { type: "string" },
            dose: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["name", "strength"]
        }
      }
    });

    return JSON.parse(result.text || "[]");
  } catch (error) {
    console.error("OCR Error:", error);
    return [];
  }
}

export async function scanMedicine(base64Image: string) {
  try {
    const result = await callAiApi({
      contents: [
        {
          parts: [
            { text: "Identify the medicine from this image. Extract: name, strength (e.g. 500mg), form (e.g. tablet), and primary use. Also provide a confidence score (0-1). Return as JSON." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          strength: { type: "string" },
          form: { type: "string" },
          primaryUse: { type: "string" },
          confidence: { type: "number" }
        },
        required: ["name", "strength"]
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Medicine Scan Error:", error);
    return null;
  }
}

export async function getCareRecommendations(symptoms: string) {
  try {
    const result = await callAiApi({
      prompt: `Map these symptoms to treatment tags and suggest hospital types: ${symptoms}. Return JSON with tags and rationale.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" } },
          rationale: { type: "string" },
          suggestedSpecialty: { type: "string" }
        }
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Recommendation Error:", error);
    return { tags: [], rationale: "Unable to process symptoms at this time.", suggestedSpecialty: "General Physician" };
  }
}

export async function summarizeReviews(reviews: string[]) {
  try {
    const result = await callAiApi({
      prompt: `Summarize these hospital reviews into a 2-line summary focusing on treatment quality and trust: ${reviews.join("\n")}`,
    });

    return result.text || "No summary available.";
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

    const result = await callAiApi({
      prompt: `Generate a personalized 1-day sample diet plan (Breakfast, Lunch, Dinner, Snack) based on my profile. 
      Include calorie estimates and why each meal is good for my conditions. 
      Return as a JSON object with 'meals' array (name, items, calories, rationale).`,
      systemInstruction: "You are a clinical nutritionist AI. " + userContext,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                items: { type: "array", items: { type: "string" } },
                calories: { type: "number" },
                rationale: { type: "string" }
              }
            }
          }
        }
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Diet Plan Error:", error);
    return { meals: [] };
  }
}

export async function getRecommendedArticles(query: string) {
  try {
    const result = await callAiApi({
      prompt: `Find 3 verified health articles from reputable sources (like WHO, Mayo Clinic, WebMD, Lancet) related to: ${query}. 
      Provide a title, a 2-line summary, the source name, a real-looking URL, an image URL (use picsum.photos), and relevant tags. 
      Return as a JSON array of objects.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            source: { type: "string" },
            url: { type: "string" },
            imageUrl: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            category: { type: "string" }
          },
          required: ["title", "summary", "source", "url", "imageUrl", "tags", "category"]
        }
      }
    });

    const articles = JSON.parse(result.text || "[]");
    return articles.map((a: any, i: number) => ({
      ...a,
      id: a.id || `art-${Date.now()}-${i}`
    }));
  } catch (error) {
    console.error("Article Recommendation Error:", error);
    return [];
  }
}

export async function searchHospital(query: string) {
  try {
    const result = await callAiApi({
      prompt: `Search for ${query} hospital in India. 
      Provide real data in JSON format:
      {
          "name": "Full Name",
          "loc": "Actual Address, City",
          "beds": "Real Bed Capacity",
          "avail": "Live Available Beds (Simulated)",
          "img": "Direct URL of hospital building photo",
          "link": "Official Website URL",
          "specialists": "All departments available",
          "airi_insight": "A professional AI insight about this hospital's quality",
          "cost": "Cost Range (e.g. Premium, Affordable)",
          "fee": "Consultation Fee",
          "score": 90,
          "badges": ["Specialty 1", "Specialty 2"]
      }`,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          loc: { type: "string" },
          beds: { type: "string" },
          avail: { type: "string" },
          img: { type: "string" },
          link: { type: "string" },
          specialists: { type: "string" },
          airi_insight: { type: "string" },
          cost: { type: "string" },
          fee: { type: "string" },
          score: { type: "number" },
          badges: { type: "array", items: { type: "string" } }
        },
        required: ["name", "loc", "beds", "avail", "img", "link", "airi_insight", "specialists"]
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Hospital Search Error:", error);
    return null;
  }
}
