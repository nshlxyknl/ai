'use client';

import { useState, useRef, useEffect } from 'react';

type AIProvider = 'grok' | 'gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
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

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
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

        <div className="flex-1 overflow-y-auto px-3">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
           Specification based AI
          </div>
          <button
            onClick={() => setProvider('gemini')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
              provider === 'gemini'
                ? 'bg-white dark:bg-[#2a2a2a]'
                : 'hover:bg-white dark:hover:bg-[#2a2a2a]'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              
            </div>
            <span className="text-sm">Academics & Research</span>
          </button>
          <button
            onClick={() => setProvider('grok')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              provider === 'grok'
                ? 'bg-white dark:bg-[#2a2a2a]'
                : 'hover:bg-white dark:hover:bg-[#2a2a2a]'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
              
            </div>
            <span className="text-sm">Social Trends & Discussion</span>
          </button>
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
                    <div className="flex-shrink-0">
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
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-7">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mb-8 bg-[#f7f7f8] dark:bg-[#2a2a2a] -mx-4 px-4 py-6">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                        provider === 'gemini' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {provider === 'gemini' ? 'G' : 'X'}
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
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
