import React from 'react';
import { Globe, AtSign, Mail, Smartphone } from 'lucide-react';
import { UserSettings } from '@/types';

interface PrivacySettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
}

export default function PrivacySettings({ settings, updateSettings }: PrivacySettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Visibility</h3>
        <div className="space-y-3">
          {['public', 'friends', 'private'].map((option) => (
            <label key={option} className="flex items-center">
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
              <span className="ml-3 text-sm text-gray-700 capitalize">{option}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Message Settings</h3>
        <div className="space-y-3">
          {['everyone', 'friends', 'none'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="allowMessagesFrom"
                value={option}
                checked={settings.privacy.allowMessagesFrom === option}
                onChange={(e) => updateSettings('privacy', {
                  ...settings.privacy,
                  allowMessagesFrom: e.target.value,
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700 capitalize">
                {option === 'none' ? 'No one' : option}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Other Privacy Settings</h3>
        {[
          { key: 'showOnlineStatus', label: 'Show online status', icon: Globe },
          { key: 'allowTagging', label: 'Allow others to tag me', icon: AtSign },
          { key: 'showEmail', label: 'Show email address', icon: Mail },
          { key: 'showPhoneNumber', label: 'Show phone number', icon: Smartphone },
        ].map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">{label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy[key as keyof typeof settings.privacy] as boolean}
                onChange={(e) => updateSettings('privacy', {
                  ...settings.privacy,
                  [key]: e.target.checked,
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}