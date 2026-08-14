import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // AI API Route (General)
  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, contents, history, systemInstruction, responseMimeType, responseSchema } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const genAI = new GoogleGenAI({ apiKey });
      
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
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
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

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
        const genAI = new GoogleGenAI({ apiKey });
        
        const userContext = profile ? `
### USER DATA
* Age: ${profile.profile?.age || 'Not specified'}
* Weight: ${profile.profile?.weight || 'Not specified'}kg
* Gender: ${profile.profile?.gender || 'Not specified'}
* Medical conditions: ${(profile.health?.conditions || []).join(", ") || "None"}
* Allergies: ${(profile.health?.allergies || []).join(", ") || "None"}
* Pregnancy status: ${profile.pregnancy?.status?.replace("_", " ") || "Not pregnant"}
` : "No profile data available.";

        const systemPrompt = `You are Airi, a compassionate, hyper-intelligent AI healthcare companion for Pan-Asia. 
Provide clear, empathetic, and evidence-informed health guidance. Always prioritize patient safety.
If a medical situation is critical or life-threatening, urge seeking immediate emergency care (e.g. 102/emergency services).
${userContext}`;

        const contents = historyItems.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));

        try {
          const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: { systemInstruction: systemPrompt }
          });
          aiResponse = result.text || "I'm here to support your health journey. How else can I assist you today?";
        } catch (geminiError: any) {
          console.error("Gemini call error:", geminiError);
          // Fallback to flash-1.5 or helpful message
          try {
            const fallbackResult = await genAI.models.generateContent({
              model: "gemini-1.5-flash",
              contents,
              config: { systemInstruction: systemPrompt }
            });
            aiResponse = fallbackResult.text || "I understand your concern. Please consult a qualified physician for clinical diagnosis.";
          } catch {
            aiResponse = "I am Airi, your healthcare navigator. I've noted your query and recommend consulting a healthcare provider for personalized medical evaluation.";
          }
        }
      } else {
        aiResponse = "Hello! I am Airi, your AI health navigator. Please ensure the GEMINI_API_KEY is configured in your project settings to enable active AI consultations.";
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

