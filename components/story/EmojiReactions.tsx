'use client';

import React from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiReactions: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const emojis = [
    '❤️', '😂', '😮', '😢', '😡', '👍', '👎'
  ];

  return (
    <div className="flex items-center gap-1">
      {emojis.map((emoji, index) => (
        <button
          key={index}
          onClick={() => onEmojiSelect(emoji)}
          className="text-xl p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200 active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiReactions;