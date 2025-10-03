import React from 'react';
import { Globe, AtSign, Mail, Smartphone } from 'lucide-react';
import { UserSettings } from '@/types';
import { ToggleSwitch } from './ToggleSwitch';

interface PrivacySettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
}

export default function PrivacySettings({ settings, updateSettings }: PrivacySettingsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Globe className="h-4 w-4 text-white" />
          </div>
          Profile Visibility
        </h3>
        <div className="space-y-3">
          {['public', 'friends', 'private'].map((option) => (
            <label key={option} className="flex items-center p-4 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200">
              <input
                type="radio"
                name="profileVisibility"
                value={option}
                checked={settings.privacy.profileVisibility === option}
                onChange={(e) => updateSettings('privacy', {
                  ...settings.privacy,
                  profileVisibility: e.target.value,
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-4 text-sm font-medium text-gray-800 capitalize">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-2xl border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
            <Mail className="h-4 w-4 text-white" />
          </div>
          Message Settings
        </h3>
        <div className="space-y-3">
          {['everyone', 'friends', 'none'].map((option) => (
            <label key={option} className="flex items-center p-4 rounded-xl hover:bg-green-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-green-200">
              <input
                type="radio"
                name="allowMessagesFrom"
                value={option}
                checked={settings.privacy.allowMessagesFrom === option}
                onChange={(e) => updateSettings('privacy', {
                  ...settings.privacy,
                  allowMessagesFrom: e.target.value,
                })}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <span className="ml-4 text-sm font-medium text-gray-800 capitalize">
                {option === 'none' ? 'No one' : option}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
            <AtSign className="h-4 w-4 text-white" />
          </div>
          Other Privacy Settings
        </h3>
        <div className="space-y-4">
          {[
            { key: 'showOnlineStatus', label: 'Show online status', icon: Globe },
            { key: 'allowTagging', label: 'Allow others to tag me', icon: AtSign },
            { key: 'showEmail', label: 'Show email address', icon: Mail },
            { key: 'showPhoneNumber', label: 'Show phone number', icon: Smartphone },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white/70 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center">
                <Icon className="h-5 w-5 text-purple-600 mr-4" />
                <span className="text-sm font-medium text-gray-800">{label}</span>
              </div>
              <ToggleSwitch
                checked={settings.privacy[key as keyof typeof settings.privacy] as boolean}
                onChange={(e: any) => updateSettings('privacy', {
                  ...settings.privacy,
                  [key]: e.target.checked,
                })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
