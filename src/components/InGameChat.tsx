import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Smile, MessageSquare } from 'lucide-react';
import { ChatMessage, PlayerId } from '../types';
import { sound } from '../game/audio';

interface InGameChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, isQuickEmote?: boolean) => void;
  currentUserRole: PlayerId;
  opponentName: string;
}

const QUICK_EMOTES = [
  '👋 Hello!',
  '👏 Great move!',
  '🔥 Epic jump!',
  '🤔 Thinking...',
  '⚡ Double jump incoming!',
  '😅 Close one!',
  '🤝 Well played!',
  '🔄 Rematch?',
];

export const InGameChat: React.FC<InGameChatProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserRole,
  opponentName,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    sound.playButtonClick();
    onSendMessage(text, false);
    setInputText('');
  };

  const handleQuickEmote = (emote: string) => {
    sound.playButtonClick();
    onSendMessage(emote, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full sm:max-w-md h-[80vh] sm:h-[550px] bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Chat Header */}
        <div className="p-4 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-100">Match Chat</h3>
              <p className="text-[11px] text-stone-400">Playing with {opponentName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 text-xs px-6">
              <Smile className="w-8 h-8 mb-2 opacity-50 text-amber-400" />
              <p>Say hello or use quick tactical emotes to communicate with your opponent!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === currentUserRole;
              const isSystem = msg.sender === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <span className="px-2.5 py-1 rounded-full bg-stone-800/80 text-[11px] text-amber-400 font-medium">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-stone-400 mb-0.5 px-1 font-medium">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs font-medium shadow ${
                      isMe
                        ? 'bg-amber-500 text-stone-950 rounded-tr-xs'
                        : 'bg-stone-800 text-stone-100 rounded-tl-xs border border-stone-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Tactical Emotes */}
        <div className="px-3 py-2 bg-stone-950/50 border-t border-stone-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_EMOTES.map((emote, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickEmote(emote)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-medium border border-stone-700/60 transition cursor-pointer active:scale-95"
            >
              {emote}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <form onSubmit={handleSend} className="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            maxLength={100}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 py-2 px-3.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
