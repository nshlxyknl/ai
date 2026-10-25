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

interface GroqExecutedTool {
  type?: string;
  search_results?: {
    results?: Array<{ title?: string; url?: string }>;
  };
}

async function callGrok(messages: Message[]): Promise<ChatResult> {
  const apiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_INSTRUCTION}

Current date: ${new Date().toISOString().slice(0, 10)}. Use the browser_search tool for current events and recent information. Cite sources inline as markdown links using the URLs from the search results when possible.`,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      tools: [{ type: 'browser_search' }] as unknown as OpenAI.Chat.ChatCompletionTool[],
      tool_choice: 'auto',
      temperature: 1,
      max_completion_tokens: 2048,
      reasoning_effort: 'low',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/invalid api key|unauthorized/i.test(message)) {
      throw new Error(
        'GROK_API_KEY is not a valid Groq key. Create one at https://console.groq.com/keys.'
      );
    }
    throw error;
  }

  const choice = completion.choices[0];
  const message = (choice?.message?.content ?? '').replace(/【[^】]*】/g, '').trim();
  const executedTools =
    (choice?.message as unknown as { executed_tools?: GroqExecutedTool[] })?.executed_tools ?? [];

  const sources: Source[] = [];
  for (const tool of executedTools) {
    for (const result of tool.search_results?.results ?? []) {
      if (result.url) {
        sources.push({
          title: result.title || formatTitle(result.url),
          url: result.url,
        });
      }
    }
  }

  return {
    message: message || 'No response',
    sources: dedupeSources(sources).slice(0, 6),
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
