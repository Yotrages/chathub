import { Check, Palette, X } from 'lucide-react';
import React, { useState } from 'react';

export function ColorPicker({ value, onChange, label = "Choose Color" }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(value);
  const [showCustom, setShowCustom] = useState(false);

  const presetColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#f43f5e', '#22d3ee', '#a855f7', '#eab308'
  ];

  const handleApplyColor = () => {
    onChange(tempColor);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempColor(value);
    setIsOpen(false);
    setShowCustom(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-800 mb-3">{label}</label>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative h-14 w-28 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-lg overflow-hidden transform hover:scale-105"
        style={{ backgroundColor: value }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Palette className="h-5 w-5 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-2xl max-w-md w-full p-6 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Color</h3>
              <button
                onClick={handleCancel}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <div 
                className="h-16 w-full rounded-xl border-2 border-gray-200 shadow-inner"
                style={{ backgroundColor: tempColor }}
              ></div>
              <p className="text-center text-sm text-gray-600 mt-2 font-mono">{tempColor}</p>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preset Colors</h4>
              <div className="grid grid-cols-5 gap-3">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setTempColor(color)}
                    className={`h-10 w-full rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      tempColor === color ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {tempColor === color && (
                      <Check className="h-4 w-4 text-white mx-auto drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showCustom ? 'Hide' : 'Show'} Custom Color Picker
              </button>
              {showCustom && (
                <div className="mt-3">
                  <input
                    type="color"
                    value={tempColor}
                    onChange={(e) => setTempColor(e.target.value)}
                    className="h-12 w-full rounded-lg border border-gray-300 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyColor}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Apply Color
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
