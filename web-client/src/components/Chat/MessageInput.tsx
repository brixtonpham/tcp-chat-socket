import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex items-end gap-2 md:gap-3">
        <div className={`flex-1 relative transition-all ${isFocused ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} rounded-xl`}>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={disabled ? 'User is offline...' : 'Type your message...'}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          {message.length > 0 && (
            <button
              type="button"
              onClick={() => setMessage('')}
              className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              title="Clear message"
            >
              <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="w-11 h-11 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 shadow-md hover:shadow-lg disabled:shadow-none"
          title={disabled ? 'Cannot send' : 'Send message (Enter)'}
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </Button>
      </div>

      {/* Character count and hint */}
      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {disabled ? 'Waiting for user to come online...' : 'Press Enter to send, Shift+Enter for new line'}
        </p>
        {message.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {message.length} characters
          </span>
        )}
      </div>
    </form>
  );
};
