import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __dirname = process.cwd();
const __filename = path.join(__dirname, 'server.ts');

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const isServerSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
  rawSupabaseKey &&
  !rawSupabaseUrl.includes('mlztrxjuhaneoidhmqsz.supabase.co') &&
  rawSupabaseUrl.startsWith('https://')
);

// In-memory conversation and message fallback storage
interface InMemConv {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface InMemMsg {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

let inMemoryConversations: InMemConv[] = [];
let inMemoryMessages: InMemMsg[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to get Supabase client with user's token
  const getSupabase = (req: express.Request) => {
    if (!isServerSupabaseConfigured) return null;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    if (!token || token === "undefined" || token === "null") return null;

    try {
      return createClient(rawSupabaseUrl, rawSupabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      });
    } catch {
      return null;
    }
  };

  // Helper to parse JSON from model output safely
  function parseModelJson<T>(rawText: string, fallback: T): T {
    if (!rawText) return fallback;
    try {
      return JSON.parse(rawText);
    } catch {
      try {
        const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
        }
      } catch (e) {
        console.warn("Failed to extract JSON from model output:", e);
      }
    }
    return fallback;
  }

  // Dedicated Secure Gemini API Proxy Route
  app.post("/api/gemini/proxy", async (req, res) => {
    try {
      const { prompt, contents, history, systemInstruction, responseMimeType, responseSchema, model } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(503).json({ 
          error: "GEMINI_API_KEY environment variable is not configured on the backend.",
          code: "MISSING_KEY",
          retryable: false
        });
      }

      const genAI = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let finalContents = contents || prompt;
      if (!finalContents && history && Array.isArray(history)) {
        finalContents = history.map((h: any) => `${h.role || 'user'}: ${h.content || ''}`).join('\n');
      }

      const selectedModel = model || "gemini-3.7-flash";
      const result = await genAI.models.generateContent({
        model: selectedModel,
        contents: finalContents,
        config: {
          systemInstruction: systemInstruction || undefined,
          responseMimeType: responseMimeType || undefined,
          responseSchema: responseSchema || undefined,
        }
      });

      res.json({ text: result.text, success: true });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      let statusCode = 500;
      let errorCode = "SERVER_ERROR";
      let userMessage = error.message || "Gemini API proxy encountered an error.";

      const errStr = (error?.message || "").toLowerCase();
      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("rate limit")) {
        statusCode = 429;
        errorCode = "RATE_LIMIT";
        userMessage = "Rate limit or quota exceeded for Gemini API. Please try again shortly.";
      } else if (errStr.includes("timeout") || errStr.includes("deadline")) {
        statusCode = 504;
        errorCode = "TIMEOUT";
        userMessage = "Request timed out while communicating with Gemini API.";
      }

      res.status(statusCode).json({ error: userMessage, code: errorCode, retryable: true });
    }
  });

  // AI API Route (General Gemini Proxy)
  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, contents, history, systemInstruction, responseMimeType, responseSchema } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(503).json({ 
          error: "HealthNav AI is temporarily unconfigured (GEMINI_API_KEY missing).",
          text: "HealthNav AI is ready. Please configure your GEMINI_API_KEY in project settings to enable active real-time intelligence."
        });
      }

      const genAI = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const result = await genAI.models.generateContent({
        model: "gemini-3.7-flash",
        contents: contents || prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          responseMimeType: responseMimeType || undefined,
          responseSchema: responseSchema || undefined,
        }
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "HealthNav AI is temporarily unavailable. Please try again." });
    }
  });

  // Handler for Health Navigator requests (Shared by /api/gemini/navigator and /api/navigator/analyze)
  const handleHealthNavigator = async (req: express.Request, res: express.Response) => {
    const userQuery = req.body.query || req.body.message || req.body.prompt || "General health inquiry";
    const userContext = req.body.userContext || req.body.profile || null;
    const history = req.body.history || [];
    const apiKey = process.env.GEMINI_API_KEY;

    const fallbackResponse = {
      summary: `Here is structured health guidance regarding: "${userQuery}".`,
      keyTakeaway: "Always maintain an open line of communication with your physician regarding changes in health.",
      possibleConsiderations: [
        "Health symptoms and physiological readings must be evaluated in the context of individual medical history.",
        "Lifestyle factors, sleep quality, hydration, stress levels, and nutrition play a significant role in baseline wellness.",
        "Variations in lab results or symptoms may be transient or indicate conditions that warrant routine clinical review."
      ],
      recommendedNextSteps: [
        "Document the timeline, severity, frequency, and any triggers related to your question.",
        "Create a list of your current medications, supplements, and allergies before your appointment.",
        "Schedule a consultation with your primary care provider or appropriate specialist."
      ],
      whenToSeekCare: [
        "Schedule a routine appointment if symptoms persist for more than a few days without improvement.",
        "Seek prompt medical review if symptoms noticeably worsen or interfere with daily activities."
      ],
      warningSigns: [
        "Sudden severe pain, chest tightness or pressure, difficulty breathing.",
        "Sudden confusion, speech difficulty, weakness or numbness in the face or limbs.",
        "High persistent fever, uncontrolled bleeding, or fainting."
      ],
      suggestedFollowUps: [
        "What questions should I ask my doctor about this?",
        "Are there lifestyle modifications that can help?",
        "How can I track my symptoms effectively before my appointment?"
      ],
      disclaimer: "HealthNav provides AI-assisted health information and navigation. It does not diagnose conditions or replace professional medical advice."
    };

    if (!apiKey) {
      return res.status(503).json({ 
        error: "HealthNav AI is temporarily unconfigured (GEMINI_API_KEY missing).",
        code: "MISSING_KEY",
        retryable: false
      });
    }

    try {
      const genAI = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are HealthNav AI, an advanced, empathetic, and evidence-informed Healthcare Navigation Assistant powered by clinical knowledge.
Your mission is to provide clear, thorough, compassionate, and actionable answers to health-related questions, explain complex medical concepts and lab results, guide patients on what to expect, and organize practical questions for their doctor.

Core Guidelines:
1. Answer the user's specific question directly and accurately in the "summary" and "possibleConsiderations".
2. Break down medical jargon into simple, reassuring, and intuitive language.
3. Be structured, objective, and deeply supportive.
4. Highlight concrete questions the user can bring to their doctor.
5. Identify clear red-flag warning signs that require emergency or urgent medical evaluation.
6. Suggest 3 thoughtful follow-up questions the patient might want to ask next.
7. Safety: Do not provide definitive diagnoses or alter prescriptions; emphasize that you provide educational clarity and healthcare navigation.

Return ONLY a valid JSON object matching this schema:
{
  "summary": "Direct, empathetic, and comprehensive 2-3 sentence answer addressing the user's query specifically.",
  "keyTakeaway": "A single crisp, high-impact sentence highlighting the most important thing to know.",
  "possibleConsiderations": [
    "Detailed point 1 explaining the underlying physiological context or common causes",
    "Detailed point 2 explaining related contributing factors (e.g. lifestyle, medications, diet)",
    "Detailed point 3 explaining how doctors typically evaluate this"
  ],
  "recommendedNextSteps": [
    "Actionable step 1 (e.g. specific tracking, symptom log parameters)",
    "Actionable step 2 (e.g. specific questions to ask their doctor)",
    "Actionable step 3 (e.g. preparatory steps before medical evaluation)"
  ],
  "whenToSeekCare": [
    "Specific timeline or thresholds for scheduling a non-emergency appointment with a doctor",
    "Signs indicating that evaluation shouldn't be delayed"
  ],
  "warningSigns": [
    "Red flag symptom 1 requiring immediate/emergency medical evaluation",
    "Red flag symptom 2 (e.g. severe shortness of breath, acute pain, neurological changes)"
  ],
  "suggestedFollowUps": [
    "Specific follow-up question 1 related to their topic",
    "Specific follow-up question 2",
    "Specific follow-up question 3"
  ],
  "disclaimer": "HealthNav provides AI-assisted health information and navigation. It does not diagnose conditions or replace professional medical advice."
}`;

      let promptContent = "";
      if (userContext) {
        promptContent += `User Profile Context:\nAge: ${userContext.age || 'Not specified'}, Gender: ${userContext.gender || 'Not specified'}, Weight: ${userContext.weight || 'Not specified'}kg, Known Conditions: ${(userContext.conditions || []).join(', ') || 'None'}, Allergies: ${(userContext.allergies || []).join(', ') || 'None'}, Pregnancy: ${userContext.pregnancy || 'No'}\n\n`;
      }
      if (history && history.length > 0) {
        promptContent += `Recent Prior Context:\n${history.map((h: any) => `${h.role}: ${h.content}`).join('\n')}\n\n`;
      }
      promptContent += `User Health Query: ${userQuery}`;

      const result = await genAI.models.generateContent({
        model: "gemini-3.7-flash",
        contents: promptContent,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const parsed = parseModelJson(result.text || "", fallbackResponse);
      
      // Ensure all fields are populated properly
      const finalResult = {
        summary: parsed.summary || fallbackResponse.summary,
        keyTakeaway: parsed.keyTakeaway || fallbackResponse.keyTakeaway,
        possibleConsiderations: Array.isArray(parsed.possibleConsiderations) && parsed.possibleConsiderations.length > 0 
          ? parsed.possibleConsiderations 
          : fallbackResponse.possibleConsiderations,
        recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps) && parsed.recommendedNextSteps.length > 0 
          ? parsed.recommendedNextSteps 
          : fallbackResponse.recommendedNextSteps,
        whenToSeekCare: Array.isArray(parsed.whenToSeekCare) && parsed.whenToSeekCare.length > 0 
          ? parsed.whenToSeekCare 
          : fallbackResponse.whenToSeekCare,
        warningSigns: Array.isArray(parsed.warningSigns) && parsed.warningSigns.length > 0 
          ? parsed.warningSigns 
          : fallbackResponse.warningSigns,
        suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0
          ? parsed.suggestedFollowUps
          : fallbackResponse.suggestedFollowUps,
        disclaimer: parsed.disclaimer || fallbackResponse.disclaimer,
      };

      res.json(finalResult);
    } catch (err: any) {
      console.error("Health Navigator API Error:", err);
      let statusCode = 500;
      let errorCode = "SERVER_ERROR";
      let userMessage = "HealthNav AI encountered an issue while generating clinical guidance. Please try again.";

      const errString = (err?.message || JSON.stringify(err)).toLowerCase();
      if (errString.includes("429") || errString.includes("quota") || errString.includes("rate limit")) {
        statusCode = 429;
        errorCode = "RATE_LIMIT";
        userMessage = "AI service rate limit or quota exceeded. Please wait a moment and try again.";
      } else if (errString.includes("timeout") || errString.includes("timed out") || errString.includes("deadline")) {
        statusCode = 504;
        errorCode = "TIMEOUT";
        userMessage = "The request timed out while communicating with Gemini 3.7 Flash. Please check your connection and retry.";
      } else if (errString.includes("api key") || errString.includes("auth") || errString.includes("unauthorized")) {
        statusCode = 401;
        errorCode = "AUTH_ERROR";
        userMessage = "API authentication failed. Please check your API key configuration.";
      } else if (errString.includes("json") || errString.includes("syntax")) {
        statusCode = 502;
        errorCode = "INVALID_RESPONSE";
        userMessage = "Received an invalid response format from the AI service. Please retry.";
      }

      return res.status(statusCode).json({
        error: userMessage,
        code: errorCode,
        retryable: true
      });
    }
  };

  // Dedicated Secure Gemini Health Navigator Endpoints
  app.post("/api/gemini/navigator", handleHealthNavigator);
  app.post("/api/navigator/analyze", handleHealthNavigator);

  // --- Chat System APIs ---

  // 1. POST /api/chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, conversation_id, profile } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const supabase = getSupabase(req);
      let user: any = null;
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (!error && data?.user) {
            user = data.user;
          }
        } catch (e) {
          console.warn("Supabase auth check bypassed:", e);
        }
      }

      let convId = conversation_id;
      let historyItems: { role: string; content: string }[] = [];

      if (user && supabase) {
        try {
          if (!convId) {
            const title = message.substring(0, 40) + (message.length > 40 ? "..." : "");
            const { data: conv, error: convErr } = await supabase
              .from("conversations")
              .insert([{ user_id: user.id, title }])
              .select()
              .single();
            if (convErr) throw convErr;
            convId = conv.id;
          }

          // Save user message
          await supabase
            .from("messages")
            .insert([{ conversation_id: convId, role: "user", content: message }]);

          // Fetch full conversation history
          const { data: history } = await supabase
            .from("messages")
            .select("role, content")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: true });
          
          if (history) {
            historyItems = history;
          }
        } catch (e) {
          console.warn("Supabase chat store failed, using in-memory:", e);
          user = null; // fallback to in-memory
        }
      }

      if (!user || !supabase) {
        // In-memory guest chat handling
        if (!convId || !inMemoryConversations.some(c => c.id === convId)) {
          convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const title = message.substring(0, 40) + (message.length > 40 ? "..." : "");
          const newConv: InMemConv = {
            id: convId,
            user_id: "guest_user",
            title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          inMemoryConversations.unshift(newConv);
        } else {
          const conv = inMemoryConversations.find(c => c.id === convId);
          if (conv) conv.updated_at = new Date().toISOString();
        }

        inMemoryMessages.push({
          id: `msg_${Date.now()}_user`,
          conversation_id: convId,
          role: "user",
          content: message,
          created_at: new Date().toISOString()
        });

        historyItems = inMemoryMessages
          .filter(m => m.conversation_id === convId)
          .map(m => ({ role: m.role, content: m.content }));
      }

      // Gemini AI Integration
      const apiKey = process.env.GEMINI_API_KEY;
      let aiResponse = "";

      if (apiKey) {
        const genAI = new GoogleGenAI({ 
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        
        const userContext = profile ? `
### USER HEALTH PROFILE CONTEXT
* Age: ${profile.profile?.age || 'Not specified'}
* Weight: ${profile.profile?.weight || 'Not specified'}kg
* Gender: ${profile.profile?.gender || 'Not specified'}
* Medical conditions: ${(profile.health?.conditions || []).join(", ") || "None recorded"}
* Known allergies: ${(profile.health?.allergies || []).join(", ") || "None"}
* Pregnancy status: ${profile.pregnancy?.status?.replace("_", " ") || "Not pregnant"}
` : "No individual profile data provided.";

        const systemPrompt = `You are HealthNav AI, the trusted AI Healthcare Navigator.
Your role is to help users navigate their health questions, understand medical terms and reports, prepare for doctor visits, and identify when to seek professional care.

Communication Guidelines:
1. Tone: Calm, compassionate, objective, and clear.
2. Structure your replies clearly using markdown headers where helpful:
   - **Summary & Understanding**
   - **What This Could Mean**
   - **Recommended Next Steps & Doctor Questions**
   - **When to Seek Care & Warning Signs**
3. Emphasize that you provide health navigation and educational clarity, not medical diagnoses.
4. If a symptom sounds potentially emergent (severe chest pain, breathing difficulty, sudden speech or mobility loss), immediately urge calling emergency services (such as 102 / 911).
5. Conclude with:
*Disclaimer: HealthNav provides AI-assisted health information and navigation. It does not diagnose conditions or replace professional medical advice.*

${userContext}`;

        const contents = historyItems.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));

        try {
          const result = await genAI.models.generateContent({
            model: "gemini-3.7-flash",
            contents,
            config: { systemInstruction: systemPrompt }
          });
          aiResponse = result.text || "I am your HealthNav AI Assistant. How can I help you navigate your health today?";
        } catch (geminiError: any) {
          console.error("Gemini call error:", geminiError);
          aiResponse = "HealthNav AI is currently handling high volume. Please check your query or consult a healthcare provider for immediate medical advice.\n\n*Disclaimer: HealthNav provides AI-assisted health information and navigation.*";
        }
      } else {
        aiResponse = "Welcome to HealthNav! I am your AI Health Navigator. I can help explain medical terms, organize questions for your physician, and review general health guidance.\n\nTo enable live generative analysis, ensure your GEMINI_API_KEY is configured in project settings.\n\n*Disclaimer: HealthNav provides AI-assisted health information and navigation. It does not diagnose conditions or replace professional medical advice.*";
      }

      // Save AI Response
      if (user && supabase) {
        try {
          await supabase
            .from("messages")
            .insert([{ conversation_id: convId, role: "assistant", content: aiResponse }]);

          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId);
        } catch (e) {
          console.warn("Could not persist assistant message to Supabase:", e);
        }
      } else {
        inMemoryMessages.push({
          id: `msg_${Date.now()}_assistant`,
          conversation_id: convId,
          role: "assistant",
          content: aiResponse,
          created_at: new Date().toISOString()
        });
      }

      res.json({ 
        reply: aiResponse,
        text: aiResponse, 
        conversation_id: convId 
      });

    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: error.message || "Chat failed" });
    }
  });

  // 2. GET /api/conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const supabase = getSupabase(req);
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .order("updated_at", { ascending: false });
          if (!error && data) {
            return res.json(data);
          }
        } catch (e) {
          // Fallback
        }
      }
      res.json(inMemoryConversations);
    } catch (error: any) {
      res.json(inMemoryConversations);
    }
  });

  // 3. GET /api/messages
  app.get("/api/messages", async (req, res) => {
    try {
      const { conversation_id } = req.query;
      if (!conversation_id) {
        return res.json([]);
      }

      const supabase = getSupabase(req);
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", { ascending: true });
          if (!error && data) {
            return res.json(data);
          }
        } catch (e) {
          // Fallback
        }
      }

      const msgs = inMemoryMessages
        .filter(m => m.conversation_id === conversation_id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      res.json(msgs);
    } catch (error: any) {
      res.json([]);
    }
  });

  // 4. PATCH /api/conversations/:id
  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;

      const supabase = getSupabase(req);
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("conversations")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();
          if (!error && data) {
            return res.json(data);
          }
        } catch (e) {
          // Fallback
        }
      }

      const conv = inMemoryConversations.find(c => c.id === id);
      if (conv) {
        conv.title = title || conv.title;
        conv.updated_at = new Date().toISOString();
        return res.json(conv);
      }

      res.json({ id, title, updated_at: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. DELETE /api/conversations/:id
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = getSupabase(req);
      if (supabase) {
        try {
          await supabase
            .from("conversations")
            .delete()
            .eq("id", id);
        } catch (e) {
          // Fallback
        }
      }

      inMemoryConversations = inMemoryConversations.filter(c => c.id !== id);
      inMemoryMessages = inMemoryMessages.filter(m => m.conversation_id !== id);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

