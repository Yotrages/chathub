'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string, name: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EmojiReactions: React.FC<EmojiPickerProps> = ({ onEmojiSelect, isOpen, onClose }) => {
  const reactionsIcon = [
    { emoji: '👍', name: 'Like' },
    { emoji: '❤️', name: 'Love' },
    { emoji: '😂', name: 'Laugh' },
    { emoji: '😮', name: 'Wow' },
    { emoji: '😢', name: 'Sad' },
    { emoji: '😡', name: 'Angry' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Choose Reaction</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {reactionsIcon.map((emoji, index) => (
            <button
              key={index}
              onClick={() => {
                onEmojiSelect(emoji.emoji, emoji.name);
                onClose();
              }}
              className="text-2xl p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {emoji.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiReactions;