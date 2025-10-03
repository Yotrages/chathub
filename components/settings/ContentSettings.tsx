import React from 'react';
import { Play, EyeOff, X, Globe } from 'lucide-react';
import { UserSettings } from '@/types';
import { ToggleSwitch } from './ToggleSwitch';

interface ContentSettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
  setError: (error: string | null) => void;
}

export default function ContentSettings({ settings, updateSettings, setError } : ContentSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
            <Play className="h-4 w-4 text-white" />
          </div>
          Media Settings
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl border border-emerald-200">
            <div className="flex items-center">
              <Play className="h-5 w-5 text-emerald-600 mr-4" />
              <div>
                <span className="text-sm font-semibold text-gray-800">Auto-play videos</span>
                <p className="text-xs text-gray-600">Automatically play videos in your feed</p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.content.autoPlayVideos}
              onChange={(e: any) => updateSettings('content', {
                ...settings.content,
                autoPlayVideos: e.target.checked,
              })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl border border-emerald-200">
            <div className="flex items-center">
              <EyeOff className="h-5 w-5 text-emerald-600 mr-4" />
              <div>
                <span className="text-sm font-semibold text-gray-800">Show sensitive content</span>
                <p className="text-xs text-gray-600">Display potentially sensitive content</p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.content.showSensitiveContent}
              onChange={(e: any) => updateSettings('content', {
                ...settings.content,
                showSensitiveContent: e.target.checked,
              })}
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-violet-50 p-6 rounded-2xl border border-violet-100 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <Globe className="h-4 w-4 text-white" />
          </div>
          Content Languages
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].map((lang) => (
            <label key={lang} className="flex items-center p-3 rounded-xl hover:bg-violet-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-violet-200">
              <input
                type="checkbox"
                checked={settings.content.contentLanguages.includes(lang)}
                onChange={(e) => {
                  const newLanguages = e.target.checked
                    ? [...settings.content.contentLanguages, lang]
                    : settings.content.contentLanguages.filter((l) => l !== lang);
                  updateSettings('content', {
                    ...settings.content,
                    contentLanguages: newLanguages.length > 0 ? newLanguages : ['en'],
                  });
                }}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-800">
                {lang === 'en' ? 'English' :
                 lang === 'es' ? 'Spanish' :
                 lang === 'fr' ? 'French' :
                 lang === 'de' ? 'German' :
                 lang === 'it' ? 'Italian' :
                 lang === 'pt' ? 'Portuguese' :
                 lang === 'ja' ? 'Japanese' :
                 lang === 'ko' ? 'Korean' :
                 lang === 'zh' ? 'Chinese' : lang}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-red-50 p-6 rounded-2xl border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
            <X className="h-4 w-4 text-white" />
          </div>
          Blocked Keywords
        </h3>
        <div className="space-y-3">
          {settings.content.blockedKeywords.map((keyword, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-xl border border-red-200 hover:shadow-md transition-all duration-200">
              <span className="text-sm font-medium text-gray-800">{keyword}</span>
              <button
                onClick={() => {
                  const newKeywords = settings.content.blockedKeywords.filter((_, i) => i !== index);
                  updateSettings('content', {
                    ...settings.content,
                    blockedKeywords: newKeywords,
                  });
                }}
                className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-100 transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Add blocked keyword"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white hover:border-gray-400 transition-colors font-medium"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const keyword = e.currentTarget.value.trim();
                  if (keyword && !settings.content.blockedKeywords.includes(keyword)) {
                    if (keyword.length > 50) {
                      setError('Keyword cannot exceed 50 characters');
                      return;
                    }
                    if (!/^[a-zA-Z0-9\s]+$/.test(keyword)) {
                      setError('Keyword can only contain letters, numbers, and spaces');
                      return;
                    }
                    updateSettings('content', {
                      ...settings.content,
                      blockedKeywords: [...settings.content.blockedKeywords, keyword],
                    });
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
