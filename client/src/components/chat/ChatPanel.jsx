import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import { Button } from '../ui/Button';

const ChatPanel = ({ chatChannel }) => {
  const { messages, sendMessage } = useChat(chatChannel, true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary">
      <div className="p-4 border-b border-border bg-elevated">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          Room Chat
          <span className="bg-accent/20 text-accent px-2 py-0.5 rounded-full text-xs">
            {messages.length}
          </span>
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            Say hi to your partner 👋
          </div>
        ) : (
          messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-elevated border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-primary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-text-primary"
          />
          <Button type="submit" size="sm" disabled={!input.trim()} icon={Send} />
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
