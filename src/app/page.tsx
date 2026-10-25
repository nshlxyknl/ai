'use client';

import { useState, useRef, useEffect } from 'react';

type AIProvider = 'grok' | 'gemini';

interface Source {
  title: string;
  url: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const normalized = text.replace(/\[\[(\d+)\]\]\((https?:\/\/[^)\s]+)\)/g, '[$1]($2)');
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of normalized.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(normalized.slice(lastIndex, index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${index}`;

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code key={key} className="rounded bg-gray-200 px-1.5 py-0.5 text-sm dark:bg-gray-700">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      if (link) {
        nodes.push(
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline decoration-blue-400/50 underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {link[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < normalized.length) {
    nodes.push(normalized.slice(lastIndex));
  }

  return nodes;
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-gray-900 dark:text-gray-100 leading-7">
      {content.split('\n').map((line, index) => {
        const key = `line-${index}`;

        if (!line.trim()) {
          return <div key={key} className="h-2" />;
        }

        const heading = line.match(/^(#{1,4})\s+(.*)$/);
        if (heading) {
          const level = heading[1].length;
          const className =
            level === 1
              ? 'text-xl font-bold'
              : level === 2
                ? 'text-lg font-semibold'
                : 'text-base font-semibold';
          return (
            <p key={key} className={className}>
              {renderInline(heading[2], key)}
            </p>
          );
        }

        const bullet = line.match(/^\s*[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={key} className="flex gap-2 pl-1">
              <span className="select-none">•</span>
              <span className="flex-1">{renderInline(bullet[1], key)}</span>
            </div>
          );
        }

        const numbered = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (numbered) {
          return (
            <div key={key} className="flex gap-2 pl-1">
              <span className="select-none">{numbered[1]}.</span>
              <span className="flex-1">{renderInline(numbered[2], key)}</span>
            </div>
          );
        }

        return <p key={key}>{renderInline(line, key)}</p>;
      })}
    </div>
  );
}

export default function ChatPage() {
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.message, sources: data.sources ?? [] },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#212121]">
      {/* Sidebar */}
      <div className="w-64 bg-[#f7f7f8] dark:bg-[#171717] border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New chat</span>
          </button>
        </div>

        {/* Provider Selection */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gemini">Gemini (free)</option>
            <option value="grok">Grok (free via Groq)</option>
          </select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl px-4">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-semibold mb-4 text-gray-900 dark:text-white">
                  How can I help you today?
                </h2>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-8 ${msg.role === 'user' ? '' : 'bg-[#f7f7f8] dark:bg-[#2a2a2a] -mx-4 px-4 py-6'}`}>
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="shrink-0">
                      {msg.role === 'user' ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          U
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                          provider === 'gemini' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}>
                          {provider === 'gemini' ? 'G' : 'X'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <Markdown content={msg.content} />
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Sources
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.sources.map((source) => (
                              <a
                                key={source.url}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="max-w-xs truncate rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-300 dark:hover:text-blue-400"
                              >
                                {source.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="mb-8 bg-[#f7f7f8] dark:bg-[#2a2a2a] -mx-4 px-4 py-6">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                        provider === 'gemini' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {provider === 'gemini' ? 'G' : 'X'}
                      </div>
                    </div>
                    <div className="flex flex-1 items-center gap-3 pt-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Searching the web...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#212121]">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Message AI..."
                disabled={loading}
                rows={1}
                className="w-full resize-none rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                style={{ minHeight: '52px', maxHeight: '200px' }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 bottom-2 p-2 rounded-full bg-black dark:bg-white text-white dark:text-black disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </form>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}