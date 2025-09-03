import React from 'react';
import { Sun, Moon, Monitor, Upload } from 'lucide-react';
import { UserSettings } from '@/types';

interface AppearanceSettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
  uploadBackground: (file: File) => void;
}

export default function AppearanceSettings({ settings, updateSettings, uploadBackground }: AppearanceSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'auto', label: 'Auto', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateSettings('appearance', {
                ...settings.appearance,
                theme: value,
              })}
              className={`p-4 rounded-lg border-2 transition-colors ${
                settings.appearance.theme === value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Font Size</h3>
        <div className="space-y-3">
          {['small', 'medium', 'large'].map((size) => (
            <label key={size} className="flex items-center">
              <input
                type="radio"
                name="fontSize"
                value={size}
                checked={settings.appearance.fontSize === size}
                onChange={(e) => updateSettings('appearance', {
                  ...settings.appearance,
                  fontSize: e.target.value,
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700 capitalize">{size}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Background Image</h3>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {settings.appearance.backgroundImage && (
            <img
              src={settings.appearance.backgroundImage}
              alt="Background"
              className="h-20 w-20 object-cover rounded-lg"
            />
          )}
          <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded músicos-md hover:bg-blue-700 flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Upload Background
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadBackground(file);
              }}
            />
          </label>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Accent Color</h3>
        <input
          type="color"
          value={settings.appearance.accentColor}
          onChange={(e) => updateSettings('appearance', {
            ...settings.appearance,
            accentColor: e.target.value,
          })}
          className="h-12 w-24 rounded-md border border-gray-300 cursor-pointer"
        />
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Language</h3>
        <select
          value={settings.appearance.language}
          onChange={(e) => updateSettings('appearance', {
            ...settings.appearance,
            language: e.target.value,
          })}
          className="block w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
        </select>
      </div>
    </div>
  );
}