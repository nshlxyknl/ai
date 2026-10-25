import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Source {
  title: string;
  url: string;
}

interface ChatResult {
  message: string;
  sources: Source[];
}

const SYSTEM_INSTRUCTION =
  'You are a helpful assistant with live web search. Use search for current events, recent information, and factual claims, and cite your sources.';

export async function POST(req: NextRequest) {
  try {
    const { provider, messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (provider !== 'gemini' && provider !== 'grok') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const result =
      provider === 'gemini'
        ? await callGemini(messages)
        : await callGrok(messages);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function callGemini(messages: Message[]): Promise<ChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
  });

  const sources: Source[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  for (const chunk of chunks) {
    const web = chunk.web;
    if (web?.uri) {
      sources.push({
        title: web.title || formatTitle(web.uri),
        url: web.uri,
      });
    }
  }

  return {
    message: response.text ?? 'No response',
    sources: dedupeSources(sources),
  };
}

async function callGrok(messages: Message[]): Promise<ChatResult> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error('Grok API key not configured');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.x.ai/v1',
  });

  let response;
  try {
    response = await client.responses.create({
      model: 'grok-4.7',
      instructions: SYSTEM_INSTRUCTION,
      input: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      tools: [{ type: 'web_search' }],
      store: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/incorrect api key|invalid api key|unauthorized/i.test(message)) {
      throw new Error(
        'GROK_API_KEY is not a valid xAI key. xAI keys start with "xai-" (the current value looks like a Groq key). Create one at https://console.x.ai.'
      );
    }
    throw error;
  }

  const sources: Source[] = [];
  const citations = (response as unknown as { citations?: string[] }).citations ?? [];

  for (const url of citations) {
    sources.push({ title: formatTitle(url), url });
  }

  for (const item of response.output) {
    if (item.type !== 'message') continue;

    for (const part of item.content) {
      if (part.type !== 'output_text') continue;

      for (const annotation of part.annotations) {
        if (annotation.type === 'url_citation') {
          sources.push({
            title: annotation.title || formatTitle(annotation.url),
            url: annotation.url,
          });
        }
      }
    }
  }

  return {
    message: response.output_text || 'No response',
    sources: dedupeSources(sources),
  };
}

function dedupeSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

function formatTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
