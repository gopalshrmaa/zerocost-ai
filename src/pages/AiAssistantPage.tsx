import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, HelpCircle } from 'lucide-react';
import { FinOpsData } from '../types/finops.ts';

interface AiAssistantPageProps {
  data: FinOpsData;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

const SUGGESTED_QUESTIONS = [
  'Why is my cloud cost increasing?',
  'How can I reduce my AWS cost?',
  'Which cloud is cheapest?',
  'How much can I save?',
  'How do I explain this in my project viva?'
];

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hi there! I am your **ZeroCost AI Assistant** — a friendly cloud mentor for this project.

Here is a quick snapshot of our simulated cloud infrastructure:
• **Current Monthly Bill:** $${data.currentCost}/month
• **Predicted Next Month:** $${data.predictedCost}/month (+10.4%)
• **Identified Savings:** $${data.potentialSavings}/month across 4 fixes
• **Efficiency Score:** ${data.efficiencyScore}/100 (Grade B)

Feel free to click any of the suggested questions below or ask me to explain how any number is calculated!`
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageToSend?: string) => {
    const text = messageToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() })
      });
      const resData = await res.json();
      const reply = resData.reply || 'I am currently unable to answer that question.';

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: reply
        }
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: 'An error occurred while connecting to the AI service. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">ZeroCost AI Assistant</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ask questions about your simulated cloud costs.
        </p>
      </div>

      {/* Chat Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm flex flex-col h-[520px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-line'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Thinking with Gemini AI...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 shrink-0 font-medium">Quick Prompts:</span>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="shrink-0 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question (e.g. 'Why is compute 50% of the cost?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
