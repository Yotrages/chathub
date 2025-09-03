import React from 'react';
import { Play, EyeOff, X } from 'lucide-react';
import { UserSettings } from '@/types';

interface ContentSettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
  setError: (error: string | null) => void;
}

export default function ContentSettings({ settings, updateSettings, setError }: ContentSettingsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Media Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Play className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <span className="text-sm font-medium text-gray-700">Auto-play videos</span>
                <p className="text-xs text-gray-500">Automatically play videos in your feed</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.content.autoPlayVideos}
                onChange={(e) => updateSettings('content', {
                  ...settings.content,
                  autoPlayVideos: e.target.checked,
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <EyeOff className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <span className="text-sm font-medium text-gray-700">Show sensitive content</span>
                <p className="text-xs text-gray-500">Display potentially sensitive content</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.content.showSensitiveContent}
                onChange={(e) => updateSettings('content', {
                  ...settings.content,
                  showSensitiveContent: e.target.checked,
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Languages</h3>
        <div className="space-y-2">
          {['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].map((lang) => (
            <label key={lang} className="flex items-center">
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
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
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Blocked Keywords</h3>
        <div className="space-y-2">
          {settings.content.blockedKeywords.map((keyword, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <span className="text-sm text-gray-700">{keyword}</span>
              <button
                onClick={() => {
                  const newKeywords = settings.content.blockedKeywords.filter((_, i) => i !== index);
                  updateSettings('content', {
                    ...settings.content,
                    blockedKeywords: newKeywords,
                  });
                }}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add blocked keyword"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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