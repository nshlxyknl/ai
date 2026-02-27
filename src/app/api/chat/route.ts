import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { provider, messages } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    const grokKey = process.env.GROK_API_KEY;

    if (provider === 'gemini' && !geminiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    if (provider === 'grok' && !grokKey) {
      return NextResponse.json({ error: 'Grok API key not configured' }, { status: 500 });
    }

    let response;

    if (provider === 'gemini') {
      response = await callGemini(geminiKey!, messages);
    } else if (provider === 'grok') {
      response = await callGrok(grokKey!, messages);
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function callGemini(apiKey: string, messages: Message[]) {
  const lastMessage = messages[messages.length - 1];
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: lastMessage.content }]
        }]
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'No response';
}

async function callGrok(apiKey: string, messages: Message[]) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Grok API request failed');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response';
}
