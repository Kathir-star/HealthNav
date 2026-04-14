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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlztrxjuhaneoidhmqsz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1senRyeGp1aGFuZW9pZGhtcXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTkzMTMsImV4cCI6MjA5MTYzNTMxM30.igOIpjJDV7MrCHeNsMKbSb80XwB2GK8lCCA4CX0mUd4';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to get Supabase client with user's token
  const getSupabase = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  };

  // AI API Route (Legacy/General)
  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, contents, history, systemInstruction, responseMimeType, responseSchema } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const genAI = new GoogleGenAI({ apiKey });
      
      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
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
      const supabase = getSupabase(req);
      if (!supabase) return res.status(401).json({ error: "Unauthorized" });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      let convId = conversation_id;

      // If no conversation_id, create new conversation
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
      const { error: msgErr } = await supabase
        .from("messages")
        .insert([{ conversation_id: convId, role: "user", content: message }]);
      if (msgErr) throw msgErr;

      // Fetch full conversation history for Gemini
      const { data: history, error: histErr } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (histErr) throw histErr;

      // Gemini Integration
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenAI({ apiKey: apiKey || "" });
      
      const userContext = profile ? `
### USER DATA
* Age: ${profile.profile.age}
* Weight: ${profile.profile.weight}kg
* Gender: ${profile.profile.gender}
* Medical conditions: ${profile.health.conditions.join(", ") || "None"}
* Allergies: ${profile.health.allergies.join(", ") || "None"}
* Pregnancy status: ${profile.pregnancy.status.replace("_", " ")}
` : "No profile data available.";

      const systemPrompt = `You are Airi, an advanced AI healthcare assistant. Use the user's profile context to provide personalized, safe medical insights. Always prioritize safety.
      ${userContext}`;

      const contents = history.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents,
        config: { systemInstruction: systemPrompt }
      });

      const aiResponse = result.text || "I'm sorry, I couldn't process that.";

      // Save AI response
      const { error: aiMsgErr } = await supabase
        .from("messages")
        .insert([{ conversation_id: convId, role: "assistant", content: aiResponse }]);
      if (aiMsgErr) throw aiMsgErr;

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);

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
      if (!supabase) return res.status(401).json({ error: "Unauthorized" });

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. GET /api/messages
  app.get("/api/messages", async (req, res) => {
    try {
      const { conversation_id } = req.query;
      const supabase = getSupabase(req);
      if (!supabase) return res.status(401).json({ error: "Unauthorized" });

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. PATCH /api/conversations/:id
  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      const supabase = getSupabase(req);
      if (!supabase) return res.status(401).json({ error: "Unauthorized" });

      const { data, error } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. DELETE /api/conversations/:id
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = getSupabase(req);
      if (!supabase) return res.status(401).json({ error: "Unauthorized" });

      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
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
