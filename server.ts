import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client if GEMINI_API_KEY is available
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// POST /api/refine-highlights - Refines, deduplicates, and translates daily activity highlights into concise English
app.post('/api/refine-highlights', async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required and cannot be empty' });
  }

  // If AI client is configured with valid key, use gemini-3.8-flash
  if (ai) {
    try {
      const prompt = `Here is a list of IT daily activities and log entries from Hotel Ciputra Jakarta. Some entries are in Indonesian, have typos, informal wording, or repeated routine tasks:

${JSON.stringify(items, null, 2)}

Refine and convert these into a polished Weekly Highlights list adhering to:
1. STRICTLY ENGLISH: Translate all Indonesian words, phrases, abbreviations into professional hotel IT terminology.
2. CONCISE & CORE POINTS ONLY: Maximum 5 to 10 words per item. Keep strictly to the core action and object. No verbose stories or timestamps.
3. ACTION VERB FIRST: Start with strong imperative verbs (e.g. "Configure...", "Replace...", "Troubleshoot and fix...", "Install...", "Setup...", "Inspect...", "Update...", "Reset...", "Monitor...").
4. DEDUPLICATE: If the same or redundant routine task is listed multiple times across different days (e.g. repeated "Daily check IT" or "Signage update"), consolidate them into a single clean concise entry.
5. Fix all grammar and typos. Use standard IT capitalization (Wi-Fi, CCTV, POS, LAN, VLAN, PC, TV, etc.).

Return a JSON object with this exact format:
{
  "refined": ["Short concise item 1", "Short concise item 2", ...]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction:
            'You are an executive IT Operations Report Editor for Hotel Ciputra Jakarta. Output only valid JSON with concise, high-impact English action bullets without duplicates.',
        },
      });

      const responseText = response.text || '';
      const parsed = JSON.parse(responseText);

      if (parsed && Array.isArray(parsed.refined)) {
        return res.json({
          refined: parsed.refined,
          source: 'gemini',
        });
      }
    } catch (err: any) {
      console.warn('Gemini generateContent error in server.ts:', err?.message || err);
    }
  }

  // If Gemini is not available or errored, respond with fallback signal
  return res.json({
    refined: null,
    source: 'fallback',
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server ready at http://0.0.0.0:${port}`);
  });
}

startServer();
