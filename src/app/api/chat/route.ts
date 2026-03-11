import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { provider, messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (provider === 'gemini' && !geminiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    if (provider !== 'gemini') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const response = await callGemini(geminiKey!, messages);

    return NextResponse.json({ message: response });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function callGemini(apiKey: string, messages: Message[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
  });

  return response.text ?? 'No response';
}

