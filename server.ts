import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { mockFinopsData } from './src/data/mockFinopsData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// REST API endpoint for FinOps dashboard data
app.get('/api/finops/data', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockFinopsData
  });
});

// Gemini AI Assistant chat endpoint with human, conversational student-friendly tone
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are the ZeroCost AI Assistant — a friendly, knowledgeable cloud mentor designed for a student's FinOps prototype project.

Your Personality:
- Speak like a friendly senior student or cloud mentor.
- Avoid robotic corporate buzzwords. Use plain, easy-to-understand human language.
- Use simple real-world analogies when helpful (for example: idle compute is like leaving the fan and lights running in an empty bedroom; unattached storage is like paying rent on a storage locker you forgot about).
- Be supportive, humble, and clear. Help the student explain these concepts during their college viva or hackathon presentation.

Simulated Project Data:
- Current Monthly Bill: $${mockFinopsData.currentCost} (AWS: $520, Azure: $430, Google Cloud: $334)
- Projected Next Month Bill: $${mockFinopsData.predictedCost} (rising due to steady request traffic)
- Total Potential Savings: $${mockFinopsData.potentialSavings}/month ($3,912/year)
- Cloud Health Score: ${mockFinopsData.efficiencyScore}/100 (Grade B, solid start but with clear waste to clean up)
- Cost Breakdown: Compute 50% ($642), Storage 20% ($256), Database 20% ($256), Network 10% ($130)
- 4 Identified Fixes:
  1. Turn off Idle Compute ($84/mo) — analytics instance runs 24/7 at <10% CPU.
  2. Clean Unattached Storage ($52/mo) — orphaned EBS volumes sitting after deleted test VMs.
  3. Move to Serverless ($71/mo) — email/PDF generation only runs a few times a day; pay per run instead of 24/7 VM.
  4. Right-Size Resources ($119/mo) — downgrade large instances where memory never passes 30%.

Format your answer with short paragraphs, clear bullet points, and an encouraging tone.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    const reply = response.text || 'Unable to generate response at this time.';

    res.json({
      success: true,
      reply
    });
  } catch (error: any) {
    console.error('Error calling Gemini AI:', error);
    res.status(500).json({
      error: 'AI FinOps service error',
      details: error.message || String(error)
    });
  }
});

// Full-stack dev & production serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ZeroCost AI] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
